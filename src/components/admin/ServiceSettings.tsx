import React, { useState } from 'react';
import { Settings, Toggle, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ServiceSettings as ServiceSettingsType } from '../../types/auth';

interface ServiceSettingsProps {
  settings: ServiceSettingsType[];
  onSettingsUpdate: () => void;
}

const ServiceSettings: React.FC<ServiceSettingsProps> = ({ settings, onSettingsUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedSettings, setUpdatedSettings] = useState<Record<string, boolean>>({});

  const handleToggleService = (serviceId: string, currentStatus: boolean) => {
    setUpdatedSettings({
      ...updatedSettings,
      [serviceId]: !currentStatus
    });
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    
    try {
      const updates = Object.entries(updatedSettings).map(([serviceId, isEnabled]) => 
        supabase
          .from('service_settings')
          .update({ is_enabled: isEnabled })
          .eq('id', serviceId)
      );

      await Promise.all(updates);
      setUpdatedSettings({});
      onSettingsUpdate();
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update service settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges = Object.keys(updatedSettings).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Service Settings</h2>
            <p className="text-gray-600">Enable or disable features for all users</p>
          </div>
          
          {hasChanges && (
            <button
              onClick={handleSaveChanges}
              disabled={isUpdating}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
            >
              {isUpdating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Service Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((service) => {
          const currentStatus = updatedSettings[service.id] !== undefined 
            ? updatedSettings[service.id] 
            : service.is_enabled;

          return (
            <div key={service.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    currentStatus ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Settings className={`w-5 h-5 ${
                      currentStatus ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {service.service_name.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">{service.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleToggleService(service.id, service.is_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    currentStatus ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      currentStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className={`font-medium ${
                  currentStatus ? 'text-green-700' : 'text-red-700'
                }`}>
                  {currentStatus ? 'Enabled' : 'Disabled'}
                </span>
                
                {updatedSettings[service.id] !== undefined && (
                  <span className="text-blue-600 font-medium">
                    {updatedSettings[service.id] ? 'Will Enable' : 'Will Disable'}
                  </span>
                )}
              </div>

              {/* Service Impact */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Impact:</strong> {getServiceImpact(service.service_name)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Service Status Summary */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Status Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {settings.filter(s => s.is_enabled).length}
            </div>
            <div className="text-sm text-green-700">Services Enabled</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {settings.filter(s => !s.is_enabled).length}
            </div>
            <div className="text-sm text-red-700">Services Disabled</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {((settings.filter(s => s.is_enabled).length / settings.length) * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-blue-700">Availability Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getServiceImpact = (serviceName: string): string => {
  const impacts: Record<string, string> = {
    'data_upload': 'Users cannot upload CSV/Excel files for analysis',
    'database_connection': 'Real-time database connectivity will be unavailable',
    'advanced_analytics': 'Statistical analysis and insights will be limited',
    'ml_models': 'Machine learning model training will be disabled',
    'export_reports': 'Users cannot export analysis reports',
    'real_time_updates': 'Live data updates will be disabled'
  };
  
  return impacts[serviceName] || 'This will affect user access to this feature';
};

export default ServiceSettings;