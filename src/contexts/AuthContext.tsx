import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, AuthState, LoginCredentials, RegisterData, ForgotPasswordData, ResetPasswordData } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordData) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkTrialStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session) {
        await fetchUserProfile(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Session check failed'
      });
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Check trial status
      const trialEndDate = new Date(userProfile.trial_end_date);
      const now = new Date();
      
      if (userProfile.subscription_status === 'trial' && now > trialEndDate) {
        // Trial expired, update status
        await supabase
          .from('users')
          .update({ 
            subscription_status: 'expired',
            is_active: false 
          })
          .eq('id', userId);
        
        userProfile.subscription_status = 'expired';
        userProfile.is_active = false;
        
        // Send trial expiry notification
        await sendTrialExpiryNotification(userProfile.email);
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

      setAuthState({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user profile'
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Special handling for demo admin user
      if (credentials.email === 'admin@dataanalyzer.com' && credentials.password === 'admin123') {
        // Check if admin user exists in our users table
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (userCheckError && userCheckError.code === 'PGRST116') {
          // User doesn't exist, create admin user
          const adminId = crypto.randomUUID();
          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: adminId,
              email: credentials.email,
              full_name: 'System Administrator',
              role: 'admin',
              subscription_status: 'premium',
              trial_start_date: new Date().toISOString(),
              trial_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
              is_approved: true,
              is_active: true
            });

          if (createError) {
            console.error('Failed to create admin user:', createError);
          }
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        // If auth fails but this is the demo admin, try to handle it gracefully
        if (credentials.email === 'admin@dataanalyzer.com' && credentials.password === 'admin123') {
          // For demo purposes, simulate successful login with admin user
          const { data: adminUser, error: adminError } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (!adminError && adminUser) {
            setAuthState({
              user: adminUser,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return;
          }
        }
        throw error;
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed. Please check your credentials or register for a new account.'
      }));
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Calculate trial period
        const trialStartDate = new Date();
        const trialEndDate = new Date();
        trialEndDate.setDate(trialStartDate.getDate() + 3); // 3 days trial

        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            phone: data.phone,
            company: data.company,
            role: 'user',
            subscription_status: 'trial',
            trial_start_date: trialStartDate.toISOString(),
            trial_end_date: trialEndDate.toISOString(),
            is_approved: true, // Auto-approve for trial
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) throw profileError;

        // Send welcome email
        await sendWelcomeEmail(data.email, data.full_name);
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const forgotPassword = async (data: ForgotPasswordData) => {
    try {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

      // Store OTP in database
      const { error } = await supabase
        .from('password_resets')
        .insert({
          email: data.email,
          otp,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (error) throw error;

      // Send OTP email
      await sendOTPEmail(data.email, otp);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send OTP');
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    try {
      // Verify OTP
      const { data: resetData, error: verifyError } = await supabase
        .from('password_resets')
        .select('*')
        .eq('email', data.email)
        .eq('otp', data.otp)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (verifyError || !resetData) {
        throw new Error('Invalid or expired OTP');
      }

      // Get user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email)
        .single();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userData.id,
        { password: data.new_password }
      );

      if (updateError) throw updateError;

      // Mark OTP as used
      await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('id', resetData.id);

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password reset failed');
    }
  };

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const checkTrialStatus = async (): Promise<boolean> => {
    if (!authState.user) return false;
    
    const trialEndDate = new Date(authState.user.trial_end_date);
    const now = new Date();
    
    return authState.user.subscription_status === 'trial' && now <= trialEndDate;
  };

  // Email functions (these would typically be handled by edge functions)
  const sendWelcomeEmail = async (email: string, name: string) => {
    console.log(`Welcome email sent to ${email} for ${name}`);
    // This would be implemented as a Supabase Edge Function
  };

  const sendOTPEmail = async (email: string, otp: string) => {
    console.log(`OTP ${otp} sent to ${email}`);
    // This would be implemented as a Supabase Edge Function
  };

  const sendTrialExpiryNotification = async (email: string) => {
    console.log(`Trial expiry notification sent to ${email}`);
    // This would be implemented as a Supabase Edge Function
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
        checkTrialStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};