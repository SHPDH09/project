import React, { useState } from 'react';
import { 
  Search, Filter, MoreVertical, UserCheck, UserX, Mail, 
  Calendar, Crown, Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { User } from '../../types/auth';

interface UserManagementProps {
  users: User[];
  onUsersUpdate: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUsersUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'trial' | 'premium' | 'expired'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || user.subscription_status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleApproveUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_approved: true, is_active: true })
        .eq('id', userId);

      if (error) throw error;
      
      // Send approval notification
      await sendApprovalNotification(userId);
      onUsersUpdate();
    } catch (error) {
      console.error('Failed to approve user:', error);
      alert('Failed to approve user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_approved: false, is_active: false })
        .eq('id', userId);

      if (error) throw error;
      onUsersUpdate();
    } catch (error) {
      console.error('Failed to reject user:', error);
      alert('Failed to reject user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      onUsersUpdate();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };

  const sendApprovalNotification = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'approval',
          title: 'Account Approved',
          message: 'Your account has been approved! You can now access all features.',
          email_sent: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_approved) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>;
    }
    
    if (!user.is_active) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Inactive</span>;
    }

    switch (user.subscription_status) {
      case 'trial':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Trial</span>;
      case 'premium':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Premium</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Expired</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Unknown</span>;
    }
  };

  const getTrialDaysRemaining = (user: User) => {
    if (user.subscription_status !== 'trial') return null;
    
    const trialEnd = new Date(user.trial_end_date);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage user accounts, approvals, and subscriptions</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="trial">Trial Users</option>
              <option value="premium">Premium Users</option>
              <option value="expired">Expired Users</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trial Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const trialDays = getTrialDaysRemaining(user);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.company && (
                            <div className="text-xs text-gray-400">{user.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.is_approved ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className={`text-sm ${
                          user.is_approved ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                          {user.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trialDays !== null ? `${trialDays} days` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {!user.is_approved && (
                          <>
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              disabled={isLoading}
                              className="p-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors duration-200"
                              title="Approve User"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              disabled={isLoading}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200"
                              title="Reject User"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {user.is_approved && (
                          <button
                            onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                            disabled={isLoading}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              user.is_active 
                                ? 'bg-red-100 hover:bg-red-200 text-red-600' 
                                : 'bg-green-100 hover:bg-green-200 text-green-600'
                            }`}
                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                        
                        <button
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedUsers.length} user(s) selected
            </p>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200">
                Approve Selected
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200">
                Reject Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;