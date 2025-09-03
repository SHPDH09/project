/*
  # Fix Authentication and RLS Policies

  1. Security Updates
    - Update RLS policies to allow proper user registration
    - Add policies for authenticated user operations
    - Fix admin user creation flow
  
  2. Policy Changes
    - Allow users to insert their own profile during registration
    - Enable proper authentication flow
    - Add service role access for admin operations
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create new, working policies for users table
CREATE POLICY "Enable insert for authenticated users during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users to view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update for users to update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for admins to view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins to update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow service role to bypass RLS for admin operations
CREATE POLICY "Service role can do everything"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update password_resets policies
DROP POLICY IF EXISTS "Anyone can insert password resets" ON password_resets;
DROP POLICY IF EXISTS "Anyone can select password resets" ON password_resets;
DROP POLICY IF EXISTS "Anyone can update password resets" ON password_resets;

CREATE POLICY "Enable insert for password resets"
  ON password_resets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable select for password resets"
  ON password_resets
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Enable update for password resets"
  ON password_resets
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Update user_analytics policies
CREATE POLICY "Enable insert for user analytics"
  ON user_analytics
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Update notifications policies
CREATE POLICY "Enable insert for notifications"
  ON notifications
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

-- Update service_settings policies
DROP POLICY IF EXISTS "Admins can manage service settings" ON service_settings;
DROP POLICY IF EXISTS "Everyone can view service settings" ON service_settings;

CREATE POLICY "Enable select for service settings"
  ON service_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Enable all for admins on service settings"
  ON service_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage service settings"
  ON service_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default service settings if they don't exist
INSERT INTO service_settings (service_name, is_enabled, description, icon) VALUES
  ('File Upload', true, 'Allow users to upload CSV and Excel files', 'Upload'),
  ('Database Connection', true, 'Allow users to connect to external databases', 'Database'),
  ('Advanced Analytics', true, 'Enable advanced statistical analysis features', 'BarChart'),
  ('Export Reports', true, 'Allow users to export analysis reports', 'Download'),
  ('Real-time Analysis', true, 'Enable real-time data processing', 'Activity')
ON CONFLICT (service_name) DO NOTHING;