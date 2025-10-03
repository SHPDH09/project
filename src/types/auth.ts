export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  subscription_status: 'trial' | 'premium' | 'expired';
  trial_start_date: string;
  trial_end_date: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string | null;
  profile_image?: string;
  phone?: string;
  company?: string;
  address?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  company?: string;
  address?: string;
  role?: 'admin' | 'user';
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  new_password: string;
}

export interface UserManagement {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  subscription_status: 'trial' | 'premium' | 'expired';
  is_approved: boolean;
  is_active: boolean;
  trial_days_remaining: number;
  created_at: string;
  last_login: string | null;
}

export interface ServiceSettings {
  id: string;
  service_name: string;
  is_enabled: boolean;
  description: string;
  icon: string;
  updated_by: string;
  updated_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  trial_expiry_alerts: boolean;
  premium_offers: boolean;
  system_updates: boolean;
}