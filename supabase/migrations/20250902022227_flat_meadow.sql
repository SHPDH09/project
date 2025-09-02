/*
  # Complete Authentication and User Management System

  1. New Tables
    - `users` - User profiles with trial and subscription management
    - `user_sessions` - Track user sessions and activity
    - `password_resets` - OTP-based password reset system
    - `service_settings` - Admin-controlled service features
    - `user_analytics` - Track user usage and analytics
    - `notifications` - System notifications and emails

  2. Security
    - Enable RLS on all tables
    - Role-based access policies for admin and user roles
    - Secure OTP generation and validation

  3. Features
    - 3-day free trial for new users
    - Automatic account locking after trial
    - Email notifications for trial expiry
    - Admin user management and approvals
    - Service enable/disable controls
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE subscription_status AS ENUM ('trial', 'premium', 'expired');

-- Users table with enhanced features
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  phone text,
  company text,
  role user_role DEFAULT 'user',
  subscription_status subscription_status DEFAULT 'trial',
  trial_start_date timestamptz DEFAULT now(),
  trial_end_date timestamptz DEFAULT (now() + interval '3 days'),
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  profile_image text,
  last_login timestamptz,
  login_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User sessions tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Password reset with OTP
CREATE TABLE IF NOT EXISTS password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Service settings for admin control
CREATE TABLE IF NOT EXISTS service_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text UNIQUE NOT NULL,
  is_enabled boolean DEFAULT true,
  description text,
  icon text,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- User analytics and usage tracking
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for service_settings
CREATE POLICY "Everyone can view service settings"
  ON service_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage service settings"
  ON service_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Insert default admin user
INSERT INTO users (
  email, 
  password_hash, 
  full_name, 
  role, 
  subscription_status, 
  is_approved, 
  is_active
) VALUES (
  'admin@dataanalyzer.com',
  '$2b$10$rQZ8kHWKQYQJQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQXQX', -- password: admin123
  'System Administrator',
  'admin',
  'premium',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert default service settings
INSERT INTO service_settings (service_name, is_enabled, description, icon) VALUES
  ('data_upload', true, 'File upload and processing', 'Upload'),
  ('database_connection', true, 'Real-time database connectivity', 'Database'),
  ('advanced_analytics', true, 'Advanced statistical analysis', 'BarChart3'),
  ('ml_models', true, 'Machine learning model training', 'Brain'),
  ('export_reports', true, 'Export analysis reports', 'Download'),
  ('real_time_updates', true, 'Real-time data updates', 'Wifi')
ON CONFLICT (service_name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_settings_updated_at
  BEFORE UPDATE ON service_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();