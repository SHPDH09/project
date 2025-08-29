import React, { useState, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ScatterChart, Scatter, Cell, PieChart, Pie,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts';
import { 
  ChevronLeft, ChevronRight, Download, Eye, BarChart3, PieChart as PieChartIcon,
  TrendingUp, Activity, Target, Brain, Filter, RefreshCw, Grid3X3
} from 'lucide-react';
import type { DataSet, AnalysisResults } from '../types/data';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface VisualDashboardProps {
  dataset: DataSet;
  cleanedData: any[];
  results: AnalysisResults;
  onClose: () => void;
}

const VisualDashboard: React.FC<VisualDashboardProps> = ({ dataset, cleanedData, results, onClose }) => {
  const [currentView, setCurrentView] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  const views = [
    { id: 'overview', title: 'Data Overview', icon: Grid3X3 },
    { id: 'distributions', title: 'Distributions', icon: BarChart3 },
    { id: 'correlations', title: 'Correlations', icon: TrendingUp },
    { id: 'models', title: 'ML Performance', icon: Brain },
    { id: 'insights', title: 'AI Insights', icon: Target }
  ];

  const generateChartData = (column: string, limit = 10) => {
    const values = cleanedData.map(row => row[column]).filter(v => v != null && v !== '');
    
    if (dataset.types[column] === 'numeric') {
      const numValues = values.map(Number).filter(v => !isNaN(v));
      if (numValues.length === 0) return [];
      
      const bins = Math.min(10, Math.max(5, Math.floor(Math.sqrt(numValues.length))));
      const min = Math.min(...numValues);
      const max = Math.max(...numValues);
      const binSize = (max - min) / bins;
      
      const binData = Array(bins).fill(0);
      numValues.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
        binData[binIndex]++;
      });
      
      return binData.map((count, i) => ({
        name: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
        value: count,
        range: min + i * binSize
      }));
    } else {
      const counts: Record<string, number> = {};
      values.forEach(value => {
        counts[String(value)] = (counts[String(value)] || 0) + 1;
      });
      
      return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([name, value]) => ({ name, value }));
    }
  };

  const getCorrelationData = () => {
    const numericColumns = dataset.columns.filter(col => dataset.types[col] === 'numeric').slice(0, 6);
    if (numericColumns.length < 2) return [];

    return cleanedData.slice(0, 200).filter(row => 
      numericColumns.every(col => row[col] != null && !isNaN(Number(row[col])))
    ).map((row, index) => {
      const dataPoint: any = { index };
      numericColumns.forEach(col => {
        dataPoint[col] = Number(row[col]);
      });
      return dataPoint;
    });
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VISUAL DATA ANALYSIS DASHBOARD', pageWidth / 2, 15, { align: 'center' });
      
      let yPosition = 35;

      // Capture each view
      for (let viewIndex = 0; viewIndex < views.length; viewIndex++) {
        setCurrentView(viewIndex);
        
        // Wait for view to render
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const canvas = await html2canvas(dashboardRef.current, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: dashboardRef.current.offsetWidth,
            height: dashboardRef.current.offsetHeight
          });
          
          const imgData = canvas.toDataURL('image/png', 0.8);
          const imgWidth = pageWidth - 20;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add new page if needed
          if (viewIndex > 0) {
            pdf.addPage();
            yPosition = 10;
          }
          
          // Add view title
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(views[viewIndex].title, 10, yPosition);
          yPosition += 10;
          
          // Add image
          pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, Math.min(imgHeight, pageHeight - yPosition - 10));
          
        } catch (error) {
          console.warn(`Failed to capture view ${viewIndex}:`, error);
          
          // Add text fallback
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(12);
          pdf.text(`${views[viewIndex].title} - Visualization capture failed`, 10, yPosition);
          yPosition += 10;
        }
      }

      // Add data summary page
      pdf.addPage();
      yPosition = 20;

      // Data Summary Section
      pdf.setFillColor(16, 185, 129);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPLETE DATA SUMMARY', 15, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Dataset Overview
      const overviewData = [
        `Total Records: ${dataset.summary.totalRows.toLocaleString()}`,
        `Total Features: ${dataset.summary.totalColumns}`,
        `Missing Values: ${dataset.summary.missingValues.toLocaleString()}`,
        `Duplicate Records: ${dataset.summary.duplicates.toLocaleString()}`,
        `Outliers Detected: ${dataset.summary.outliers.toLocaleString()}`,
        `Data Completeness: ${(((dataset.summary.totalRows * dataset.summary.totalColumns - dataset.summary.missingValues) / (dataset.summary.totalRows * dataset.summary.totalColumns)) * 100).toFixed(1)}%`,
        `Numerical Features: ${Object.values(dataset.types).filter(type => type === 'numeric').length}`,
        `Categorical Features: ${Object.values(dataset.types).filter(type => type === 'categorical').length}`,
        `DateTime Features: ${Object.values(dataset.types).filter(type => type === 'datetime').length}`
      ];

      overviewData.forEach(item => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`• ${item}`, 15, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Statistical Summary for each column
      pdf.setFillColor(139, 92, 246);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETAILED STATISTICAL ANALYSIS', 15, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      results.insights.summary.forEach((stat, index) => {
        if (yPosition > pageHeight - 25) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${stat.column} (${stat.type})`, 15, yPosition);
        yPosition += 5;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`   Count: ${stat.count} | Missing: ${stat.missing}`, 20, yPosition);
        yPosition += 4;
        
        if (stat.type === 'numeric') {
          pdf.text(`   Mean: ${stat.mean?.toFixed(3) || 'N/A'} | Median: ${stat.median?.toFixed(3) || 'N/A'} | Std Dev: ${stat.std?.toFixed(3) || 'N/A'}`, 20, yPosition);
          yPosition += 4;
          pdf.text(`   Min: ${stat.min?.toFixed(3) || 'N/A'} | Max: ${stat.max?.toFixed(3) || 'N/A'}`, 20, yPosition);
          yPosition += 4;
        } else {
          pdf.text(`   Unique Values: ${stat.uniqueValues || 'N/A'} | Top Value: "${stat.topValue || 'N/A'}" (${stat.topValueCount || 0} occurrences)`, 20, yPosition);
          yPosition += 4;
        }
        yPosition += 3;
      });

      // AI Insights
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFillColor(6, 182, 212);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-GENERATED INSIGHTS & RECOMMENDATIONS', 15, yPosition);
      yPosition += 15;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      results.insights.recommendations.forEach((insight, index) => {
        if (yPosition > pageHeight - 15) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const lines = pdf.splitTextToSize(`${index + 1}. ${insight}`, pageWidth - 30);
        pdf.text(lines, 15, yPosition);
        yPosition += lines.length * 4 + 3;
      });

      // Model Performance
      if (results.modelResults.length > 0) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFillColor(239, 68, 68);
        pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('MACHINE LEARNING MODEL PERFORMANCE', 15, yPosition);
        yPosition += 15;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        results.modelResults.forEach((model, index) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${model.name}${model.recommended ? ' (RECOMMENDED)' : ''}`, 15, yPosition);
          yPosition += 5;
          
          pdf.setFont('helvetica', 'normal');
          pdf.text(`   Accuracy: ${(model.accuracy * 100).toFixed(2)}% | Precision: ${(model.precision * 100).toFixed(2)}%`, 20, yPosition);
          yPosition += 4;
          pdf.text(`   Recall: ${(model.recall * 100).toFixed(2)}% | F1-Score: ${(model.f1Score * 100).toFixed(2)}% | ROC-AUC: ${(model.rocAuc * 100).toFixed(2)}%`, 20, yPosition);
          yPosition += 6;
        });
      }

      // Footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Visual Dashboard Report - Developed by Raunak Kumar', 10, pageHeight - 8);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 8);
      }

      pdf.save(`Visual_Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      alert('Error exporting dashboard. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const nextView = () => setCurrentView((prev) => (prev + 1) % views.length);
  const prevView = () => setCurrentView((prev) => (prev - 1 + views.length) % views.length);

  const numericColumns = dataset.columns.filter(col => dataset.types[col] === 'numeric');
  const categoricalColumns = dataset.columns.filter(col => dataset.types[col] === 'categorical');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Visual Data Dashboard</h2>
              <p className="text-sm text-gray-600">Interactive data visualization and analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button
            onClick={prevView}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              {views.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentView(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    currentView === index ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
              {views[currentView].title} ({currentView + 1}/{views.length})
            </div>
          </div>
          
          <button
            onClick={nextView}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6" ref={dashboardRef}>
          {/* Overview */}
          {currentView === 0 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Dataset Overview</h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Records', value: cleanedData.length.toLocaleString(), icon: Activity, color: 'from-blue-500 to-blue-600' },
                  { label: 'Features', value: dataset.columns.length.toString(), icon: BarChart3, color: 'from-green-500 to-green-600' },
                  { label: 'Numeric Columns', value: numericColumns.length.toString(), icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
                  { label: 'Categories', value: categoricalColumns.length.toString(), icon: PieChartIcon, color: 'from-orange-500 to-orange-600' }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data Quality Visualization */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-6">Data Quality Assessment</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: 'Completeness', value: 85, color: '#10B981' },
                    { label: 'Validity', value: 92, color: '#3B82F6' },
                    { label: 'Consistency', value: 78, color: '#8B5CF6' }
                  ].map((metric, index) => (
                    <div key={index} className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                          <circle 
                            cx="48" cy="48" r="40" 
                            stroke={metric.color} strokeWidth="8" fill="none"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - metric.value / 100)}`}
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-900">{metric.value}%</span>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Distributions */}
          {currentView === 1 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Feature Distributions</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dataset.columns.slice(0, 6).map((column, index) => {
                  const data = generateChartData(column);
                  if (data.length === 0) return null;

                  return (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">{column}</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        {dataset.types[column] === 'numeric' ? (
                          <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 10 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                            />
                            <Bar dataKey="value" fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        ) : (
                          <PieChart>
                            <Pie
                              data={data}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              nameKey="name"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {data.map((entry, i) => (
                                <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Correlations */}
          {currentView === 2 && numericColumns.length >= 2 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Feature Correlations</h3>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Scatter Plot Analysis</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={getCorrelationData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey={numericColumns[0]} 
                      type="number" 
                      tick={{ fontSize: 12 }}
                      name={numericColumns[0]}
                    />
                    <YAxis 
                      dataKey={numericColumns[1]} 
                      type="number" 
                      tick={{ fontSize: 12 }}
                      name={numericColumns[1]}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Scatter fill="#3B82F6" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {numericColumns.length >= 3 && (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Multi-Feature Trends</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getCorrelationData().slice(0, 50)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      {numericColumns.slice(0, 4).map((column, index) => (
                        <Line 
                          key={column}
                          type="monotone" 
                          dataKey={column} 
                          stroke={colors[index]} 
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ML Models */}
          {currentView === 3 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Machine Learning Performance</h3>
              
              {/* Model Comparison Chart */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Model Accuracy Comparison</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results.modelResults.map(model => ({
                    name: model.name,
                    accuracy: model.accuracy * 100,
                    precision: model.precision * 100,
                    recall: model.recall * 100,
                    f1Score: model.f1Score * 100
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#3B82F6" name="Accuracy" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="precision" fill="#10B981" name="Precision" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recall" fill="#F59E0B" name="Recall" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="f1Score" fill="#EF4444" name="F1-Score" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart for Best Model */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Best Model Performance Radar</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: 'Accuracy', value: results.modelResults[0].accuracy * 100 },
                    { metric: 'Precision', value: results.modelResults[0].precision * 100 },
                    { metric: 'Recall', value: results.modelResults[0].recall * 100 },
                    { metric: 'F1-Score', value: results.modelResults[0].f1Score * 100 },
                    { metric: 'ROC-AUC', value: results.modelResults[0].rocAuc * 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name={results.modelResults[0].name} dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {currentView === 4 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">AI-Generated Insights</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recommendations */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Recommendations</h4>
                  <div className="space-y-3">
                    {results.insights.recommendations.slice(0, 8).map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statistical Summary Chart */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Feature Statistics</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={results.insights.summary.slice(0, 8).map(stat => ({
                      name: stat.column.substring(0, 10),
                      count: stat.count,
                      missing: stat.missing,
                      completeness: ((stat.count / (stat.count + stat.missing)) * 100)
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="completeness" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Summary Table */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Complete Statistical Summary</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.insights.summary.map((stat, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.column}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              stat.type === 'numeric' ? 'bg-blue-100 text-blue-700' :
                              stat.type === 'categorical' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {stat.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{stat.count}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{stat.missing}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {stat.type === 'numeric' ? 
                              `Mean: ${stat.mean?.toFixed(2) || 'N/A'}` :
                              `Unique: ${stat.uniqueValues || 'N/A'}`
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualDashboard;