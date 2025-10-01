/*
  # Create Custom Admin User

  1. Admin User Setup
    - Insert admin user with custom ID: 1A74N3077
    - Set password: Raunak@12583
    - Configure as premium admin user
    - Enable all permissions

  2. Security
    - Set appropriate role and subscription
    - Enable admin privileges
    - Set extended trial period
*/

-- Insert the custom admin user with specified credentials
INSERT INTO users (
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
  login_count,
  created_at,
  updated_at
) VALUES (
  '1a74n307-7000-4000-8000-000000000000'::uuid,
  'admin@dataanalyzer.com',
  '$2b$10$rQZ8kHWKQYQJQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQX', -- Placeholder hash
  'Raunak Kumar - System Administrator',
  'admin'::user_role,
  'premium'::subscription_status,
  now(),
  now() + interval '1 year',
  true,
  true,
  0,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  subscription_status = EXCLUDED.subscription_status,
  is_approved = EXCLUDED.is_approved,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Also handle email conflict
INSERT INTO users (
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
  login_count,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'rk331159@gmail.com',
  '$2b$10$rQZ8kHWKQYQJQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQX',
  'Raunak Kumar - Developer',
  'admin'::user_role,
  'premium'::subscription_status,
  now(),
  now() + interval '1 year',
  true,
  true,
  0,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  subscription_status = EXCLUDED.subscription_status,
  is_approved = EXCLUDED.is_approved,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create function to authenticate the custom admin
CREATE OR REPLACE FUNCTION authenticate_custom_admin(input_email text, input_password text)
RETURNS TABLE(
  user_id uuid, 
  user_email text, 
  user_role user_role, 
  user_name text,
  is_authenticated boolean
) AS $$
BEGIN
  -- Check for custom admin credentials
  IF input_email = 'admin@dataanalyzer.com' AND input_password = 'Raunak@12583' THEN
    RETURN QUERY
    SELECT 
      u.id,
      u.email,
      u.role,
      u.full_name,
      true as is_authenticated
    FROM users u 
    WHERE u.email = input_email AND u.role = 'admin'
    LIMIT 1;
  ELSE
    RETURN QUERY
    SELECT 
      NULL::uuid,
      NULL::text,
      NULL::user_role,
      NULL::text,
      false as is_authenticated;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION authenticate_custom_admin TO authenticated, anon;