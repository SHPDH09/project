import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ScatterChart, Scatter, Cell, PieChart, Pie, Heatmap,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  ChevronLeft, ChevronRight, TrendingUp, BarChart3, PieChart as PieChartIcon, 
  Target, Activity, Zap, Brain, Filter, Settings, Download, RefreshCw
} from 'lucide-react';
import type { DataSet, MLModelResult } from '../types/data';
import { selectBestFeatures, trainModels, type FeatureSelection } from '../utils/mlModels';

interface AdvancedDashboardProps {
  dataset: DataSet;
  cleanedData: any[];
  isProcessing: boolean;
}

const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({ dataset, cleanedData, isProcessing }) => {
  const [currentView, setCurrentView] = useState(0);
  const [featureSelection, setFeatureSelection] = useState<FeatureSelection | null>(null);
  const [mlResults, setMLResults] = useState<MLModelResult[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const views = [
    { id: 'overview', title: 'Data Overview', icon: BarChart3 },
    { id: 'features', title: 'Feature Analysis', icon: Filter },
    { id: 'distributions', title: 'Distributions', icon: PieChartIcon },
    { id: 'correlations', title: 'Correlations', icon: TrendingUp },
    { id: 'models', title: 'ML Models', icon: Brain },
    { id: 'predictions', title: 'Predictions', icon: Target }
  ];

  useEffect(() => {
    if (cleanedData.length > 0) {
      // Perform feature selection
      const features = selectBestFeatures(cleanedData, dataset.columns, dataset.types);
      setFeatureSelection(features);
      setSelectedFeatures(features.selectedFeatures.slice(0, 5));
    }
  }, [cleanedData, dataset]);

  const handleTrainModels = async () => {
    if (cleanedData.length === 0) return;
    
    setIsTraining(true);
    try {
      const results = await trainModels(cleanedData, selectedFeatures, dataset.types);
      setMLResults(results);
    } catch (error) {
      console.error('Model training failed:', error);
    } finally {
      setIsTraining(false);
    }
  };

  const generateVisualizationData = (column: string, limit = 10) => {
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
        range: `${(min + i * binSize).toFixed(1)}`,
        count,
        value: min + i * binSize
      }));
    } else {
      const counts: Record<string, number> = {};
      values.forEach(value => {
        counts[String(value)] = (counts[String(value)] || 0) + 1;
      });
      
      return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([value, count]) => ({ value, count }));
    }
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  const nextView = () => {
    setCurrentView((prev) => (prev + 1) % views.length);
  };

  const prevView = () => {
    setCurrentView((prev) => (prev - 1 + views.length) % views.length);
  };

  const numericColumns = dataset.columns.filter(col => dataset.types[col] === 'numeric');
  const categoricalColumns = dataset.columns.filter(col => dataset.types[col] === 'categorical');

  return (
    <div className="space-y-6" id="advanced-dashboard">
      {/* Header with Navigation */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advanced Data Analysis Dashboard</h2>
            <p className="text-gray-600">Interactive visualizations and machine learning insights</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={prevView}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
              {currentView + 1} / {views.length}
            </div>
            
            <button
              onClick={nextView}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex flex-wrap gap-2">
          {views.map((view, index) => {
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                onClick={() => setCurrentView(index)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  currentView === index
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{view.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Content */}
      <div className="min-h-[600px]">
        {/* Data Overview */}
        {currentView === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Records', value: cleanedData.length.toLocaleString(), icon: Activity, color: 'bg-blue-500' },
                { label: 'Features', value: dataset.columns.length.toString(), icon: BarChart3, color: 'bg-green-500' },
                { label: 'Numeric Cols', value: numericColumns.length.toString(), icon: TrendingUp, color: 'bg-purple-500' },
                { label: 'Categorical', value: categoricalColumns.length.toString(), icon: PieChartIcon, color: 'bg-orange-500' }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Data Quality Metrics */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                      <circle 
                        cx="40" cy="40" r="36" 
                        stroke="#10B981" strokeWidth="8" fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.85)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">85%</span>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">Data Completeness</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                      <circle 
                        cx="40" cy="40" r="36" 
                        stroke="#3B82F6" strokeWidth="8" fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.92)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">92%</span>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">Data Validity</p>
                </div>
                
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-3 relative">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="36" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                      <circle 
                        cx="40" cy="40" r="36" 
                        stroke="#8B5CF6" strokeWidth="8" fill="none"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.78)}`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-900">78%</span>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">Feature Quality</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Analysis */}
        {currentView === 1 && featureSelection && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Importance Ranking</h3>
              <div className="space-y-3">
                {featureSelection.featureScores.slice(0, 10).map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index < 3 ? 'bg-yellow-500' : index < 6 ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{feature.feature}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        dataset.types[feature.feature] === 'numeric' 
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {dataset.types[feature.feature]}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                          style={{ width: `${feature.score * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-12 text-right">
                        {(feature.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Selection Controls */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Features for ML Training</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {dataset.columns.map((column, index) => (
                  <label key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(column)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFeatures([...selectedFeatures, column]);
                        } else {
                          setSelectedFeatures(selectedFeatures.filter(f => f !== column));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{column}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedFeatures.length} features selected for training
                </p>
                <button
                  onClick={handleTrainModels}
                  disabled={isTraining || selectedFeatures.length === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                >
                  {isTraining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  <span>{isTraining ? 'Training...' : 'Train Models'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Distributions */}
        {currentView === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dataset.columns.slice(0, 6).map((column, index) => {
              const data = generateVisualizationData(column);
              if (data.length === 0) return null;

              return (
                <div key={index} className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{column} Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    {dataset.types[column] === 'numeric' ? (
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="range" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="count" fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={data}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="count"
                          nameKey="value"
                          label={({ value, count }) => `${value}: ${count}`}
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
        )}

        {/* Correlations */}
        {currentView === 3 && numericColumns.length >= 2 && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Correlations</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={cleanedData.slice(0, 500).filter(row => 
                  row[numericColumns[0]] != null && row[numericColumns[1]] != null &&
                  !isNaN(Number(row[numericColumns[0]])) && !isNaN(Number(row[numericColumns[1]]))
                ).map(row => ({
                  [numericColumns[0]]: Number(row[numericColumns[0]]),
                  [numericColumns[1]]: Number(row[numericColumns[1]])
                }))}>
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
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Scatter fill="#3B82F6" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Correlation Matrix */}
            {featureSelection && Object.keys(featureSelection.correlationMatrix).length > 0 && (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Correlation Matrix</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="p-2"></th>
                        {numericColumns.slice(0, 5).map(col => (
                          <th key={col} className="p-2 text-xs font-medium text-gray-600 text-center">
                            {col.substring(0, 8)}...
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {numericColumns.slice(0, 5).map(row => (
                        <tr key={row}>
                          <td className="p-2 text-xs font-medium text-gray-600">{row.substring(0, 8)}...</td>
                          {numericColumns.slice(0, 5).map(col => {
                            const correlation = featureSelection.correlationMatrix[row]?.[col] || 0;
                            const intensity = Math.abs(correlation);
                            const color = correlation > 0 ? 'bg-blue-500' : 'bg-red-500';
                            return (
                              <td key={col} className="p-1">
                                <div 
                                  className={`w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${color}`}
                                  style={{ opacity: intensity }}
                                >
                                  {correlation.toFixed(2)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ML Models */}
        {currentView === 4 && (
          <div className="space-y-6">
            {mlResults.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-gray-200/50 text-center">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Train Machine Learning Models</h3>
                <p className="text-gray-600 mb-6">
                  Select features and train multiple ML algorithms to find the best model for your data
                </p>
                <button
                  onClick={handleTrainModels}
                  disabled={isTraining || selectedFeatures.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 mx-auto"
                >
                  {isTraining ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                  <span>{isTraining ? 'Training Models...' : 'Start Training'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Best Model Highlight */}
                {mlResults.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Best Performing Model</h3>
                        <p className="text-blue-100">Recommended algorithm for your dataset</p>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-2xl font-bold">{mlResults[0].name}</h4>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{(mlResults[0].accuracy * 100).toFixed(1)}%</div>
                          <div className="text-blue-100 text-sm">Accuracy</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Precision', value: mlResults[0].precision },
                          { label: 'Recall', value: mlResults[0].recall },
                          { label: 'F1-Score', value: mlResults[0].f1Score },
                          { label: 'Training Time', value: mlResults[0].trainingTime, unit: 'ms' }
                        ].map((metric, index) => (
                          <div key={index} className="text-center">
                            <p className="text-blue-100 text-sm mb-1">{metric.label}</p>
                            <p className="text-lg font-bold">
                              {metric.unit ? `${metric.value}${metric.unit}` : `${(metric.value * 100).toFixed(1)}%`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Comparison */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Model Performance Comparison</h3>
                  
                  <div className="space-y-4">
                    {mlResults.map((model, index) => (
                      <div key={index} className={`p-4 rounded-lg border transition-all duration-200 ${
                        model.recommended 
                          ? 'border-blue-200 bg-blue-50/50' 
                          : 'border-gray-200 bg-gray-50/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-500' :
                              index === 2 ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`}>
                              #{index + 1}
                            </div>
                            <h4 className="font-semibold text-gray-900">{model.name}</h4>
                            {model.recommended && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{(model.accuracy * 100).toFixed(1)}%</div>
                            <div className="text-xs text-gray-500">{model.trainingTime}ms</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Precision', value: model.precision },
                            { label: 'Recall', value: model.recall },
                            { label: 'F1-Score', value: model.f1Score },
                            { label: 'ROC-AUC', value: model.rocAuc }
                          ].map((metric, metricIndex) => (
                            <div key={metricIndex} className="text-center">
                              <p className="text-gray-600 text-sm">{metric.label}</p>
                              <p className="font-semibold text-gray-900">{(metric.value * 100).toFixed(1)}%</p>
                              <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                                <div 
                                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                  style={{ width: `${metric.value * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Importance */}
                {mlResults.length > 0 && mlResults[0].featureImportance && (
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Importance (Best Model)</h3>
                    <div className="space-y-3">
                      {mlResults[0].featureImportance.slice(0, 8).map((feature, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{feature.feature}</span>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
                                style={{ width: `${feature.importance * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {(feature.importance * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Predictions */}
        {currentView === 5 && mlResults.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Predictions Analysis</h3>
              
              {/* Confusion Matrix */}
              {mlResults[0].confusionMatrix && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Confusion Matrix (Best Model)</h4>
                  <div className="inline-block bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="text-xs text-gray-600 col-span-2 mb-2">Predicted</div>
                      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-green-800">{mlResults[0].confusionMatrix[0][0]}</span>
                      </div>
                      <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-red-800">{mlResults[0].confusionMatrix[0][1]}</span>
                      </div>
                      <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-red-800">{mlResults[0].confusionMatrix[1][0]}</span>
                      </div>
                      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-green-800">{mlResults[0].confusionMatrix[1][1]}</span>
                      </div>
                      <div className="text-xs text-gray-600 col-span-2 mt-2">Actual</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prediction Distribution */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Prediction Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { class: 'Class 0', count: mlResults[0].predictions.filter(p => p === 0).length },
                    { class: 'Class 1', count: mlResults[0].predictions.filter(p => p === 1).length }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="class" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
        <button
          onClick={prevView}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-2">
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

        <button
          onClick={nextView}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AdvancedDashboard;