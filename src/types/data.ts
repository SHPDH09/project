export interface DataSet {
  data: any[];
  columns: string[];
  types: Record<string, 'numeric' | 'categorical' | 'datetime' | 'boolean'>;
  summary: {
    totalRows: number;
    totalColumns: number;
    missingValues: number;
    duplicates: number;
    outliers: number;
    dataQualityScore: number;
    memoryUsage: number;
  };
  metadata: {
    fileName: string;
    fileSize: number;
    uploadTime: Date;
    source: 'file' | 'database';
    encoding?: string;
  };
}

export interface StatisticalSummary {
  column: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'boolean';
  count: number;
  missing: number;
  missingPercentage: number;
  mean?: number;
  median?: number;
  mode?: string | number;
  std?: number;
  variance?: number;
  skewness?: number;
  kurtosis?: number;
  min?: number;
  max?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  uniqueValues?: number;
  topValue?: string;
  topValueCount?: number;
  entropy?: number;
  outlierCount?: number;
  outlierPercentage?: number;
}

export interface AdvancedEDAInsights {
  summary: StatisticalSummary[];
  correlations: { [key: string]: { [key: string]: number } };
  partialCorrelations: { [key: string]: { [key: string]: number } };
  distributions: { [key: string]: { value: string | number; count: number; probability: number }[] };
  outliers: { column: string; count: number; percentage: number; method: string }[];
  anomalies: { index: number; score: number; features: string[] }[];
  recommendations: string[];
  dataQuality: {
    completeness: number;
    consistency: number;
    validity: number;
    accuracy: number;
    overall: number;
  };
  featureEngineering: {
    suggestedTransformations: { column: string; transformation: string; reason: string }[];
    polynomialFeatures: string[];
    interactionFeatures: { feature1: string; feature2: string; correlation: number }[];
  };
}

export interface MLModelResult {
  name: string;
  algorithm: string;
  hyperparameters: Record<string, any>;
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
    mcc: number; // Matthews Correlation Coefficient
    logLoss?: number;
    meanSquaredError?: number;
    meanAbsoluteError?: number;
    r2Score?: number;
  };
  crossValidation: {
    cvScores: number[];
    meanScore: number;
    stdScore: number;
    confidence: number;
  };
  confusionMatrix: number[][];
  featureImportance: { feature: string; importance: number; rank: number }[];
  predictions: number[];
  probabilities?: number[][];
  trainingTime: number;
  memoryUsage: number;
  recommended: boolean;
  modelComplexity: 'low' | 'medium' | 'high';
  interpretability: 'high' | 'medium' | 'low';
}

export interface DatabaseConnection {
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionString?: string;
}

export interface RealTimeConfig {
  enabled: boolean;
  refreshInterval: number; // in seconds
  autoUpdate: boolean;
  query: string;
  lastUpdate?: Date;
}

export interface AnalysisResults {
  insights: AdvancedEDAInsights;
  modelResults: MLModelResult[];
  summary: {
    totalRows: number;
    totalColumns: number;
    missingValues: number;
    duplicates: number;
    outliers: number;
    dataQualityScore: number;
  };
  preprocessing: {
    steps: string[];
    transformations: { column: string; transformation: string; parameters: any }[];
    scalingMethod: string;
    encodingMethod: string;
  };
}

export interface DataInsight {
  type: 'warning' | 'info' | 'success' | 'error';
  category: 'data_quality' | 'statistical' | 'ml_performance' | 'recommendation';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  suggestion?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeVisualizations: boolean;
  includeRawData: boolean;
  includeModelDetails: boolean;
  customSections: string[];
}