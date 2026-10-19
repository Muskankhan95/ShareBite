-- ============================================================================
-- Migration: 20261019232000_redistribution_workflow_and_ai_matching.sql
-- ShareBite: End-to-End Workflow RPCs, Pickups RLS, and AI Urgency Engine
-- ============================================================================

-- 1. Ensure authenticated users have INSERT permission on pickups with RLS
GRANT INSERT, SELECT, UPDATE ON public.pickups TO authenticated;

-- Allow donors to create pickups for their accepted donations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pickups' AND policyname = 'Donors create pickups upon request approval'
  ) THEN
    CREATE POLICY "Donors create pickups upon request approval" 
      ON public.pickups 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.food_donations d 
          WHERE d.id = pickups.donation_id AND d.donor_id = auth.uid()
        )
        OR public.has_role(auth.uid(), 'admin')
      );
  END IF;
END $$;

-- 2. Approve food request & initiate volunteer pickup task
CREATE OR REPLACE FUNCTION public.approve_food_request(p_request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_req record;
  v_donation record;
  v_ngo_address text;
  v_pickup record;
BEGIN
  -- Fetch the request
  SELECT * INTO v_req FROM public.food_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Fetch the donation
  SELECT * INTO v_donation FROM public.food_donations WHERE id = v_req.donation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated donation not found';
  END IF;

  -- Verify authorization (must be the donor or admin)
  IF v_donation.donor_id <> v_caller AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: only the donation owner or an admin can approve requests';
  END IF;

  -- Update this request to approved
  UPDATE public.food_requests
  SET status = 'approved', updated_at = now()
  WHERE id = p_request_id;

  -- Decline other pending requests for the same donation
  UPDATE public.food_requests
  SET status = 'declined', updated_at = now()
  WHERE donation_id = v_donation.id AND id <> p_request_id AND status = 'pending';

  -- Update donation status to accepted
  UPDATE public.food_donations
  SET status = 'accepted', updated_at = now()
  WHERE id = v_donation.id;

  -- Retrieve destination address from ngo_profiles or profiles
  SELECT COALESCE(np.address, p.address, 'Designated NGO Drop-off Point')
  INTO v_ngo_address
  FROM public.profiles p
  LEFT JOIN public.ngo_profiles np ON np.user_id = p.id
  WHERE p.id = v_req.ngo_id;

  -- Insert or update the pickup entry
  INSERT INTO public.pickups (
    donation_id,
    ngo_id,
    pickup_location,
    delivery_location,
    status
  )
  VALUES (
    v_donation.id,
    v_req.ngo_id,
    v_donation.pickup_address,
    COALESCE(v_ngo_address, v_donation.pickup_address),
    'open'
  )
  ON CONFLICT (donation_id) DO UPDATE
  SET 
    ngo_id = EXCLUDED.ngo_id,
    pickup_location = EXCLUDED.pickup_location,
    delivery_location = EXCLUDED.delivery_location,
    status = 'open',
    volunteer_id = NULL,
    accepted_at = NULL,
    picked_up_at = NULL,
    delivered_at = NULL,
    updated_at = now()
  RETURNING * INTO v_pickup;

  -- Insert notification for NGO
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_req.ngo_id,
    'Food Request Approved! 🎉',
    'Your request for "' || v_donation.food_name || '" has been accepted! A volunteer pickup task is now open.',
    'request'
  );

  RETURN json_build_object(
    'ok', true,
    'request_id', p_request_id,
    'donation_id', v_donation.id,
    'pickup_id', v_pickup.id
  );
END;
$$;

-- 3. Decline food request
CREATE OR REPLACE FUNCTION public.decline_food_request(p_request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_req record;
  v_donation record;
BEGIN
  SELECT * INTO v_req FROM public.food_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  SELECT * INTO v_donation FROM public.food_donations WHERE id = v_req.donation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Associated donation not found';
  END IF;

  IF v_donation.donor_id <> v_caller AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.food_requests
  SET status = 'declined', updated_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_req.ngo_id,
    'Food Request Update',
    'Your request for "' || v_donation.food_name || '" was declined by the donor.',
    'request'
  );

  RETURN json_build_object('ok', true);
END;
$$;

