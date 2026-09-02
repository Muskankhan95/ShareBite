-- Enums
CREATE TYPE public.user_status AS ENUM ('active', 'suspended');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.donation_status AS ENUM ('available', 'requested', 'accepted', 'in_transit', 'delivered', 'expired', 'cancelled');
CREATE TYPE public.food_category AS ENUM ('cooked', 'raw', 'packaged', 'bakery', 'dairy', 'produce', 'other');
CREATE TYPE public.storage_method AS ENUM ('ambient', 'refrigerated', 'frozen', 'hot_hold');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'declined', 'cancelled');
CREATE TYPE public.match_status AS ENUM ('suggested', 'notified', 'accepted', 'expired');
CREATE TYPE public.pickup_status AS ENUM ('open', 'assigned', 'picked_up', 'delivered', 'cancelled');
CREATE TYPE public.notification_type AS ENUM ('donation', 'request', 'pickup', 'verification', 'system');

-- Users (public.profiles is the app-level user record; credentials live in auth)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status public.user_status NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles (status);

-- Role profiles ------------------------------------------------------------
CREATE TABLE public.donor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_name text,
  address text,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ngo_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  address text NOT NULL,
  contact_person text,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  capacity integer CHECK (capacity IS NULL OR capacity >= 0),
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.volunteer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  address text,
  availability_status boolean NOT NULL DEFAULT true,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ngo_profiles_verification_idx ON public.ngo_profiles (verification_status);
CREATE INDEX volunteer_profiles_verification_idx ON public.volunteer_profiles (verification_status);

-- Food donations -----------------------------------------------------------
CREATE TABLE public.food_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  food_name text NOT NULL CHECK (char_length(btrim(food_name)) BETWEEN 2 AND 150),
  description text CHECK (description IS NULL OR char_length(description) <= 2000),
  category public.food_category NOT NULL DEFAULT 'cooked',
  quantity numeric(10, 2) NOT NULL CHECK (quantity > 0),
  quantity_unit text NOT NULL DEFAULT 'kg' CHECK (quantity_unit IN ('kg', 'portions', 'packets', 'trays', 'litres')),
  servings integer NOT NULL CHECK (servings > 0),
  preparation_time timestamptz,
  available_until timestamptz NOT NULL,
  storage_method public.storage_method NOT NULL DEFAULT 'ambient',
  allergens text,
  image_url text,
  pickup_address text NOT NULL,
  latitude double precision CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  status public.donation_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT food_donations_window_valid CHECK (preparation_time IS NULL OR available_until > preparation_time)
);

CREATE INDEX food_donations_donor_idx ON public.food_donations (donor_id, created_at DESC);
CREATE INDEX food_donations_status_idx ON public.food_donations (status, available_until);
CREATE INDEX food_donations_available_until_idx ON public.food_donations (available_until);

-- Food requests ------------------------------------------------------------
CREATE TABLE public.food_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  donation_id uuid NOT NULL REFERENCES public.food_donations(id) ON DELETE CASCADE,
  requested_quantity numeric(10, 2) NOT NULL CHECK (requested_quantity > 0),
  note text CHECK (note IS NULL OR char_length(note) <= 1000),
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ngo_id, donation_id)
);

CREATE INDEX food_requests_donation_idx ON public.food_requests (donation_id, status);
CREATE INDEX food_requests_ngo_idx ON public.food_requests (ngo_id, created_at DESC);

-- Matches ------------------------------------------------------------------
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL REFERENCES public.food_donations(id) ON DELETE CASCADE,
  ngo_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score numeric(5, 2) NOT NULL DEFAULT 0 CHECK (match_score BETWEEN 0 AND 100),
  distance_km numeric(8, 2) CHECK (distance_km IS NULL OR distance_km >= 0),
  urgency_score numeric(5, 2) NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 100),
  status public.match_status NOT NULL DEFAULT 'suggested',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (donation_id, ngo_id)
);

CREATE INDEX matches_ngo_idx ON public.matches (ngo_id, match_score DESC);

-- Pickups ------------------------------------------------------------------
CREATE TABLE public.pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid NOT NULL UNIQUE REFERENCES public.food_donations(id) ON DELETE CASCADE,
  volunteer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ngo_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pickup_location text NOT NULL,
  delivery_location text NOT NULL,
  status public.pickup_status NOT NULL DEFAULT 'open',
  accepted_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pickups_assignment_valid CHECK (status = 'open' OR status = 'cancelled' OR volunteer_id IS NOT NULL)
);

CREATE INDEX pickups_status_idx ON public.pickups (status, created_at DESC);
CREATE INDEX pickups_volunteer_idx ON public.pickups (volunteer_id, status);
CREATE INDEX pickups_ngo_idx ON public.pickups (ngo_id, status);

-- Notifications ------------------------------------------------------------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'system',
  read_status boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_idx ON public.notifications (user_id, read_status, created_at DESC);

