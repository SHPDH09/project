import React from 'react';
import { Loader, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import type { DataSet } from '../types/data';

interface DataCleaningProps {
  dataset: DataSet;
  isProcessing: boolean;
}

const DataCleaning: React.FC<DataCleaningProps> = ({ dataset, isProcessing }) => {
  const cleaningSteps = [
    {
      title: 'Missing Value Detection',
      description: 'Identifying and handling null/empty values',
      status: 'completed',
      details: `Found ${dataset.summary.missingValues} missing values`
    },
    {
      title: 'Duplicate Removal',
      description: 'Removing duplicate rows from the dataset',
      status: isProcessing ? 'processing' : 'completed',
      details: `Found ${dataset.summary.duplicates} duplicate rows`
    },
    {
      title: 'Outlier Detection',
      description: 'Statistical outlier detection using IQR method',
      status: isProcessing ? 'pending' : 'completed',
      details: `Detected ${dataset.summary.outliers} potential outliers`
    },
    {
      title: 'Data Type Optimization',
      description: 'Optimizing column data types for analysis',
      status: isProcessing ? 'pending' : 'completed',
      details: 'Categorical and numerical columns identified'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Loader className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Cleaning Pipeline</h2>
        <p className="text-gray-600">Automated preprocessing and data quality improvements</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="space-y-4">
          {cleaningSteps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50/50">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                <p className="text-xs text-gray-500">{step.details}</p>
              </div>
            </div>
          ))}
        </div>

        {isProcessing && (
          <div className="mt-6 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-medium text-blue-900">Processing your data...</p>
                <p className="text-sm text-blue-700">This may take a few moments depending on dataset size</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataCleaning;