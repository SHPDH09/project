import React, { useState } from 'react';
import { Download, FileText, Table, Database, Settings, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import type { DataSet, AnalysisResults, ExportOptions } from '../types/data';

interface ExportOptionsProps {
  dataset: DataSet;
  cleanedData: any[];
  results: AnalysisResults;
  onExport: (format: string) => void;
}

const ExportOptionsComponent: React.FC<ExportOptionsProps> = ({
  dataset,
  cleanedData,
  results,
  onExport
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    includeVisualizations: true,
    includeRawData: true,
    includeModelDetails: true,
    customSections: ['summary', 'insights', 'models']
  });
  
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    setIsExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Raw Data Sheet
      if (exportOptions.includeRawData) {
        const rawDataSheet = XLSX.utils.json_to_sheet(cleanedData);
        XLSX.utils.book_append_sheet(workbook, rawDataSheet, 'Cleaned_Data');
      }
      
      // Statistical Summary Sheet
      const summaryData = results.insights.summary.map(stat => ({
        Column: stat.column,
        Type: stat.type,
        Count: stat.count,
        Missing: stat.missing,
        'Missing %': stat.missingPercentage?.toFixed(2) + '%',
        Mean: stat.mean?.toFixed(4),
        Median: stat.median?.toFixed(4),
        'Std Dev': stat.std?.toFixed(4),
        Min: stat.min?.toFixed(4),
        Max: stat.max?.toFixed(4),
        Skewness: stat.skewness?.toFixed(4),
        Kurtosis: stat.kurtosis?.toFixed(4),
        'Unique Values': stat.uniqueValues,
        'Top Value': stat.topValue,
        Entropy: stat.entropy?.toFixed(4)
      }));
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Statistical_Summary');
      
      // Model Performance Sheet
      if (exportOptions.includeModelDetails && results.modelResults.length > 0) {
        const modelData = results.modelResults.map(model => ({
          Model: model.name,
          'Accuracy (%)': (model.accuracy * 100).toFixed(2),
          'Precision (%)': (model.precision * 100).toFixed(2),
          'Recall (%)': (model.recall * 100).toFixed(2),
          'F1-Score (%)': (model.f1Score * 100).toFixed(2),
          'ROC-AUC (%)': (model.rocAuc * 100).toFixed(2),
          Recommended: model.recommended ? 'Yes' : 'No'
        }));
        
        const modelSheet = XLSX.utils.json_to_sheet(modelData);
        XLSX.utils.book_append_sheet(workbook, modelSheet, 'Model_Performance');
      }
      
      // Data Quality Sheet
      const qualityData = [{
        'Data Quality Score': results.insights.dataQuality.overall.toFixed(1) + '%',
        'Completeness': results.insights.dataQuality.completeness.toFixed(1) + '%',
        'Consistency': results.insights.dataQuality.consistency.toFixed(1) + '%',
        'Validity': results.insights.dataQuality.validity.toFixed(1) + '%',
        'Accuracy': results.insights.dataQuality.accuracy.toFixed(1) + '%',
        'Total Records': dataset.summary.totalRows,
        'Total Features': dataset.summary.totalColumns,
        'Missing Values': dataset.summary.missingValues,
        'Duplicates': dataset.summary.duplicates,
        'Outliers': dataset.summary.outliers,
        'Memory Usage (MB)': dataset.summary.memoryUsage?.toFixed(2)
      }];
      
      const qualitySheet = XLSX.utils.json_to_sheet(qualityData);
      XLSX.utils.book_append_sheet(workbook, qualitySheet, 'Data_Quality');
      
      // Recommendations Sheet
      const recommendationsData = results.insights.recommendations.map((rec, index) => ({
        'Recommendation #': index + 1,
        'Insight': rec
      }));
      
      const recSheet = XLSX.utils.json_to_sheet(recommendationsData);
      XLSX.utils.book_append_sheet(workbook, recSheet, 'AI_Insights');
      
      // Export the file
      const fileName = `Advanced_Data_Analysis_${dataset.metadata.fileName.replace(/\.[^/.]+$/, '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      onExport('excel');
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      const csv = Papa.unparse(cleanedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Cleaned_Data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      onExport('csv');
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('Failed to export CSV file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        metadata: dataset.metadata,
        summary: dataset.summary,
        insights: results.insights,
        modelResults: results.modelResults,
        cleanedData: exportOptions.includeRawData ? cleanedData : null,
        exportTime: new Date().toISOString()
      };
      
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Analysis_Results_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      onExport('json');
    } catch (error) {
      console.error('JSON export failed:', error);
      alert('Failed to export JSON file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Download className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export Analysis Results</h3>
          <p className="text-gray-600">Download your data and analysis in multiple formats</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4 mb-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exportOptions.includeRawData}
                onChange={(e) => setExportOptions({ ...exportOptions, includeRawData: e.target.checked })}
                className="rounded border-gray-300 text-green-600"
              />
              <span className="text-sm text-gray-700">Include cleaned dataset</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exportOptions.includeModelDetails}
                onChange={(e) => setExportOptions({ ...exportOptions, includeModelDetails: e.target.checked })}
                className="rounded border-gray-300 text-green-600"
              />
              <span className="text-sm text-gray-700">Include ML model performance</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exportOptions.includeVisualizations}
                onChange={(e) => setExportOptions({ ...exportOptions, includeVisualizations: e.target.checked })}
                className="rounded border-gray-300 text-green-600"
              />
              <span className="text-sm text-gray-700">Include visualization data</span>
            </label>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={exportToExcel}
          disabled={isExporting}
          className="flex items-center justify-center space-x-3 p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <Table className="w-5 h-5" />
          <div className="text-left">
            <p className="font-medium">Excel Report</p>
            <p className="text-xs opacity-90">Multi-sheet analysis</p>
          </div>
        </button>

        <button
          onClick={exportToCSV}
          disabled={isExporting}
          className="flex items-center justify-center space-x-3 p-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <FileText className="w-5 h-5" />
          <div className="text-left">
            <p className="font-medium">CSV Data</p>
            <p className="text-xs opacity-90">Cleaned dataset</p>
          </div>
        </button>

        <button
          onClick={exportToJSON}
          disabled={isExporting}
          className="flex items-center justify-center space-x-3 p-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          <Database className="w-5 h-5" />
          <div className="text-left">
            <p className="font-medium">JSON Export</p>
            <p className="text-xs opacity-90">Complete analysis</p>
          </div>
        </button>
      </div>

      {/* Export Status */}
      {isExporting && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="font-medium text-blue-900">Preparing export...</p>
              <p className="text-sm text-blue-700">This may take a moment for large datasets</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportOptionsComponent;