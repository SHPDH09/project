import React, { useState, useCallback } from 'react';
import { Upload, FileText, BarChart3, TrendingUp, Download, CheckCircle, ArrowLeft, Eye } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ProcessingSteps from './components/ProcessingSteps';
import DataOverview from './components/DataOverview';
import DataCleaning from './components/DataCleaning';
import AdvancedDashboard from './components/AdvancedDashboard';
import ModelAnalysis from './components/ModelAnalysis';
import { ReportGeneration } from './components/ReportGeneration';
import VisualDashboard from './components/VisualDashboard';
import Footer from './components/Footer';
import { processCSVData, cleanData, generateEDAInsights, simulateModelPerformance } from './utils/dataAnalysis';
import type { DataSet, AnalysisResults } from './types/data';

function App() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dataset, setDataset] = useState<DataSet | null>(null);
  const [cleanedData, setCleanedData] = useState<any[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStepName, setProcessingStepName] = useState<string>('');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showVisualDashboard, setShowVisualDashboard] = useState(false);

  const goToStep = (stepIndex: number) => {
    if (!isProcessing && (completedSteps.includes(stepIndex) || stepIndex <= Math.max(...completedSteps, currentStep))) {
      setCurrentStep(stepIndex);
    }
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProcessingStepName('Uploading and validating CSV file...');
    try {
      // Process the uploaded CSV file
      const processedData = await processCSVData(file);
      setDataset(processedData);
      setCurrentStep(1);
      setCompletedSteps([0]);
      
      // Automatically proceed with data cleaning
      setProcessingStepName('Cleaning data and handling missing values...');
      setTimeout(async () => {
        const cleaned = cleanData(processedData.data);
        setCleanedData(cleaned);
        setCurrentStep(2);
        setCompletedSteps([0, 1]);
        
        // Generate EDA insights
        setProcessingStepName('Generating exploratory data analysis...');
        setTimeout(async () => {
          const insights = generateEDAInsights(cleaned, processedData.columns);
          const modelResults = simulateModelPerformance(cleaned);
          
          setAnalysisResults({
            insights,
            modelResults,
            summary: {
              totalRows: cleaned.length,
              totalColumns: processedData.columns.length,
              missingValues: processedData.summary.missingValues,
              duplicates: processedData.summary.duplicates,
              outliers: processedData.summary.outliers
            }
          });
          setCurrentStep(3);
          setCompletedSteps([0, 1, 2, 3]);
          setProcessingStepName('');
          setIsProcessing(false);
        }, 2000);
      }, 1500);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setIsProcessing(false);
    }
  }, []);

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
                Upload Your Dataset
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Get comprehensive automated analysis including data cleaning, exploratory data analysis, 
                feature engineering, and ML model recommendations - all in one click.
              </p>
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
            <ReportGeneration 
              dataset={dataset!}
              cleanedData={cleanedData}
              results={analysisResults}
              onComplete={() => setCurrentStep(4)}
            />
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
                  setCurrentStep(0);
                  setDataset(null);
                  setCleanedData([]);
                  setAnalysisResults(null);
                  setCompletedSteps([]);
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
              {processingStepName || 'Running automated analysis pipeline...'}
            </p>
            <div className="mt-4 bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">AI-Powered Analysis</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;