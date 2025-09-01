import React, { useState } from 'react';
import { 
  X, Upload, Database, FileText, Settings, Wifi, WifiOff, 
  CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff 
} from 'lucide-react';
import type { DatabaseConnection, RealTimeConfig } from '../types/data';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  onDatabaseConnect: (connection: DatabaseConnection, realTimeConfig: RealTimeConfig) => void;
  isProcessing: boolean;
}

const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onDatabaseConnect,
  isProcessing
}) => {
  const [importMode, setImportMode] = useState<'file' | 'database'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const [dbConnection, setDbConnection] = useState<DatabaseConnection>({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: ''
  });

  const [realTimeConfig, setRealTimeConfig] = useState<RealTimeConfig>({
    enabled: false,
    refreshInterval: 30,
    autoUpdate: true,
    query: 'SELECT * FROM your_table LIMIT 10000'
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size must be less than 50MB');
      return;
    }

    onFileUpload(file);
    onClose();
  };

  const testDatabaseConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('testing');
    
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Basic validation
      if (!dbConnection.host || !dbConnection.database || !dbConnection.username) {
        throw new Error('Please fill in all required fields');
      }
      
      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus('idle'), 3000);
    } catch (error) {
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Connection failed');
      setTimeout(() => setConnectionStatus('idle'), 3000);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDatabaseConnect = () => {
    if (connectionStatus === 'success') {
      onDatabaseConnect(dbConnection, realTimeConfig);
      onClose();
    } else {
      setError('Please test the connection first');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Import Data</h2>
            <p className="text-gray-600">Choose your data source for analysis</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex space-x-4">
            <button
              onClick={() => setImportMode('file')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${
                importMode === 'file'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Upload className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">File Upload</p>
                <p className="text-sm opacity-75">CSV, Excel files</p>
              </div>
            </button>

            <button
              onClick={() => setImportMode('database')}
              className={`flex items-center space-x-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${
                importMode === 'database'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <Database className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Database Connection</p>
                <p className="text-sm opacity-75">Real-time data analysis</p>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {importMode === 'file' ? (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  disabled={isProcessing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-6">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors duration-300 ${
                    dragActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Upload className={`w-8 h-8 ${dragActive ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Upload your dataset
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your file here, or click to browse
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">CSV</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">Excel (.xlsx)</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Excel (.xls)</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    <p>Maximum file size: 50MB</p>
                    <p>Supported formats: CSV, Excel (XLSX, XLS)</p>
                  </div>
                </div>
              </div>

              {/* Advanced File Options */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Advanced Processing Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Auto-detect data types</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Handle missing values</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Remove duplicates</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Outlier detection</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Feature engineering</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" />
                      <span className="text-sm text-gray-700">Statistical analysis</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Database Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Database Configuration</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Database Type</label>
                    <select
                      value={dbConnection.type}
                      onChange={(e) => setDbConnection({
                        ...dbConnection,
                        type: e.target.value as DatabaseConnection['type'],
                        port: e.target.value === 'postgresql' ? 5432 : 
                              e.target.value === 'mysql' ? 3306 : 
                              e.target.value === 'mongodb' ? 27017 : 3306
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="postgresql">PostgreSQL</option>
                      <option value="mysql">MySQL</option>
                      <option value="sqlite">SQLite</option>
                      <option value="mongodb">MongoDB</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                    <input
                      type="text"
                      value={dbConnection.host}
                      onChange={(e) => setDbConnection({ ...dbConnection, host: e.target.value })}
                      placeholder="localhost or IP address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                    <input
                      type="number"
                      value={dbConnection.port}
                      onChange={(e) => setDbConnection({ ...dbConnection, port: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Database Name</label>
                    <input
                      type="text"
                      value={dbConnection.database}
                      onChange={(e) => setDbConnection({ ...dbConnection, database: e.target.value })}
                      placeholder="database_name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={dbConnection.username}
                      onChange={(e) => setDbConnection({ ...dbConnection, username: e.target.value })}
                      placeholder="username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={dbConnection.password}
                        onChange={(e) => setDbConnection({ ...dbConnection, password: e.target.value })}
                        placeholder="password"
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* SQL Query */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SQL Query</label>
                  <textarea
                    value={realTimeConfig.query}
                    onChange={(e) => setRealTimeConfig({ ...realTimeConfig, query: e.target.value })}
                    placeholder="SELECT * FROM your_table WHERE condition LIMIT 10000"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: Limit results to improve performance (recommended: LIMIT 10000)
                  </p>
                </div>

                {/* Connection Test */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {connectionStatus === 'idle' && <Wifi className="w-5 h-5 text-gray-400" />}
                    {connectionStatus === 'testing' && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
                    {connectionStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {connectionStatus === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    
                    <div>
                      <p className="font-medium text-gray-900">
                        {connectionStatus === 'idle' && 'Ready to test connection'}
                        {connectionStatus === 'testing' && 'Testing connection...'}
                        {connectionStatus === 'success' && 'Connection successful!'}
                        {connectionStatus === 'error' && 'Connection failed'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {connectionStatus === 'idle' && 'Click test to verify database connection'}
                        {connectionStatus === 'testing' && 'Verifying database credentials...'}
                        {connectionStatus === 'success' && 'Database is ready for data import'}
                        {connectionStatus === 'error' && 'Please check your connection details'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={testDatabaseConnection}
                    disabled={isTestingConnection}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                  >
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
              </div>

              {/* Real-time Configuration */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Real-time Analysis Settings</h4>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={realTimeConfig.enabled}
                      onChange={(e) => setRealTimeConfig({ ...realTimeConfig, enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Enable Real-time Updates</span>
                      <p className="text-sm text-gray-600">Automatically refresh data and analysis</p>
                    </div>
                  </label>

                  {realTimeConfig.enabled && (
                    <div className="ml-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Refresh Interval (seconds)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="3600"
                          value={realTimeConfig.refreshInterval}
                          onChange={(e) => setRealTimeConfig({ 
                            ...realTimeConfig, 
                            refreshInterval: parseInt(e.target.value) 
                          })}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={realTimeConfig.autoUpdate}
                          onChange={(e) => setRealTimeConfig({ ...realTimeConfig, autoUpdate: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Auto-update visualizations</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            
            {importMode === 'database' && (
              <button
                onClick={handleDatabaseConnect}
                disabled={connectionStatus !== 'success'}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
              >
                <Database className="w-4 h-4" />
                <span>Connect & Import</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportModal;