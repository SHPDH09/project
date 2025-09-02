import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Crown, Clock, Activity, Calendar } from 'lucide-react';
import type { User } from '../../types/auth';

interface UserAnalyticsProps {
  users: User[];
  analytics: any;
}

const UserAnalytics: React.FC<UserAnalyticsProps> = ({ users, analytics }) => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Generate registration trend data
  const getRegistrationTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const registrations = users.filter(user => 
        user.created_at.split('T')[0] === date
      ).length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations
      };
    });
  };

  // Generate subscription distribution data
  const getSubscriptionData = () => [
    { name: 'Trial', value: analytics.trialUsers, color: '#3B82F6' },
    { name: 'Premium', value: analytics.premiumUsers, color: '#10B981' },
    { name: 'Expired', value: users.filter(u => u.subscription_status === 'expired').length, color: '#EF4444' }
  ];

  // Generate user activity data
  const getUserActivityData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const activeUsers = users.filter(user => 
        user.last_login && user.last_login.split('T')[0] === date
      ).length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        active: activeUsers
      };
    });
  };

  const registrationTrend = getRegistrationTrend();
  const subscriptionData = getSubscriptionData();
  const activityData = getUserActivityData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
            <p className="text-gray-600">Comprehensive user behavior and system metrics</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Users',
            value: analytics.totalUsers,
            change: '+12%',
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            title: 'Active Users',
            value: analytics.activeUsers,
            change: '+8%',
            icon: Activity,
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-50'
          },
          {
            title: 'Trial Conversion',
            value: `${analytics.conversionRate.toFixed(1)}%`,
            change: '+5%',
            icon: Crown,
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-50'
          },
          {
            title: 'Pending Approvals',
            value: analytics.pendingApprovals,
            change: '-3%',
            icon: Clock,
            color: 'from-yellow-500 to-yellow-600',
            bgColor: 'bg-yellow-50'
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${metric.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-gray-700" />
                </div>
                <span className="text-sm font-medium text-green-600">{metric.change}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="registrations" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
              >
                {subscriptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Activity */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={activityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="active" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Users */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h3>
        <div className="space-y-3">
          {users.slice(0, 10).map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2">
                  {user.subscription_status === 'trial' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Trial</span>
                  )}
                  {user.subscription_status === 'premium' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Premium</span>
                  )}
                  {!user.is_approved && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;