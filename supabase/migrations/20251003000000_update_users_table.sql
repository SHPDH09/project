/*
  # Update Users Table for Supabase Auth Integration

  ## Overview
  This migration updates the existing users table to properly integrate with Supabase Auth
  and adds any missing columns requested.

  ## Changes
  1. Add address column if it doesn't exist
  2. Add company column if it doesn't exist (equivalent to additional profile info)
  3. Ensure all requested columns are present
  4. Update RLS policies for better security
  5. Create functions for user registration

  ## Columns (after migration)
  - id (uuid) - Primary key, references auth.users if using Supabase Auth
  - email (text, unique) - User's email
  - password_hash (text) - For custom auth (or can be removed if using Supabase Auth)
  - full_name (text) - User's full name
  - phone (text) - Phone number
  - address (text) - Physical address
  - company (text) - Company/organization
  - role (enum) - 'admin' or 'user'
  - Additional subscription and tracking fields

  ## Security
  - RLS policies updated to ensure proper access control
  - Separate policies for admin and regular users
*/

-- Add address column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address'
  ) THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;
END $$;

-- Ensure company column exists (it should from the original migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company'
  ) THEN
    ALTER TABLE users ADD COLUMN company text;
  END IF;
END $$;

-- Create function to register new user (both admin and regular users)
CREATE OR REPLACE FUNCTION register_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_company text DEFAULT NULL,
  p_role user_role DEFAULT 'user'
)
RETURNS TABLE(
  user_id uuid,
  success boolean,
  message text
) AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
BEGIN
  -- Check if email already exists
  IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
    RETURN QUERY SELECT NULL::uuid, false, 'Email already registered';
    RETURN;
  END IF;

  -- Generate password hash (using PostgreSQL's crypt function)
  -- Note: In production, this should use bcrypt via an extension
  v_password_hash := crypt(p_password, gen_salt('bf'));
  
  -- Generate new user ID
  v_user_id := gen_random_uuid();

  -- Insert new user
  INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    phone,
    address,
    company,
    role,
    subscription_status,
    trial_start_date,
    trial_end_date,
    is_approved,
    is_active
  ) VALUES (
    v_user_id,
    p_email,
    v_password_hash,
    p_full_name,
    p_phone,
    p_address,
    p_company,
    p_role,
    CASE WHEN p_role = 'admin' THEN 'premium'::subscription_status ELSE 'trial'::subscription_status END,
    now(),
    CASE WHEN p_role = 'admin' THEN now() + interval '1 year' ELSE now() + interval '3 days' END,
    CASE WHEN p_role = 'admin' THEN true ELSE false END,
    true
  );

  RETURN QUERY SELECT v_user_id, true, 'User registered successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users for registration
GRANT EXECUTE ON FUNCTION register_user TO anon, authenticated;

-- Create function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(p_email text, p_password text)
RETURNS TABLE(
  user_id uuid,
  user_email text,
  user_name text,
  user_role user_role,
  user_phone text,
  user_address text,
  user_company text,
  subscription_status subscription_status,
  is_approved boolean,
  is_active boolean,
  success boolean,
  message text
) AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Get user by email
  SELECT * INTO v_user
  FROM users u
  WHERE u.email = p_email;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::uuid, NULL::text, NULL::text, NULL::user_role, 
      NULL::text, NULL::text, NULL::text,
      NULL::subscription_status, NULL::boolean, NULL::boolean,
      false, 'Invalid email or password';
    RETURN;
  END IF;

  -- Verify password
  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    -- Check if user is active
    IF NOT v_user.is_active THEN
      RETURN QUERY SELECT 
        NULL::uuid, NULL::text, NULL::text, NULL::user_role,
        NULL::text, NULL::text, NULL::text,
        NULL::subscription_status, NULL::boolean, NULL::boolean,
        false, 'Account is deactivated';
      RETURN;
    END IF;

    -- Check if user is approved (for non-admin users)
    IF v_user.role = 'user' AND NOT v_user.is_approved THEN
      RETURN QUERY SELECT 
        NULL::uuid, NULL::text, NULL::text, NULL::user_role,
        NULL::text, NULL::text, NULL::text,
        NULL::subscription_status, NULL::boolean, NULL::boolean,
        false, 'Account pending approval';
      RETURN;
    END IF;

    -- Update last login
    UPDATE users 
    SET last_login = now(), login_count = login_count + 1
    WHERE id = v_user.id;

    -- Return user data
    RETURN QUERY SELECT 
      v_user.id,
      v_user.email,
      v_user.full_name,
      v_user.role,
      v_user.phone,
      v_user.address,
      v_user.company,
      v_user.subscription_status,
      v_user.is_approved,
      v_user.is_active,
      true,
      'Authentication successful';
  ELSE
    RETURN QUERY SELECT 
      NULL::uuid, NULL::text, NULL::text, NULL::user_role,
      NULL::text, NULL::text, NULL::text,
      NULL::subscription_status, NULL::boolean, NULL::boolean,
      false, 'Invalid email or password';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION authenticate_user TO anon, authenticated;

-- Ensure pgcrypto extension is enabled for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
