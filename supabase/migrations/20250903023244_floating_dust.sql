/*
  # Create Admin User Setup Function

  1. Functions
    - Create function to setup first admin user
    - Handle demo admin creation
  
  2. Security
    - Allow service role operations
    - Enable proper user creation flow
*/

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM users;
  
  -- Calculate trial period
  NEW.trial_start_date := NOW();
  NEW.trial_end_date := NOW() + INTERVAL '3 days';
  
  -- If this is the first user, make them admin
  IF user_count = 0 THEN
    NEW.role := 'admin';
    NEW.subscription_status := 'premium';
    NEW.trial_end_date := NOW() + INTERVAL '1 year';
  ELSE
    NEW.role := 'user';
    NEW.subscription_status := 'trial';
  END IF;
  
  -- Set default values
  NEW.is_approved := true;
  NEW.is_active := true;
  NEW.login_count := 0;
  NEW.created_at := NOW();
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_auth();

-- Function to handle auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_auth()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  user_role user_role;
  sub_status subscription_status;
  trial_end TIMESTAMPTZ;
BEGIN
  -- Count existing users in our users table
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  -- Determine role and subscription
  IF user_count = 0 THEN
    user_role := 'admin';
    sub_status := 'premium';
    trial_end := NOW() + INTERVAL '1 year';
  ELSE
    user_role := 'user';
    sub_status := 'trial';
    trial_end := NOW() + INTERVAL '3 days';
  END IF;
  
  -- Insert into public.users table
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    company,
    role,
    subscription_status,
    trial_start_date,
    trial_end_date,
    is_approved,
    is_active,
    password_hash
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company',
    user_role,
    sub_status,
    NOW(),
    trial_end,
    true,
    true,
    'supabase_managed'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;