-- ============================================================================
-- ShareBite: Demo Seed Data Script for Viva & Project Review
-- ============================================================================
-- Run this script in your Supabase SQL Editor if you want to quickly populate
-- realistic sample data (donations, verified NGOs, open pickups, and impact stats).
-- ============================================================================

DO $$
DECLARE
  v_donor_id uuid;
  v_ngo_id uuid;
  v_vol_id uuid;
  v_donation1_id uuid := gen_random_uuid();
  v_donation2_id uuid := gen_random_uuid();
  v_donation3_id uuid := gen_random_uuid();
  v_donation4_id uuid := gen_random_uuid();
BEGIN
  -- 1. Grab existing profile IDs or generate fallback demo profiles
  SELECT id INTO v_donor_id FROM public.profiles WHERE organization_name IS NOT NULL LIMIT 1;
  IF v_donor_id IS NULL THEN
    SELECT id INTO v_donor_id FROM public.profiles LIMIT 1;
  END IF;

  SELECT user_id INTO v_ngo_id FROM public.ngo_profiles LIMIT 1;
  IF v_ngo_id IS NULL THEN
    SELECT id INTO v_ngo_id FROM public.profiles WHERE id <> v_donor_id LIMIT 1;
  END IF;

  SELECT user_id INTO v_vol_id FROM public.volunteer_profiles LIMIT 1;
  IF v_vol_id IS NULL THEN
    SELECT id INTO v_vol_id FROM public.profiles WHERE id NOT IN (v_donor_id, COALESCE(v_ngo_id, gen_random_uuid())) LIMIT 1;
  END IF;

  IF v_donor_id IS NULL THEN
    RAISE NOTICE 'No registered users found yet in auth. Sign up at least one account via the web app before running the seed.';
    RETURN;
  END IF;

  -- 2. Insert sample food donations
  INSERT INTO public.food_donations (
    id, donor_id, food_name, description, category, quantity, quantity_unit,
    servings, available_until, storage_method, allergens, pickup_address, status
  )
  VALUES 
    (
      v_donation1_id,
      v_donor_id,
      'Fresh Vegetable Biryani & Dal Makhani',
      'Prepared for lunch banquet, packaged in food-grade insulated containers. Kept at hot-hold.',
      'cooked',
      25.0,
      'kg',
      60,
      now() + interval '3 hours',
      'hot_hold',
      'Contains dairy (butter/cream). Nut-free.',
      'Grand Orchid Hotel Kitchen, 42 MG Road, Central District',
      'available'
    ),
    (
      v_donation2_id,
      v_donor_id,
      'Artisan Sourdough & Multigrain Loaves',
      'Baked this morning. Fresh surplus from evening retail shift.',
      'bakery',
      18.0,
      'portions',
      35,
      now() + interval '8 hours',
      'ambient',
      'Contains gluten / wheat.',
      'Bakers Table Cafe, 12 Park Avenue, Sector 4',
      'available'
    ),
    (
      v_donation3_id,
      v_donor_id,
      'Crate of Fresh Tomatoes, Peppers & Cucumbers',
      'Unsold organic produce, perfectly ripe and edible.',
      'produce',
      40.0,
      'kg',
      80,
      now() + interval '24 hours',
      'ambient',
      'No allergens.',
      'Greenfield Organic Market, Stall 9, Metro Plaza',
      'available'
    ),
    (
      v_donation4_id,
      v_donor_id,
      'Steamed Jasmine Rice & Veggie Curry',
      'Surplus from college annual fest canteen catering.',
      'cooked',
      30.0,
      'kg',
      75,
      now() - interval '2 days',
      'ambient',
      'None',
      'University Student Canteen, North Campus',
      'delivered'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 3. If NGO exists, insert a sample request and pickup
  IF v_ngo_id IS NOT NULL THEN
    -- Ensure NGO profile is verified
    UPDATE public.ngo_profiles
    SET verification_status = 'verified'
    WHERE user_id = v_ngo_id;

    -- Create completed delivery record for impact statistics
    INSERT INTO public.pickups (
      donation_id,
      ngo_id,
      volunteer_id,
      pickup_location,
      delivery_location,
      status,
      accepted_at,
      picked_up_at,
      delivered_at
    )
    VALUES (
      v_donation4_id,
      v_ngo_id,
      v_vol_id,
      'University Student Canteen, North Campus',
      'City Hope Community Kitchen, 88 Civil Lines',
      'delivered',
      now() - interval '2 days',
      now() - interval '2 days' + interval '30 minutes',
      now() - interval '2 days' + interval '1 hour'
    )
    ON CONFLICT (donation_id) DO NOTHING;
  END IF;

  RAISE NOTICE 'Demo seed data successfully generated!';
END $$;
