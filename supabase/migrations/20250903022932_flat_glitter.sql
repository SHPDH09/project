/*
  # Setup Admin User and Fix Authentication

  1. New Tables
    - Ensures proper user setup in the users table
  2. Admin User Setup
    - Creates admin user record that matches auth.users
  3. Security
    - Maintains RLS policies
    - Ensures proper role assignments
*/

-- First, let's make sure we have the proper functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    subscription_status,
    trial_start_date,
    trial_end_date,
    is_approved,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Admin User'),
    CASE 
      WHEN new.email = 'admin@dataanalyzer.com' THEN 'admin'::user_role
      ELSE 'user'::user_role
    END,
    CASE 
      WHEN new.email = 'admin@dataanalyzer.com' THEN 'premium'::subscription_status
      ELSE 'trial'::subscription_status
    END,
    now(),
    CASE 
      WHEN new.email = 'admin@dataanalyzer.com' THEN now() + interval '1 year'
      ELSE now() + interval '3 days'
    END,
    true,
    true,
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert admin user if it doesn't exist in users table
INSERT INTO public.users (
  id,
  email,
  password_hash,
  full_name,
  role,
  subscription_status,
  trial_start_date,
  trial_end_date,
  is_approved,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@dataanalyzer.com',
  '$2a$10$dummy.hash.for.admin123', -- This is just a placeholder
  'System Administrator',
  'admin'::user_role,
  'premium'::subscription_status,
  now(),
  now() + interval '1 year',
  true,
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin'::user_role,
  subscription_status = 'premium'::subscription_status,
  is_approved = true,
  is_active = true,
  updated_at = now();

-- Insert some sample service settings
INSERT INTO public.service_settings (
  service_name,
  is_enabled,
  description,
  icon
) VALUES 
  ('Data Analysis', true, 'Core data analysis features', 'BarChart3'),
  ('File Upload', true, 'CSV and Excel file upload', 'Upload'),
  ('Database Connection', true, 'Real-time database connectivity', 'Database'),
  ('Export Features', true, 'Data export capabilities', 'Download'),
  ('Advanced Analytics', true, 'Machine learning and AI features', 'Brain')
ON CONFLICT (service_name) DO NOTHING;