-- 4. Volunteer advance pickup progress (picked_up -> delivered)
CREATE OR REPLACE FUNCTION public.advance_pickup_status(p_pickup_id uuid, p_status text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_pickup record;
  v_donation record;
BEGIN
  IF p_status NOT IN ('picked_up', 'delivered') THEN
    RAISE EXCEPTION 'Invalid status transition: %', p_status;
  END IF;

  SELECT * INTO v_pickup FROM public.pickups WHERE id = p_pickup_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pickup task not found';
  END IF;

  IF v_pickup.volunteer_id <> v_caller AND NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: only the assigned volunteer can advance this pickup';
  END IF;

  SELECT * INTO v_donation FROM public.food_donations WHERE id = v_pickup.donation_id;

  IF p_status = 'picked_up' THEN
    UPDATE public.pickups
    SET status = 'picked_up', picked_up_at = now(), updated_at = now()
    WHERE id = p_pickup_id;

    IF v_donation.id IS NOT NULL THEN
      UPDATE public.food_donations
      SET status = 'in_transit', updated_at = now()
      WHERE id = v_donation.id;

      -- Notify NGO and Donor
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES 
        (v_pickup.ngo_id, 'Courier On The Way 🚚', 'Volunteer courier has picked up "' || v_donation.food_name || '" and is en route.', 'pickup'),
        (v_donation.donor_id, 'Donation Picked Up', 'Volunteer courier has collected "' || v_donation.food_name || '" from your location.', 'pickup');
    END IF;

  ELSIF p_status = 'delivered' THEN
    UPDATE public.pickups
    SET status = 'delivered', delivered_at = now(), updated_at = now()
    WHERE id = p_pickup_id;

    IF v_donation.id IS NOT NULL THEN
      UPDATE public.food_donations
      SET status = 'delivered', updated_at = now()
      WHERE id = v_donation.id;

      -- Notify NGO and Donor
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES 
        (v_pickup.ngo_id, 'Donation Delivered! 🍽️', '"' || v_donation.food_name || '" has been safely delivered to your facility.', 'donation'),
        (v_donation.donor_id, 'Donation Completed! 🌟', '"' || v_donation.food_name || '" was successfully delivered to the NGO. Thank you for your impact!', 'donation');
    END IF;
  END IF;

  RETURN json_build_object('ok', true, 'status', p_status);
END;
$$;

-- 5. AI Matching & Urgency Engine
CREATE OR REPLACE FUNCTION public.calculate_food_urgency(p_available_until timestamptz)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 
    CASE 
      WHEN p_available_until <= now() THEN 100.0
      WHEN EXTRACT(EPOCH FROM (p_available_until - now())) / 3600.0 <= 3.0 THEN 95.0
      WHEN EXTRACT(EPOCH FROM (p_available_until - now())) / 3600.0 <= 6.0 THEN 85.0
      WHEN EXTRACT(EPOCH FROM (p_available_until - now())) / 3600.0 <= 12.0 THEN 70.0
      WHEN EXTRACT(EPOCH FROM (p_available_until - now())) / 3600.0 <= 24.0 THEN 50.0
      ELSE 25.0
    END;
$$;

-- 6. Admin Verification RPC
CREATE OR REPLACE FUNCTION public.admin_set_verification_status(
  p_user_id uuid,
  p_role text,
  p_status text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_enum_status public.verification_status;
BEGIN
  IF NOT public.has_role(v_caller, 'admin') THEN
    RAISE EXCEPTION 'Admin authorization required';
  END IF;

  v_enum_status := p_status::public.verification_status;

  IF p_role = 'ngo' THEN
    UPDATE public.ngo_profiles
    SET verification_status = v_enum_status, updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF p_role = 'donor' THEN
    UPDATE public.donor_profiles
    SET verification_status = v_enum_status, updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF p_role = 'volunteer' THEN
    UPDATE public.volunteer_profiles
    SET verification_status = v_enum_status, updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Notify user of verification status change
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    p_user_id,
    'Account Verification Update',
    'Your ' || upper(p_role) || ' verification status has been set to: ' || upper(p_status) || '.',
    'verification'
  );

  RETURN json_build_object('ok', true, 'status', p_status);
END;
$$;

-- Grant execute permissions to authenticated
GRANT EXECUTE ON FUNCTION public.approve_food_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_food_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.advance_pickup_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_food_urgency(timestamptz) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_verification_status(uuid, text, text) TO authenticated;
