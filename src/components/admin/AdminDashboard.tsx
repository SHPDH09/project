import React, { useState, useEffect } from 'react';
import { 
  Users, Settings, BarChart3, Shield, Bell, Database, 
  CheckCircle, XCircle, Clock, TrendingUp, Activity,
  UserCheck, UserX, Mail, Calendar, Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import UserManagement from './UserManagement';
import ServiceSettings from './ServiceSettings';
import UserAnalytics from './UserAnalytics';
import type { User, ServiceSettings as ServiceSettingsType } from '../../types/auth';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [serviceSettings, setServiceSettings] = useState<ServiceSettingsType[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load service settings
      const { data: servicesData, error: servicesError } = await supabase
        .from('service_settings')
        .select('*')
        .order('service_name');

      if (servicesError) throw servicesError;
      setServiceSettings(servicesData || []);

      // Calculate analytics
      const totalUsers = usersData?.length || 0;
      const activeUsers = usersData?.filter(u => u.is_active).length || 0;
      const trialUsers = usersData?.filter(u => u.subscription_status === 'trial').length || 0;
      const premiumUsers = usersData?.filter(u => u.subscription_status === 'premium').length || 0;
      const pendingApprovals = usersData?.filter(u => !u.is_approved).length || 0;

      setAnalytics({
        totalUsers,
        activeUsers,
        trialUsers,
        premiumUsers,
        pendingApprovals,
        conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', title: 'Overview', icon: BarChart3 },
    { id: 'users', title: 'User Management', icon: Users },
    { id: 'services', title: 'Service Settings', icon: Settings },
    { id: 'analytics', title: 'Analytics', icon: TrendingUp }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">System Management & Analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                <Crown className="w-4 h-4" />
                <span>Administrator</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Users',
                  value: analytics.totalUsers,
                  icon: Users,
                  color: 'from-blue-500 to-blue-600',
                  bgColor: 'bg-blue-50',
                  textColor: 'text-blue-600'
                },
                {
                  title: 'Active Users',
                  value: analytics.activeUsers,
                  icon: UserCheck,
                  color: 'from-green-500 to-green-600',
                  bgColor: 'bg-green-50',
                  textColor: 'text-green-600'
                },
                {
                  title: 'Trial Users',
                  value: analytics.trialUsers,
                  icon: Clock,
                  color: 'from-yellow-500 to-yellow-600',
                  bgColor: 'bg-yellow-50',
                  textColor: 'text-yellow-600'
                },
                {
                  title: 'Premium Users',
                  value: analytics.premiumUsers,
                  icon: Crown,
                  color: 'from-purple-500 to-purple-600',
                  bgColor: 'bg-purple-50',
                  textColor: 'text-purple-600'
                }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Approvals */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending User Approvals</h3>
                <div className="space-y-3">
                  {users.filter(u => !u.is_approved).slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors duration-200">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => !u.is_approved).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No pending approvals</p>
                  )}
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status</h3>
                <div className="space-y-3">
                  {serviceSettings.slice(0, 6).map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${service.is_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="font-medium text-gray-900">{service.service_name}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        service.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {service.is_enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                >
                  <Users className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-blue-900">Manage Users</p>
                    <p className="text-sm text-blue-700">View and manage user accounts</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('services')}
                  className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
                >
                  <Settings className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-green-900">Service Settings</p>
                    <p className="text-sm text-green-700">Enable/disable features</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                >
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium text-purple-900">View Analytics</p>
                    <p className="text-sm text-purple-700">User activity and metrics</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <UserManagement users={users} onUsersUpdate={loadDashboardData} />
        )}

        {/* Service Settings Tab */}
        {activeTab === 'services' && (
          <ServiceSettings settings={serviceSettings} onSettingsUpdate={loadDashboardData} />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <UserAnalytics users={users} analytics={analytics} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;