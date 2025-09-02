import React from 'react';
import { Crown, Clock, Mail, CheckCircle, ArrowRight } from 'lucide-react';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userEmail: string;
}

const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpgrade, 
  userEmail 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Period Ended</h2>
          <p className="text-gray-600">Your 3-day free trial has expired</p>
        </div>

        {/* Trial Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">What you experienced:</h3>
          <div className="space-y-2">
            {[
              'Advanced AI-powered data analysis',
              'Real-time database connectivity',
              'Machine learning model training',
              'Comprehensive report generation',
              'Interactive data visualizations'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-200">
          <div className="flex items-center space-x-2 mb-3">
            <Crown className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Upgrade to Premium</h3>
          </div>
          <div className="space-y-2">
            {[
              'Unlimited data analysis',
              'Priority customer support',
              'Advanced ML algorithms',
              'Custom report branding',
              'API access for integrations'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm text-purple-800">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-blue-900">Need Help?</h4>
          </div>
          <p className="text-sm text-blue-800">
            Contact us at <strong>rk331159@gmail.com</strong> for pricing information and custom plans.
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
          >
            Continue Browsing
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            A premium upgrade notification has been sent to {userEmail}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredModal;