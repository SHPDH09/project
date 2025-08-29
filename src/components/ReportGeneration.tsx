import React from 'react';
import { FileText, Download, CheckCircle, BarChart3, TrendingUp, Database } from 'lucide-react';
import { DataSet, AnalysisResults } from '../types/data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportGenerationProps {
  dataset: DataSet;
  cleanedData: any[];
  results: AnalysisResults;
  onComplete: () => void;
}

export const ReportGeneration: React.FC<ReportGenerationProps> = ({
  dataset,
  cleanedData,
  results,
  onComplete
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  
  // Extract data from props
  const { insights, modelResults } = results;
  const data = {
    summary: {
      totalRecords: dataset.summary.totalRows,
      totalFeatures: dataset.summary.totalColumns,
      completeness: ((dataset.summary.totalRows - dataset.summary.missingValues) / dataset.summary.totalRows) * 100,
      missingValues: dataset.summary.missingValues,
      duplicates: dataset.summary.duplicates,
      outliers: dataset.summary.outliers,
      numericalFeatures: Object.values(dataset.types).filter(type => type === 'numeric').length,
      categoricalFeatures: Object.values(dataset.types).filter(type => type === 'categorical').length,
      dateTimeFeatures: Object.values(dataset.types).filter(type => type === 'datetime').length
    }
  };

  const captureVisualization = async (elementId: string): Promise<string | null> => {
    try {
      const element = document.getElementById(elementId);
      if (!element) return null;
      
      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
        logging: false,
        removeContainer: false,
        foreignObjectRendering: true
      });
      
      return canvas.toDataURL('image/png', 0.8);
    } catch (error) {
      console.warn(`Failed to capture ${elementId}:`, error);
      return null;
    }
  };

  const generatePDFReport = async () => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header with branding
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-POWERED AUTOMATIC DATA ANALYSIS', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Developed by Raunak Kumar', pageWidth / 2, 22, { align: 'center' });

      yPosition = 40;

      // Developer Information
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Developer Information', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Name: Raunak Kumar', 20, yPosition);
      yPosition += 5;
      pdf.text('Email: rk331159@gmail.com', 20, yPosition);
      yPosition += 5;
      pdf.text('Address: Bhagalpur, Bihar 813202, India', 20, yPosition);
      yPosition += 15;

      // Analysis Summary Section
      pdf.setFillColor(16, 185, 129);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ANALYSIS SUMMARY', 20, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Records: ${data.summary.totalRecords}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Total Features: ${data.summary.totalFeatures}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Data Completeness: ${data.summary.completeness.toFixed(1)}%`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Missing Values: ${data.summary.missingValues}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Duplicate Records: ${data.summary.duplicates}`, 20, yPosition);
      yPosition += 15;
      pdf.text(`Outliers Detected: ${data.summary.outliers.toLocaleString()}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Numerical Features: ${data.summary.numericalFeatures}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Categorical Features: ${data.summary.categoricalFeatures}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`DateTime Features: ${data.summary.dateTimeFeatures}`, 20, yPosition);

      // Column Information
      pdf.setFillColor(139, 92, 246);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATASET COLUMNS INFORMATION', 20, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Show all columns with their types
      dataset.columns.forEach((column, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. ${column} (${dataset.types[column]})`, 25, yPosition);
        yPosition += 4;
      });
      yPosition += 15;

      // Add new page for visualizations
      pdf.addPage();
      yPosition = 20;

      // Capture and add visualizations with better error handling
      const dashboardImage = await captureVisualization('eda-dashboard');
      if (dashboardImage) {
        pdf.setFillColor(147, 51, 234);
        pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DATA VISUALIZATIONS', 20, yPosition);
        yPosition += 15;

        try {
          pdf.addImage(dashboardImage, 'PNG', 20, yPosition, pageWidth - 40, 100);
          yPosition += 110;
        } catch (error) {
          console.warn('Failed to add dashboard image:', error);
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          pdf.text('Visualization capture failed - Charts available in web interface', 20, yPosition);
          yPosition += 10;
        }
      } else {
        pdf.setFillColor(147, 51, 234);
        pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DATA VISUALIZATIONS', 20, yPosition);
        yPosition += 15;
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.text('Interactive visualizations are available in the web interface:', 20, yPosition);
        yPosition += 5;
        pdf.text('• Distribution charts for all features', 25, yPosition);
        yPosition += 5;
        pdf.text('• Correlation analysis between numerical features', 25, yPosition);
        yPosition += 5;
        pdf.text('• Statistical summaries and data quality metrics', 25, yPosition);
        yPosition += 5;
        pdf.text('• Outlier detection and anomaly analysis', 25, yPosition);
        yPosition += 15;
      }

      // Add new page if needed
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      // Statistical Summary Section
      pdf.setFillColor(245, 158, 11);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('STATISTICAL SUMMARY', 20, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Show statistical summary for each column
      insights.summary.forEach((stat, index) => {
        if (yPosition > pageHeight - 25) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${stat.column} (${stat.type})`, 20, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`   Count: ${stat.count} | Missing: ${stat.missing}`, 25, yPosition);
        yPosition += 4;
        
        if (stat.type === 'numeric') {
          pdf.text(`   Mean: ${stat.mean?.toFixed(2) || 'N/A'} | Median: ${stat.median?.toFixed(2) || 'N/A'}`, 25, yPosition);
          yPosition += 4;
          pdf.text(`   Std Dev: ${stat.std?.toFixed(2) || 'N/A'} | Min: ${stat.min?.toFixed(2) || 'N/A'} | Max: ${stat.max?.toFixed(2) || 'N/A'}`, 25, yPosition);
          yPosition += 4;
        } else {
          pdf.text(`   Unique Values: ${stat.uniqueValues || 'N/A'} | Top Value: ${stat.topValue || 'N/A'} (${stat.topValueCount || 0})`, 25, yPosition);
          yPosition += 4;
        }
        yPosition += 3;
      });
      
      yPosition += 10;

      // AI Insights Section
      pdf.setFillColor(6, 182, 212);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-GENERATED INSIGHTS', 20, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      insights.recommendations.forEach((insight, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. RECOMMENDATION:`, 20, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(insight, pageWidth - 40);
        pdf.text(lines, 25, yPosition);
        yPosition += lines.length * 4 + 5;
      });

      // Data Quality Report
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFillColor(34, 197, 94);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DATA QUALITY REPORT', 20, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const qualityMetrics = [
        `Overall Data Completeness: ${data.summary.completeness.toFixed(1)}%`,
        `Missing Value Rate: ${((data.summary.missingValues / (data.summary.totalRecords * data.summary.totalFeatures)) * 100).toFixed(2)}%`,
        `Duplicate Rate: ${((data.summary.duplicates / data.summary.totalRecords) * 100).toFixed(2)}%`,
        `Outlier Rate: ${((data.summary.outliers / data.summary.totalRecords) * 100).toFixed(2)}%`,
        `Data Type Distribution: ${data.summary.numericalFeatures} numerical, ${data.summary.categoricalFeatures} categorical, ${data.summary.dateTimeFeatures} datetime`,
        `Records Processed Successfully: ${cleanedData.length.toLocaleString()} out of ${data.summary.totalRecords.toLocaleString()}`,
        `Data Quality Score: ${data.summary.completeness > 90 ? 'Excellent' : data.summary.completeness > 80 ? 'Good' : data.summary.completeness > 70 ? 'Fair' : 'Needs Improvement'}`
      ];
      
      qualityMetrics.forEach((metric, index) => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`• ${metric}`, 20, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;

      // Model Performance Section
      if (modelResults.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFillColor(239, 68, 68);
        pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MODEL PERFORMANCE ANALYSIS', 20, yPosition);
        yPosition += 15;

        const bestModel = modelResults.reduce((best, current) => 
          current.accuracy > best.accuracy ? current : best
        );

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Best Performing Model:', 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Algorithm: ${bestModel.name}`, 25, yPosition);
        yPosition += 5;
        pdf.text(`Accuracy: ${(bestModel.accuracy * 100).toFixed(2)}%`, 25, yPosition);
        yPosition += 5;
        pdf.text(`Precision: ${(bestModel.precision * 100).toFixed(2)}%`, 25, yPosition);
        yPosition += 5;
        pdf.text(`Recall: ${(bestModel.recall * 100).toFixed(2)}%`, 25, yPosition);
        yPosition += 5;
        pdf.text(`F1-Score: ${(bestModel.f1Score * 100).toFixed(2)}%`, 25, yPosition);
        yPosition += 5;
        pdf.text(`ROC-AUC: ${(bestModel.rocAuc * 100).toFixed(2)}%`, 25, yPosition);
        yPosition += 10;

        // All models comparison
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('All Models Comparison:', 20, yPosition);
        yPosition += 8;

        modelResults.forEach((model, index) => {
          if (yPosition > pageHeight - 15) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${model.name}`, 25, yPosition);
          yPosition += 4;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`   Accuracy: ${(model.accuracy * 100).toFixed(2)}% | Precision: ${(model.precision * 100).toFixed(2)}%`, 25, yPosition);
          yPosition += 4;
          pdf.text(`   Recall: ${(model.recall * 100).toFixed(2)}% | F1-Score: ${(model.f1Score * 100).toFixed(2)}% | ROC-AUC: ${(model.rocAuc * 100).toFixed(2)}%`, 25, yPosition);
          yPosition += 6;
        });
      }

      // Processing Summary
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFillColor(168, 85, 247);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROCESSING PIPELINE SUMMARY', 20, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const processingSteps = [
        '✓ Data Upload & Validation - CSV file processed successfully',
        '✓ Data Cleaning Pipeline - Missing values, duplicates, and outliers handled',
        '✓ Data Preprocessing - Features normalized and encoded',
        '✓ Exploratory Data Analysis - Statistical summaries generated',
        '✓ Data Visualization - Interactive charts and dashboards created',
        '✓ Machine Learning Analysis - Multiple algorithms tested and evaluated',
        '✓ Report Generation - Comprehensive analysis report created'
      ];
      
      processingSteps.forEach((step, index) => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(step, 20, yPosition);
        yPosition += 6;
      });

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Contact: rk331159@gmail.com | Bhagalpur, Bihar 813202', 10, pageHeight - 8);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 8);
      }

      // Save the PDF
      pdf.save(`AI_Data_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Analysis Report</h2>
            <p className="text-gray-600">Comprehensive data analysis summary</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Records</p>
                <p className="text-2xl font-bold text-blue-800">{data.summary.totalRecords.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Features</p>
                <p className="text-2xl font-bold text-green-800">{data.summary.totalFeatures}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Data Quality</p>
                <p className="text-2xl font-bold text-purple-800">{data.summary.completeness.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Insights</h3>
          <div className="space-y-2">
            {insights.recommendations.slice(0, 3).map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Best Model */}
        {modelResults.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-indigo-800 mb-3">Best Performing Model</h3>
            {(() => {
              const bestModel = modelResults.reduce((best, current) => 
                current.accuracy > best.accuracy ? current : best
              );
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-indigo-600">Algorithm</p>
                    <p className="font-semibold text-indigo-800">{bestModel.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600">Accuracy</p>
                    <p className="font-semibold text-indigo-800">{(bestModel.accuracy * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600">Precision</p>
                    <p className="font-semibold text-indigo-800">{(bestModel.precision * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600">F1-Score</p>
                    <p className="font-semibold text-indigo-800">{(bestModel.f1Score * 100).toFixed(2)}%</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Generate PDF Button */}
        <div className="flex justify-center">
          <button
            onClick={generatePDFReport}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? 'Generating Report...' : 'Download PDF Report'}
          </button>
        </div>
      </div>
    </div>
  );
};