import React from 'react';
import { Database, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DataSet } from '../types/data';

interface DataOverviewProps {
  dataset: DataSet;
}

const DataOverview: React.FC<DataOverviewProps> = ({ dataset }) => {
  const stats = [
    {
      label: 'Total Rows',
      value: dataset.summary.totalRows.toLocaleString(),
      icon: Database,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      label: 'Total Columns',
      value: dataset.summary.totalColumns.toString(),
      icon: FileText,
      color: 'bg-green-100 text-green-600'
    },
    {
      label: 'Missing Values',
      value: dataset.summary.missingValues.toLocaleString(),
      icon: AlertTriangle,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      label: 'Duplicates',
      value: dataset.summary.duplicates.toLocaleString(),
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dataset Overview</h2>
        <p className="text-gray-600">Analysis of your uploaded dataset</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Column Types */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Column Analysis</h3>
        <div className="space-y-3">
          {dataset.columns.map((column, index) => (
            <div key={index} className="flex items-center justify-between py-2 px-4 bg-gray-50/80 rounded-lg">
              <span className="font-medium text-gray-900">{column}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                dataset.types[column] === 'numeric' 
                  ? 'bg-blue-100 text-blue-700'
                  : dataset.types[column] === 'categorical'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {dataset.types[column]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataOverview;