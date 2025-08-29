export interface DataSet {
  data: any[];
  columns: string[];
  types: Record<string, 'numeric' | 'categorical' | 'datetime'>;
  summary: {
    totalRows: number;
    totalColumns: number;
    missingValues: number;
    duplicates: number;
    outliers: number;
  };
}

export interface StatisticalSummary {
  column: string;
  type: 'numeric' | 'categorical' | 'datetime';
  count: number;
  missing: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  uniqueValues?: number;
  topValue?: string;
  topValueCount?: number;
}

export interface EDAInsights {
  summary: StatisticalSummary[];
  correlations: { [key: string]: { [key: string]: number } };
  distributions: { [key: string]: { value: string | number; count: number }[] };
  outliers: { column: string; count: number; percentage: number }[];
  recommendations: string[];
}

export interface ModelResult {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  features: string[];
  recommended: boolean;
}

export interface MLModelResult {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  confusionMatrix: number[][];
  featureImportance: { feature: string; importance: number }[];
  predictions: number[];
  trainingTime: number;
  recommended: boolean;
}

export interface AnalysisResults {
  insights: EDAInsights;
  modelResults: ModelResult[];
  summary: {
    totalRows: number;
    totalColumns: number;
    missingValues: number;
    duplicates: number;
    outliers: number;
  };
}

export interface DataInsight {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}