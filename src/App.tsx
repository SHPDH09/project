import React, { useState, useCallback } from 'react';
import { Upload, FileText, BarChart3, TrendingUp, Download, CheckCircle, ArrowLeft, Eye, Database, Wifi, Plus } from 'lucide-react';
import FileUpload from './components/FileUpload';
import DataImportModal from './components/DataImportModal';
import ExportOptionsComponent from './components/ExportOptions';
import ProcessingSteps from './components/ProcessingSteps';
import DataOverview from './components/DataOverview';
import DataCleaning from './components/DataCleaning';
import AdvancedDashboard from './components/AdvancedDashboard';
import ModelAnalysis from './components/ModelAnalysis';
import { ReportGeneration } from './components/ReportGeneration';
import VisualDashboard from './components/VisualDashboard';
import Footer from './components/Footer';
import { processFileData, performAdvancedCleaning, generateAdvancedEDAInsights, connectToDatabase, setupRealTimeUpdates } from './utils/advancedDataAnalysis';
import { simulateModelPerformance } from './utils/dataAnalysis';
import type { DataSet, AnalysisResults, DatabaseConnection, RealTimeConfig } from './types/data';

function App() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dataset, setDataset] = useState<DataSet | null>(null);
  const [cleanedData, setCleanedData] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStepName, setProcessingStepName] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showVisualDashboard, setShowVisualDashboard] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [realTimeInterval, setRealTimeInterval] = useState<NodeJS.Timeout | null>(null);
  const [dataSource, setDataSource] = useState<'file' | 'database'>('file');

  const goToStep = (stepIndex: number) => {
    if (!isProcessing && (completedSteps.includes(stepIndex) || stepIndex <= Math.max(...completedSteps, currentStep))) {
      setCurrentStep(stepIndex);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingStepName('Processing file with advanced algorithms...');
    setDataSource('file');
    
    try {
      // Process the uploaded file (CSV or Excel)
      const processedData = await processFileData(file);
      setDataset(processedData);
      setCurrentStep(1);
      setCompletedSteps([0]);
      
      // Automatically proceed with advanced data cleaning
      setProcessingStepName('Applying advanced data preprocessing pipeline...');
      setTimeout(async () => {
        const cleaningResults = performAdvancedCleaning(processedData.data, processedData.columns, processedData.types);
        setCleanedData(cleaningResults.data);
        setCurrentStep(2);
        setCompletedSteps([0, 1]);
        
        // Generate advanced EDA insights
        setProcessingStepName('Generating comprehensive statistical analysis...');
        setTimeout(async () => {
          const insights = generateAdvancedEDAInsights(cleaningResults.data, processedData.columns, processedData.types);
          const modelResults = simulateModelPerformance(cleaningResults.data);
          
          setAnalysisResults({
            insights,
            modelResults,
            summary: {
              totalRows: cleaningResults.data.length,
              totalColumns: processedData.columns.length,
              missingValues: processedData.summary.missingValues,
              duplicates: processedData.summary.duplicates,
              outliers: processedData.summary.outliers,
              dataQualityScore: processedData.summary.dataQualityScore
            },
            preprocessing: {
              steps: ['missing_value_imputation', 'duplicate_removal', 'outlier_handling', 'type_conversion'],
              transformations: cleaningResults.transformations,
              scalingMethod: cleaningResults.scalingMethod,
              encodingMethod: cleaningResults.encodingMethod
            }
          });
          setCurrentStep(3);
          setCompletedSteps([0, 1, 2, 3]);
          setProcessingStepName('');
          setIsProcessing(false);
        }, 2500);
      }, 2000);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setProcessingStepName('');
      setIsProcessing(false);
      alert(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleDatabaseConnect = useCallback(async (connection: DatabaseConnection, realTimeConfig: RealTimeConfig) => {
    setIsProcessing(true);
    setProcessingStepName('Connecting to database...');
    setDataSource('database');
    
    try {
      const processedData = await connectToDatabase(connection, realTimeConfig);
      setDataset(processedData);
      setCurrentStep(1);
      setCompletedSteps([0]);
      
      // Setup real-time updates if enabled
      if (realTimeConfig.enabled) {
        setIsRealTimeEnabled(true);
        const interval = setupRealTimeUpdates(connection, realTimeConfig, (updatedData) => {
          setDataset(updatedData);
          // Re-run analysis pipeline
          const cleaningResults = performAdvancedCleaning(updatedData.data, updatedData.columns, updatedData.types);
          setCleanedData(cleaningResults.data);
          
          const insights = generateAdvancedEDAInsights(cleaningResults.data, updatedData.columns, updatedData.types);
          const modelResults = simulateModelPerformance(cleaningResults.data);
          
          setAnalysisResults({
            insights,
            modelResults,
            summary: {
              totalRows: cleaningResults.data.length,
              totalColumns: updatedData.columns.length,
              missingValues: updatedData.summary.missingValues,
              duplicates: updatedData.summary.duplicates,
              outliers: updatedData.summary.outliers,
              dataQualityScore: updatedData.summary.dataQualityScore
            },
            preprocessing: {
              steps: ['missing_value_imputation', 'duplicate_removal', 'outlier_handling', 'type_conversion'],
              transformations: cleaningResults.transformations,
              scalingMethod: cleaningResults.scalingMethod,
              encodingMethod: cleaningResults.encodingMethod
            }
          });
        });
        setRealTimeInterval(interval);
      }
      
      // Continue with processing
      setProcessingStepName('Processing database data...');
      setTimeout(async () => {
        const cleaningResults = performAdvancedCleaning(processedData.data, processedData.columns, processedData.types);
        setCleanedData(cleaningResults.data);
        setCurrentStep(2);
        setCompletedSteps([0, 1]);
        
        setProcessingStepName('Generating advanced analytics...');
        setTimeout(async () => {
          const insights = generateAdvancedEDAInsights(cleaningResults.data, processedData.columns, processedData.types);
          const modelResults = simulateModelPerformance(cleaningResults.data);
          
          setAnalysisResults({
            insights,
            modelResults,
            summary: {
              totalRows: cleaningResults.data.length,
              totalColumns: processedData.columns.length,
              missingValues: processedData.summary.missingValues,
              duplicates: processedData.summary.duplicates,
              outliers: processedData.summary.outliers,
              dataQualityScore: processedData.summary.dataQualityScore
            },
            preprocessing: {
              steps: ['missing_value_imputation', 'duplicate_removal', 'outlier_handling', 'type_conversion'],
              transformations: cleaningResults.transformations,
              scalingMethod: cleaningResults.scalingMethod,
              encodingMethod: cleaningResults.encodingMethod
            }
          });
          setCurrentStep(3);
          setCompletedSteps([0, 1, 2, 3]);
          setProcessingStepName('');
          setIsProcessing(false);
        }, 2000);
      }, 1500);
      
    } catch (error) {
      console.error('Error connecting to database:', error);
      setProcessingStepName('');
      setIsProcessing(false);
      alert(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleExport = (format: string) => {
    console.log(`Exported as ${format}`);
  };

  const stopRealTimeUpdates = () => {
    if (realTimeInterval) {
      clearInterval(realTimeInterval);
      setRealTimeInterval(null);
      setIsRealTimeEnabled(false);
    }
  };

  const steps = [
    { icon: Upload, title: 'Upload Data', description: 'Upload your CSV file' },
    { icon: FileText, title: 'Data Cleaning', description: 'Automatic data preprocessing' },
    { icon: BarChart3, title: 'EDA & Visualization', description: 'Exploratory data analysis' },
    { icon: TrendingUp, title: 'Model Analysis', description: 'ML model recommendations' },
    { icon: Download, title: 'Generate Report', description: 'Download analysis report' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  AI Data Analyzer
                </h1>
                <p className="text-sm text-gray-600">Automated Machine Learning Pipeline</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {/* Real-time indicator */}
              {isRealTimeEnabled && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  <Wifi className="w-4 h-4" />
                  <span>Live Data</span>
                </div>
              )}
              
              {/* Data source indicator */}
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                dataSource === 'database' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {dataSource === 'database' ? <Database className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                <span>{dataSource === 'database' ? 'Database' : 'File'}</span>
              </div>
              
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = completedSteps.includes(index);
                const isCurrent = index === currentStep;
                const isClickable = !isProcessing && (isCompleted || index <= Math.max(...completedSteps, currentStep));
                
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <button
                      onClick={() => goToStep(index)}
                      disabled={!isClickable}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted ? 'bg-green-500 text-white' : 
                        isCurrent ? 'bg-blue-500 text-white' : 
                        isClickable ? 'bg-blue-200 text-blue-600' :
                        'bg-gray-200 text-gray-500'
                    } ${isClickable ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </button>
                    <span className={`text-xs font-medium hidden lg:block ${
                      isCompleted || isCurrent || isClickable ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-px ${
                        isCompleted ? 'bg-green-500' : 
                        index < currentStep ? 'bg-blue-300' : 
                        'bg-gray-200'
                      } transition-colors duration-300`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 0: File Upload */}
        {currentStep === 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Import Your Data
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Advanced AI-powered analysis with real-time database connectivity and comprehensive 
                machine learning pipeline. Choose your data source to begin.
              </p>
              
              {/* Import Options */}
              <div className="flex justify-center space-x-6 mb-8">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-6 h-6" />
                  <div className="text-left">
                    <p className="font-semibold">Import Data</p>
                    <p className="text-sm opacity-90">File or Database</p>
                  </div>
                </button>
              </div>
            </div>
            <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
          </div>
        )}

        {/* Step 1: Data Overview & Cleaning */}
        {currentStep === 1 && dataset && (
          <div className="space-y-8">
            <ProcessingSteps currentStep={currentStep} dataset={dataset} />
            <DataOverview dataset={dataset} />
            <DataCleaning dataset={dataset} isProcessing={isProcessing} />
          </div>
        )}

        {/* Step 2: EDA Dashboard */}
        {currentStep === 2 && dataset && cleanedData.length > 0 && (
          <div className="space-y-8">
            <ProcessingSteps currentStep={currentStep} dataset={dataset} />
            
            {/* Dashboard Controls */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Visualization Dashboard</h3>
                  <p className="text-gray-600">View your data in interactive visual format with comprehensive charts and analysis</p>
                </div>
                <button
                  onClick={() => setShowVisualDashboard(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  <Eye className="w-5 h-5" />
                  <span>Open Visual Dashboard</span>
                </button>
              </div>
            </div>
            
            <AdvancedDashboard 
              dataset={dataset} 
              cleanedData={cleanedData}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Step 3: Model Analysis */}
        {currentStep === 3 && analysisResults && (
          <div className="space-y-8">
            <ProcessingSteps currentStep={currentStep} dataset={dataset} />
            
            {/* Dashboard Controls */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Visual Analysis Dashboard</h3>
                  <p className="text-gray-600">Complete visual analysis with ML model performance and insights</p>
                </div>
                <button
                  onClick={() => setShowVisualDashboard(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                >
                  <Eye className="w-5 h-5" />
                  <span>View Dashboard</span>
                </button>
              </div>
            </div>
            
            <ModelAnalysis results={analysisResults} />
            
            {/* Export Options */}
            <ExportOptionsComponent
              dataset={dataset!}
              cleanedData={cleanedData}
              results={analysisResults}
              onExport={handleExport}
            />
            
            <div className="text-center">
              <button
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Complete Analysis
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 4 && (
          <div className="text-center space-y-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Analysis Complete!</h2>
              <p className="text-xl text-gray-600 mb-8">
                Your comprehensive data analysis report has been generated successfully.
              </p>
              <button
                onClick={() => {
                  stopRealTimeUpdates();
                  setCurrentStep(0);
                  setDataset(null);
                  setCleanedData([]);
                  setAnalysisResults(null);
                  setCompletedSteps([]);
                  setDataSource('file');
                }}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <Upload className="w-5 h-5 mr-2" />
                Analyze Another Dataset
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Visual Dashboard Modal */}
      {showVisualDashboard && dataset && analysisResults && (
        <VisualDashboard
          dataset={dataset}
          cleanedData={cleanedData}
          results={analysisResults}
          onClose={() => setShowVisualDashboard(false)}
        />
      )}
      
      {/* Data Import Modal */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onFileUpload={handleFileUpload}
        onDatabaseConnect={handleDatabaseConnect}
        isProcessing={isProcessing}
      />
      
      <Footer />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              AI Analysis in Progress
            </h3>
            <p className="text-gray-600">
              {processingStepName || 'Running advanced AI analysis pipeline...'}
            </p>
            <div className="mt-4 bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Advanced AI Processing</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;