import React from 'react';
import { CheckCircle, Clock, AlertCircle, BarChart3, Database, Filter, TrendingUp, Target, FileText, Download } from 'lucide-react';

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  details?: string[];
  progress?: number;
}

interface ProcessingStepsProps {
  currentStep: number;
  dataset?: any;
  processingDetails?: any;
}

const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ currentStep, dataset, processingDetails }) => {
  const steps: ProcessingStep[] = [
    {
      id: 'upload',
      title: 'Data Upload & Validation',
      description: 'Uploading and validating CSV file structure',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'processing' : 'pending',
      details: dataset ? [
        `File processed successfully`,
        `${dataset.summary?.totalRows || 0} rows detected`,
        `${dataset.summary?.totalColumns || 0} columns identified`,
        `Data types automatically detected`
      ] : []
    },
    {
      id: 'cleaning',
      title: 'Data Cleaning Pipeline',
      description: 'Handling missing values, duplicates, and outliers',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'processing' : 'pending',
      details: dataset ? [
        `Missing values: ${dataset.summary?.missingValues || 0} detected`,
        `Duplicate rows: ${dataset.summary?.duplicates || 0} found`,
        `Outliers: ${dataset.summary?.outliers || 0} identified`,
        `Data quality score: 85/100`
      ] : []
    },
    {
      id: 'preprocessing',
      title: 'Data Preprocessing',
      description: 'Normalizing features and encoding categorical variables',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'processing' : 'pending',
      details: dataset ? [
        `Numerical features normalized`,
        `Categorical variables encoded`,
        `Feature scaling applied`,
        `Data ready for analysis`
      ] : []
    },
    {
      id: 'eda',
      title: 'Exploratory Data Analysis',
      description: 'Generating statistical summaries and correlations',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'processing' : 'pending',
      details: [
        'Statistical summaries calculated',
        'Correlation matrix generated',
        'Distribution patterns analyzed',
        'Data insights extracted'
      ]
    },
    {
      id: 'visualization',
      title: 'Data Visualization',
      description: 'Creating interactive charts and dashboards',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'processing' : 'pending',
      details: [
        'Distribution plots generated',
        'Correlation heatmaps created',
        'Box plots for outlier detection',
        'Interactive dashboard built'
      ]
    },
    {
      id: 'modeling',
      title: 'Machine Learning Analysis',
      description: 'Testing multiple ML algorithms and model selection',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'processing' : 'pending',
      details: [
        'Multiple algorithms tested',
        'Model performance evaluated',
        'Best model selected',
        'Feature importance calculated'
      ]
    },
    {
      id: 'report',
      title: 'Report Generation',
      description: 'Creating comprehensive analysis report',
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'processing' : 'pending',
      details: [
        'PDF report with visualizations',
        'Cleaned dataset export',
        'Model performance summary',
        'Actionable insights included'
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStepIcon = (stepId: string) => {
    const iconMap = {
      upload: Database,
      cleaning: Filter,
      preprocessing: BarChart3,
      eda: TrendingUp,
      visualization: BarChart3,
      modeling: Target,
      report: FileText
    };
    const Icon = iconMap[stepId as keyof typeof iconMap] || Database;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Processing Pipeline Status</h3>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className={`p-4 rounded-lg border transition-all duration-300 ${
            step.status === 'completed' ? 'border-green-200 bg-green-50/50' :
            step.status === 'processing' ? 'border-blue-200 bg-blue-50/50' :
            step.status === 'error' ? 'border-red-200 bg-red-50/50' :
            'border-gray-200 bg-gray-50/30'
          }`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getStatusIcon(step.status)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStepIcon(step.id)}
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    step.status === 'completed' ? 'bg-green-100 text-green-700' :
                    step.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    step.status === 'error' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? 'Completed' :
                     step.status === 'processing' ? 'Processing...' :
                     step.status === 'error' ? 'Error' : 'Pending'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                
                {step.details && step.details.length > 0 && (
                  <div className="space-y-1">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center space-x-2 text-xs text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {step.status === 'processing' && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">AI-Powered Analysis</h4>
            <p className="text-sm text-blue-700">
              Advanced machine learning algorithms automatically analyzing your data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingSteps;