import React from 'react';
import { Mail, MapPin, Phone, Github, Linkedin, BarChart3 } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">AI Data Analyzer</h3>
                <p className="text-gray-400 text-sm">Advanced AI-Powered Analysis</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Advanced AI-powered data analysis tool that automatically processes, analyzes, 
              and generates insights from your datasets using machine learning algorithms.
            </p>
          </div>

          {/* Developer Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Developer</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                  RK
                </div>
                <div>
                  <p className="font-medium">Raunak Kumar</p>
                  <p className="text-gray-400 text-sm">Full Stack Developer & Data Scientist</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Mail className="w-4 h-4" />
                  <span>rk331159@gmail.com</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>Bhagalpur, Bihar 813202, India</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Connect</h4>
            <div className="space-y-3">
              <a 
                href="mailto:rk331159@gmail.com" 
                className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm">Send Email</span>
              </a>
              
              <div className="flex items-center space-x-3 text-gray-300">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm">Available for Projects</span>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <div className="w-8 h-8 bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer">
                  <Github className="w-4 h-4" />
                </div>
                <div className="w-8 h-8 bg-gray-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors duration-200 cursor-pointer">
                  <Linkedin className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © 2025 AI Data Analyzer. Developed by Raunak Kumar.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Advanced Machine Learning • Data Science • Automated Analysis
              </p>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Built with React & TypeScript</span>
              <span>•</span>
              <span>Powered by AI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;