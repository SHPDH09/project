import React from 'react';
import { Trophy, Target, TrendingUp, Zap, Star } from 'lucide-react';
import type { AnalysisResults } from '../types/data';

interface ModelAnalysisProps {
  results: AnalysisResults;
}

const ModelAnalysis: React.FC<ModelAnalysisProps> = ({ results }) => {
  const sortedModels = results.modelResults.sort((a, b) => b.accuracy - a.accuracy);
  const bestModel = sortedModels[0];

  const getPerformanceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-100';
    if (score >= 0.8) return 'text-blue-600 bg-blue-100';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.8) return 'Good';
    if (score >= 0.7) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Machine Learning Analysis</h2>
        <p className="text-gray-600">Automated model testing and performance comparison</p>
      </div>

      {/* Best Model Highlight */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Recommended Model</h3>
            <p className="text-blue-100">Best performing algorithm for your dataset</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-2xl font-bold">{bestModel.name}</h4>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-300 fill-current" />
              <span className="text-lg font-semibold">
                {(bestModel.accuracy * 100).toFixed(1)}% Accuracy
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Precision', value: bestModel.precision },
              { label: 'Recall', value: bestModel.recall },
              { label: 'F1-Score', value: bestModel.f1Score },
              { label: 'ROC-AUC', value: bestModel.rocAuc }
            ].map((metric, index) => (
              <div key={index} className="text-center">
                <p className="text-blue-100 text-sm mb-1">{metric.label}</p>
                <p className="text-xl font-bold">{(metric.value * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Comparison */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Model Performance Comparison</h3>
        
        <div className="space-y-4">
          {sortedModels.map((model, index) => (
            <div key={index} className={`p-4 rounded-lg border transition-all duration-200 ${
              model.recommended 
                ? 'border-blue-200 bg-blue-50/50' 
                : 'border-gray-200 bg-gray-50/50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    <span className="font-bold text-sm">#{index + 1}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900">{model.name}</h4>
                  {model.recommended && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(model.accuracy)}`}>
                  {getPerformanceLabel(model.accuracy)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                {[
                  { label: 'Accuracy', value: model.accuracy, icon: Target },
                  { label: 'Precision', value: model.precision, icon: TrendingUp },
                  { label: 'Recall', value: model.recall, icon: Zap },
                  { label: 'F1-Score', value: model.f1Score, icon: Star },
                  { label: 'ROC-AUC', value: model.rocAuc, icon: Trophy }
                ].map((metric, metricIndex) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metricIndex} className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-gray-600">{metric.label}</p>
                        <p className="font-semibold text-gray-900">{(metric.value * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Recommendations</h3>
          <div className="space-y-3">
            {results.insights.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Importance</h3>
          <div className="space-y-3">
            {bestModel.features.slice(0, 5).map((feature, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{feature}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${100 - index * 15}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {100 - index * 15}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelAnalysis;