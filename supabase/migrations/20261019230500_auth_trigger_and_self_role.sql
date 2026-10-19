-- Auto-provision user profiles and roles on signup via PostgreSQL trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _raw_role text;
  _full_name text;
  _phone text;
  _address text;
  _org_name text;
  _org_address text;
  _org_contact text;
BEGIN
  _raw_role := NEW.raw_user_meta_data->>'role';
  IF _raw_role IN ('donor', 'ngo', 'volunteer') THEN
    _role := _raw_role::public.app_role;
  ELSE
    _role := 'donor'::public.app_role;
  END IF;

  _full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email, '');
  _phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');
  _address := NULLIF(TRIM(NEW.raw_user_meta_data->>'address'), '');
  _org_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'organization_name'), '');
  _org_address := NULLIF(TRIM(NEW.raw_user_meta_data->>'organization_address'), '');
  _org_contact := NULLIF(TRIM(NEW.raw_user_meta_data->>'organization_contact_person'), '');

  -- 1. Upsert public.profiles
  INSERT INTO public.profiles (
    id, email, full_name, phone, address,
    organization_name, organization_address, organization_contact_person, status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    _full_name,
    _phone,
    _address,
    _org_name,
    _org_address,
    _org_contact,
    'active'
  ) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    address = COALESCE(EXCLUDED.address, profiles.address),
    organization_name = COALESCE(EXCLUDED.organization_name, profiles.organization_name),
    organization_address = COALESCE(EXCLUDED.organization_address, profiles.organization_address),
    organization_contact_person = COALESCE(EXCLUDED.organization_contact_person, profiles.organization_contact_person),
    updated_at = now();

  -- 2. Insert public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Insert role-specific profile
  IF _role = 'donor' THEN
    INSERT INTO public.donor_profiles (user_id, organization_name, address)
    VALUES (NEW.id, _org_name, _address)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF _role = 'ngo' THEN
    INSERT INTO public.ngo_profiles (user_id, organization_name, address, contact_person)
    VALUES (NEW.id, COALESCE(_org_name, 'NGO ' || _full_name), COALESCE(_org_address, _address, 'Address not provided'), _org_contact)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF _role = 'volunteer' THEN
    INSERT INTO public.volunteer_profiles (user_id, address)
    VALUES (NEW.id, _address)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fallback RPC to allow authenticated user to assign their initial non-admin role if missing
CREATE OR REPLACE FUNCTION public.assign_self_role(_role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _role = 'admin' THEN
    RAISE EXCEPTION 'Cannot self-assign admin role';
  END IF;
  
  -- Only allow assigning if user does not already have a role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), _role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_self_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_self_role(public.app_role) TO authenticated;