-- Reviews ------------------------------------------------------------------
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewed_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  donation_id uuid REFERENCES public.food_donations(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text CHECK (comment IS NULL OR char_length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_no_self CHECK (reviewer_id <> reviewed_user_id),
  UNIQUE (reviewer_id, reviewed_user_id, donation_id)
);

CREATE INDEX reviews_reviewed_idx ON public.reviews (reviewed_user_id, created_at DESC);

-- updated_at triggers ------------------------------------------------------
CREATE TRIGGER donor_profiles_set_updated_at BEFORE UPDATE ON public.donor_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER ngo_profiles_set_updated_at BEFORE UPDATE ON public.ngo_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER volunteer_profiles_set_updated_at BEFORE UPDATE ON public.volunteer_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER food_donations_set_updated_at BEFORE UPDATE ON public.food_donations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER food_requests_set_updated_at BEFORE UPDATE ON public.food_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pickups_set_updated_at BEFORE UPDATE ON public.pickups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grants -------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE ON public.donor_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ngo_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.volunteer_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.food_donations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.food_requests TO authenticated;
GRANT SELECT ON public.matches TO authenticated;
GRANT SELECT, UPDATE ON public.pickups TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.donor_profiles, public.ngo_profiles, public.volunteer_profiles,
  public.food_donations, public.food_requests, public.matches, public.pickups,
  public.notifications, public.reviews TO service_role;

-- RLS ----------------------------------------------------------------------
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donor profile readable by signed-in users" ON public.donor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own donor profile" ON public.donor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own donor profile" ON public.donor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update donor profiles" ON public.donor_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "NGO profile readable by signed-in users" ON public.ngo_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own ngo profile" ON public.ngo_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ngo profile" ON public.ngo_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND verification_status = (SELECT p.verification_status FROM public.ngo_profiles p WHERE p.id = ngo_profiles.id));
CREATE POLICY "Admins update ngo profiles" ON public.ngo_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Volunteer profile readable by signed-in users" ON public.volunteer_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own volunteer profile" ON public.volunteer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own volunteer profile" ON public.volunteer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update volunteer profiles" ON public.volunteer_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Donors read own donations" ON public.food_donations FOR SELECT TO authenticated USING (auth.uid() = donor_id);
CREATE POLICY "Partners read active donations" ON public.food_donations FOR SELECT TO authenticated USING (
  status <> 'cancelled' AND (
    public.has_role(auth.uid(), 'ngo')
    OR public.has_role(auth.uid(), 'volunteer')
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "Donors create donations" ON public.food_donations FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id AND public.has_role(auth.uid(), 'donor'));
CREATE POLICY "Donors update own donations" ON public.food_donations FOR UPDATE TO authenticated USING (auth.uid() = donor_id) WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Admins update donations" ON public.food_donations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "NGOs read own requests" ON public.food_requests FOR SELECT TO authenticated USING (auth.uid() = ngo_id);
CREATE POLICY "Donors read requests on their donations" ON public.food_requests FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.food_donations d WHERE d.id = food_requests.donation_id AND d.donor_id = auth.uid())
);
CREATE POLICY "Admins read requests" ON public.food_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "NGOs create requests" ON public.food_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = ngo_id AND public.has_role(auth.uid(), 'ngo'));
CREATE POLICY "NGOs cancel own requests" ON public.food_requests FOR UPDATE TO authenticated USING (auth.uid() = ngo_id) WITH CHECK (auth.uid() = ngo_id);
CREATE POLICY "Donors decide requests" ON public.food_requests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.food_donations d WHERE d.id = food_requests.donation_id AND d.donor_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.food_donations d WHERE d.id = food_requests.donation_id AND d.donor_id = auth.uid())
);

CREATE POLICY "NGOs read own matches" ON public.matches FOR SELECT TO authenticated USING (auth.uid() = ngo_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Pickup participants read" ON public.pickups FOR SELECT TO authenticated USING (
  auth.uid() = ngo_id
  OR auth.uid() = volunteer_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.food_donations d WHERE d.id = pickups.donation_id AND d.donor_id = auth.uid())
  OR (status = 'open' AND public.has_role(auth.uid(), 'volunteer'))
);
CREATE POLICY "Volunteers claim and progress pickups" ON public.pickups FOR UPDATE TO authenticated USING (
  (status = 'open' AND volunteer_id IS NULL AND public.has_role(auth.uid(), 'volunteer'))
  OR auth.uid() = volunteer_id
) WITH CHECK (
  auth.uid() = volunteer_id
);
CREATE POLICY "Admins update pickups" ON public.pickups FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users mark own notifications read" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviews readable by signed-in users" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users write own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- Impact statistics (aggregate only, safe for the public landing page)
CREATE OR REPLACE FUNCTION public.get_impact_statistics()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'meals_rescued', COALESCE((SELECT SUM(servings) FROM public.food_donations WHERE status = 'delivered'), 0),
    'food_weight_rescued', COALESCE((SELECT SUM(quantity) FROM public.food_donations WHERE status = 'delivered' AND quantity_unit = 'kg'), 0),
    'donations_completed', (SELECT COUNT(*) FROM public.food_donations WHERE status = 'delivered'),
    'volunteers_involved', (SELECT COUNT(DISTINCT volunteer_id) FROM public.pickups WHERE volunteer_id IS NOT NULL AND status = 'delivered'),
    'organizations_involved', (SELECT COUNT(*) FROM public.ngo_profiles WHERE verification_status = 'verified')
  )
$$;

REVOKE ALL ON FUNCTION public.get_impact_statistics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_impact_statistics() TO anon, authenticated, service_role;