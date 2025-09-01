import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Matrix } from 'ml-matrix';
import * as ss from 'simple-statistics';
import type { DataSet, StatisticalSummary, AdvancedEDAInsights, DatabaseConnection, RealTimeConfig } from '../types/data';

// Advanced CSV/Excel Processing
export const processFileData = async (file: File): Promise<DataSet> => {
  const startTime = Date.now();
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  let data: any[] = [];
  let columns: string[] = [];

  try {
    if (fileExtension === '.csv') {
      data = await processCSVFile(file);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      data = await processExcelFile(file);
    } else {
      throw new Error('Unsupported file format');
    }

    if (data.length === 0) {
      throw new Error('No data found in file');
    }

    columns = Object.keys(data[0] || {});
    
    // Advanced type detection
    const types = detectAdvancedDataTypes(data, columns);
    
    // Comprehensive data quality assessment
    const summary = calculateAdvancedSummary(data, columns, types);
    
    const processingTime = Date.now() - startTime;
    
    return {
      data,
      columns,
      types,
      summary: {
        ...summary,
        dataQualityScore: calculateDataQualityScore(summary, data.length, columns.length)
      },
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        uploadTime: new Date(),
        source: 'file',
        encoding: 'UTF-8'
      }
    };
  } catch (error) {
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const processCSVFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // We'll handle type conversion manually
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        resolve(results.data as any[]);
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
};

const processExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        }) as any[][];
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        
        // Convert to object format
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        const objectData = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        resolve(objectData);
      } catch (error) {
        reject(new Error(`Excel processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Advanced Data Type Detection
const detectAdvancedDataTypes = (data: any[], columns: string[]): Record<string, 'numeric' | 'categorical' | 'datetime' | 'boolean'> => {
  const types: Record<string, 'numeric' | 'categorical' | 'datetime' | 'boolean'> = {};
  
  columns.forEach(column => {
    const sampleSize = Math.min(1000, data.length);
    const sampleValues = data.slice(0, sampleSize)
      .map(row => row[column])
      .filter(v => v != null && v !== '' && v !== 'null' && v !== 'undefined');
    
    if (sampleValues.length === 0) {
      types[column] = 'categorical';
      return;
    }

    // Boolean detection
    const booleanValues = sampleValues.filter(v => 
      typeof v === 'boolean' || 
      (typeof v === 'string' && ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(v.toLowerCase()))
    );
    
    if (booleanValues.length / sampleValues.length > 0.8) {
      types[column] = 'boolean';
      return;
    }

    // Numeric detection with advanced patterns
    const numericValues = sampleValues.filter(v => {
      if (typeof v === 'number') return true;
      if (typeof v === 'string') {
        // Handle various numeric formats
        const cleaned = v.replace(/[,$%\s]/g, '');
        return !isNaN(Number(cleaned)) && cleaned !== '';
      }
      return false;
    });
    
    const numericRatio = numericValues.length / sampleValues.length;
    
    if (numericRatio > 0.8) {
      types[column] = 'numeric';
      return;
    }

    // DateTime detection with multiple formats
    const dateValues = sampleValues.filter(v => {
      if (v instanceof Date) return true;
      if (typeof v === 'string') {
        // Common date patterns
        const datePatterns = [
          /^\d{4}-\d{2}-\d{2}$/,
          /^\d{2}\/\d{2}\/\d{4}$/,
          /^\d{1,2}\/\d{1,2}\/\d{4}$/,
          /^\d{4}\/\d{2}\/\d{2}$/,
          /^\d{2}-\d{2}-\d{4}$/,
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
          /^\d{2}\/\d{2}\/\d{2}$/
        ];
        
        return datePatterns.some(pattern => pattern.test(v)) || 
               (!isNaN(Date.parse(v)) && Date.parse(v) > 0);
      }
      return false;
    });
    
    if (dateValues.length / sampleValues.length > 0.7) {
      types[column] = 'datetime';
      return;
    }

    // Default to categorical
    types[column] = 'categorical';
  });

  return types;
};

// Advanced Statistical Summary
const calculateAdvancedSummary = (data: any[], columns: string[], types: Record<string, string>) => {
  const totalCells = data.length * columns.length;
  let missingValues = 0;
  let duplicates = 0;
  let outliers = 0;

  // Count missing values
  data.forEach(row => {
    columns.forEach(col => {
      if (!row[col] || row[col] === '' || row[col] === null || row[col] === undefined) {
        missingValues++;
      }
    });
  });

  // Find duplicates using advanced hashing
  const seen = new Set();
  data.forEach(row => {
    const key = columns.map(col => String(row[col] || '')).join('|');
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  });

  // Advanced outlier detection
  columns.forEach(column => {
    if (types[column] === 'numeric') {
      const values = data.map(row => {
        const val = row[column];
        if (typeof val === 'string') {
          return Number(val.replace(/[,$%\s]/g, ''));
        }
        return Number(val);
      }).filter(v => !isNaN(v) && isFinite(v));
      
      if (values.length > 0) {
        // Multiple outlier detection methods
        const iqrOutliers = detectIQROutliers(values);
        const zScoreOutliers = detectZScoreOutliers(values);
        const modifiedZOutliers = detectModifiedZScoreOutliers(values);
        
        // Use the most conservative estimate
        outliers += Math.min(iqrOutliers, zScoreOutliers, modifiedZOutliers);
      }
    }
  });

  return {
    totalRows: data.length,
    totalColumns: columns.length,
    missingValues,
    duplicates,
    outliers,
    memoryUsage: estimateMemoryUsage(data)
  };
};

// Outlier Detection Methods
const detectIQROutliers = (values: number[]): number => {
  if (values.length < 4) return 0;
  
  const q1 = ss.quantile(values, 0.25);
  const q3 = ss.quantile(values, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(v => v < lowerBound || v > upperBound).length;
};

const detectZScoreOutliers = (values: number[], threshold = 3): number => {
  if (values.length < 3) return 0;
  
  const mean = ss.mean(values);
  const std = ss.standardDeviation(values);
  
  if (std === 0) return 0;
  
  return values.filter(v => Math.abs((v - mean) / std) > threshold).length;
};

const detectModifiedZScoreOutliers = (values: number[], threshold = 3.5): number => {
  if (values.length < 3) return 0;
  
  const median = ss.median(values);
  const mad = ss.median(values.map(v => Math.abs(v - median)));
  
  if (mad === 0) return 0;
  
  return values.filter(v => Math.abs(0.6745 * (v - median) / mad) > threshold).length;
};

// Data Quality Score Calculation
const calculateDataQualityScore = (summary: any, totalRows: number, totalColumns: number): number => {
  const completeness = 1 - (summary.missingValues / (totalRows * totalColumns));
  const uniqueness = 1 - (summary.duplicates / totalRows);
  const validity = 1 - (summary.outliers / totalRows);
  
  // Weighted average
  const score = (completeness * 0.4 + uniqueness * 0.3 + validity * 0.3) * 100;
  return Math.max(0, Math.min(100, score));
};

// Memory Usage Estimation
const estimateMemoryUsage = (data: any[]): number => {
  const sampleRow = data[0] || {};
  const avgRowSize = JSON.stringify(sampleRow).length;
  return (avgRowSize * data.length) / (1024 * 1024); // MB
};

// Advanced Data Cleaning
export const performAdvancedCleaning = (data: any[], columns: string[], types: Record<string, string>) => {
  let cleanedData = [...data];
  const transformations: { column: string; transformation: string; parameters: any }[] = [];

  // 1. Handle missing values with advanced imputation
  columns.forEach(column => {
    const missingIndices: number[] = [];
    cleanedData.forEach((row, index) => {
      if (!row[column] || row[column] === '' || row[column] === null) {
        missingIndices.push(index);
      }
    });

    if (missingIndices.length > 0) {
      if (types[column] === 'numeric') {
        // Use median imputation for numeric data
        const validValues = cleanedData
          .map(row => Number(row[column]))
          .filter(v => !isNaN(v) && isFinite(v));
        
        if (validValues.length > 0) {
          const median = ss.median(validValues);
          missingIndices.forEach(index => {
            cleanedData[index][column] = median;
          });
          transformations.push({
            column,
            transformation: 'median_imputation',
            parameters: { value: median, count: missingIndices.length }
          });
        }
      } else {
        // Use mode imputation for categorical data
        const validValues = cleanedData
          .map(row => row[column])
          .filter(v => v != null && v !== '');
        
        if (validValues.length > 0) {
          const mode = ss.mode(validValues);
          missingIndices.forEach(index => {
            cleanedData[index][column] = mode;
          });
          transformations.push({
            column,
            transformation: 'mode_imputation',
            parameters: { value: mode, count: missingIndices.length }
          });
        }
      }
    }
  });

  // 2. Remove duplicates
  const uniqueData: any[] = [];
  const seen = new Set();
  
  cleanedData.forEach(row => {
    const key = columns.map(col => String(row[col] || '')).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      uniqueData.push(row);
    }
  });
  
  if (uniqueData.length < cleanedData.length) {
    transformations.push({
      column: 'all',
      transformation: 'duplicate_removal',
      parameters: { removed: cleanedData.length - uniqueData.length }
    });
  }
  
  cleanedData = uniqueData;

  // 3. Handle outliers
  columns.forEach(column => {
    if (types[column] === 'numeric') {
      const values = cleanedData.map(row => {
        const val = row[column];
        return typeof val === 'string' ? Number(val.replace(/[,$%\s]/g, '')) : Number(val);
      }).filter(v => !isNaN(v) && isFinite(v));
      
      if (values.length > 10) {
        const q1 = ss.quantile(values, 0.25);
        const q3 = ss.quantile(values, 0.75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        let outliersHandled = 0;
        cleanedData.forEach(row => {
          const val = Number(row[column]);
          if (!isNaN(val) && (val < lowerBound || val > upperBound)) {
            // Cap outliers instead of removing them
            if (val < lowerBound) {
              row[column] = lowerBound;
            } else {
              row[column] = upperBound;
            }
            outliersHandled++;
          }
        });
        
        if (outliersHandled > 0) {
          transformations.push({
            column,
            transformation: 'outlier_capping',
            parameters: { 
              method: 'IQR',
              lowerBound,
              upperBound,
              count: outliersHandled
            }
          });
        }
      }
    }
  });

  // 4. Data type conversion and normalization
  columns.forEach(column => {
    if (types[column] === 'numeric') {
      cleanedData.forEach(row => {
        if (typeof row[column] === 'string') {
          const cleaned = row[column].replace(/[,$%\s]/g, '');
          row[column] = Number(cleaned);
        }
      });
    } else if (types[column] === 'boolean') {
      cleanedData.forEach(row => {
        const val = String(row[column]).toLowerCase();
        row[column] = ['true', 'yes', '1', 'y'].includes(val);
      });
    }
  });

  return {
    data: cleanedData,
    transformations,
    scalingMethod: 'standard',
    encodingMethod: 'one-hot'
  };
};

// Advanced Statistical Analysis
export const generateAdvancedEDAInsights = (data: any[], columns: string[], types: Record<string, string>): AdvancedEDAInsights => {
  const summary: StatisticalSummary[] = columns.map(column => {
    const allValues = data.map(row => row[column]);
    const validValues = allValues.filter(v => v != null && v !== '' && v !== 'null');
    const missingCount = data.length - validValues.length;
    const missingPercentage = (missingCount / data.length) * 100;

    if (types[column] === 'numeric') {
      const numValues = validValues.map(v => {
        if (typeof v === 'string') {
          return Number(v.replace(/[,$%\s]/g, ''));
        }
        return Number(v);
      }).filter(v => !isNaN(v) && isFinite(v));

      if (numValues.length === 0) {
        return {
          column,
          type: 'numeric' as const,
          count: 0,
          missing: missingCount,
          missingPercentage,
          mean: 0,
          median: 0,
          std: 0,
          min: 0,
          max: 0
        };
      }

      // Advanced statistical calculations
      const mean = ss.mean(numValues);
      const median = ss.median(numValues);
      const mode = ss.mode(numValues);
      const std = ss.standardDeviation(numValues);
      const variance = ss.variance(numValues);
      const skewness = calculateSkewness(numValues, mean, std);
      const kurtosis = calculateKurtosis(numValues, mean, std);
      const q1 = ss.quantile(numValues, 0.25);
      const q3 = ss.quantile(numValues, 0.75);
      const iqr = q3 - q1;
      
      // Outlier detection
      const outlierCount = detectIQROutliers(numValues);
      const outlierPercentage = (outlierCount / numValues.length) * 100;

      return {
        column,
        type: 'numeric' as const,
        count: validValues.length,
        missing: missingCount,
        missingPercentage,
        mean,
        median,
        mode: typeof mode === 'number' ? mode : undefined,
        std,
        variance,
        skewness,
        kurtosis,
        min: Math.min(...numValues),
        max: Math.max(...numValues),
        q1,
        q3,
        iqr,
        outlierCount,
        outlierPercentage
      };
    } else {
      const uniqueValues = [...new Set(validValues)];
      const valueCounts = validValues.reduce((acc: Record<string, number>, val) => {
        const key = String(val);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      const topEntry = Object.entries(valueCounts).sort(([,a], [,b]) => b - a)[0];
      const entropy = calculateEntropy(Object.values(valueCounts));

      return {
        column,
        type: types[column] as any,
        count: validValues.length,
        missing: missingCount,
        missingPercentage,
        uniqueValues: uniqueValues.length,
        topValue: topEntry?.[0],
        topValueCount: topEntry?.[1],
        entropy
      };
    }
  });

  // Advanced correlation analysis
  const numericColumns = columns.filter(col => types[col] === 'numeric');
  const correlations = calculateCorrelationMatrix(data, numericColumns);
  const partialCorrelations = calculatePartialCorrelations(data, numericColumns);

  // Distribution analysis
  const distributions: { [key: string]: { value: string | number; count: number; probability: number }[] } = {};
  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(v => v != null && v !== '');
    const counts: Record<string, number> = {};
    
    values.forEach(value => {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    });
    
    const total = values.length;
    distributions[column] = Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([value, count]) => ({
        value: types[column] === 'numeric' ? Number(value) : value,
        count,
        probability: count / total
      }));
  });

  // Advanced outlier analysis
  const outlierAnalysis = columns
    .filter(col => types[col] === 'numeric')
    .map(column => {
      const values = data.map(row => Number(row[column])).filter(v => !isNaN(v));
      const outlierCount = detectIQROutliers(values);
      return {
        column,
        count: outlierCount,
        percentage: (outlierCount / values.length) * 100,
        method: 'IQR'
      };
    })
    .filter(result => result.count > 0);

  // Anomaly detection
  const anomalies = detectAnomalies(data, numericColumns);

  // Data quality assessment
  const dataQuality = {
    completeness: ((data.length * columns.length - summary.reduce((acc, s) => acc + s.missing, 0)) / (data.length * columns.length)) * 100,
    consistency: calculateConsistency(data, columns, types),
    validity: calculateValidity(data, columns, types),
    accuracy: calculateAccuracy(data, columns, types),
    overall: 0
  };
  dataQuality.overall = (dataQuality.completeness + dataQuality.consistency + dataQuality.validity + dataQuality.accuracy) / 4;

  // Feature engineering suggestions
  const featureEngineering = {
    suggestedTransformations: generateTransformationSuggestions(summary, types),
    polynomialFeatures: numericColumns.slice(0, 3), // Suggest polynomial features for top numeric columns
    interactionFeatures: generateInteractionSuggestions(correlations, numericColumns)
  };

  // Enhanced recommendations
  const recommendations = generateAdvancedRecommendations(summary, dataQuality, correlations, outlierAnalysis);

  return {
    summary,
    correlations,
    partialCorrelations,
    distributions,
    outliers: outlierAnalysis,
    anomalies,
    recommendations,
    dataQuality,
    featureEngineering
  };
};

// Helper Functions
const calculateSkewness = (values: number[], mean: number, std: number): number => {
  if (std === 0 || values.length < 3) return 0;
  const n = values.length;
  const skew = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0);
  return (n / ((n - 1) * (n - 2))) * skew;
};

const calculateKurtosis = (values: number[], mean: number, std: number): number => {
  if (std === 0 || values.length < 4) return 0;
  const n = values.length;
  const kurt = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0);
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurt - (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3));
};

const calculateEntropy = (counts: number[]): number => {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  
  return -counts.reduce((entropy, count) => {
    if (count === 0) return entropy;
    const probability = count / total;
    return entropy + probability * Math.log2(probability);
  }, 0);
};

const calculateCorrelationMatrix = (data: any[], columns: string[]): { [key: string]: { [key: string]: number } } => {
  const matrix: { [key: string]: { [key: string]: number } } = {};
  
  columns.forEach(col1 => {
    matrix[col1] = {};
    columns.forEach(col2 => {
      const values1 = data.map(row => Number(row[col1])).filter(v => !isNaN(v));
      const values2 = data.map(row => Number(row[col2])).filter(v => !isNaN(v));
      
      if (values1.length > 1 && values2.length > 1) {
        matrix[col1][col2] = ss.sampleCorrelation(values1, values2);
      } else {
        matrix[col1][col2] = col1 === col2 ? 1 : 0;
      }
    });
  });
  
  return matrix;
};

const calculatePartialCorrelations = (data: any[], columns: string[]): { [key: string]: { [key: string]: number } } => {
  // Simplified partial correlation calculation
  const correlations = calculateCorrelationMatrix(data, columns);
  const partialCorr: { [key: string]: { [key: string]: number } } = {};
  
  columns.forEach(col1 => {
    partialCorr[col1] = {};
    columns.forEach(col2 => {
      if (col1 === col2) {
        partialCorr[col1][col2] = 1;
      } else {
        // Simplified: use regular correlation as approximation
        partialCorr[col1][col2] = correlations[col1][col2] || 0;
      }
    });
  });
  
  return partialCorr;
};

const detectAnomalies = (data: any[], numericColumns: string[]): { index: number; score: number; features: string[] }[] => {
  if (numericColumns.length < 2) return [];
  
  const anomalies: { index: number; score: number; features: string[] }[] = [];
  
  // Simple isolation forest approximation
  data.forEach((row, index) => {
    let anomalyScore = 0;
    const involvedFeatures: string[] = [];
    
    numericColumns.forEach(column => {
      const value = Number(row[column]);
      if (!isNaN(value)) {
        const allValues = data.map(r => Number(r[column])).filter(v => !isNaN(v));
        const mean = ss.mean(allValues);
        const std = ss.standardDeviation(allValues);
        
        if (std > 0) {
          const zScore = Math.abs((value - mean) / std);
          if (zScore > 2) {
            anomalyScore += zScore;
            involvedFeatures.push(column);
          }
        }
      }
    });
    
    if (anomalyScore > 3) {
      anomalies.push({
        index,
        score: anomalyScore,
        features: involvedFeatures
      });
    }
  });
  
  return anomalies.sort((a, b) => b.score - a.score).slice(0, 10);
};

const calculateConsistency = (data: any[], columns: string[], types: Record<string, string>): number => {
  let consistencyScore = 100;
  
  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(v => v != null && v !== '');
    
    if (types[column] === 'numeric') {
      const numericValues = values.filter(v => !isNaN(Number(v)));
      const consistency = numericValues.length / values.length;
      consistencyScore *= consistency;
    }
  });
  
  return Math.max(0, consistencyScore);
};

const calculateValidity = (data: any[], columns: string[], types: Record<string, string>): number => {
  let validityScore = 100;
  
  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(v => v != null && v !== '');
    
    if (types[column] === 'datetime') {
      const validDates = values.filter(v => !isNaN(Date.parse(String(v))));
      const validity = validDates.length / values.length;
      validityScore *= validity;
    }
  });
  
  return Math.max(0, validityScore);
};

const calculateAccuracy = (data: any[], columns: string[], types: Record<string, string>): number => {
  // Simplified accuracy based on data completeness and type consistency
  const totalCells = data.length * columns.length;
  const validCells = data.reduce((count, row) => {
    return count + columns.filter(col => {
      const value = row[col];
      if (value == null || value === '') return false;
      
      if (types[col] === 'numeric') {
        return !isNaN(Number(value));
      }
      return true;
    }).length;
  }, 0);
  
  return (validCells / totalCells) * 100;
};

const generateTransformationSuggestions = (summary: StatisticalSummary[], types: Record<string, string>) => {
  const suggestions: { column: string; transformation: string; reason: string }[] = [];
  
  summary.forEach(stat => {
    if (stat.type === 'numeric') {
      if (stat.skewness && Math.abs(stat.skewness) > 1) {
        suggestions.push({
          column: stat.column,
          transformation: stat.skewness > 0 ? 'log_transform' : 'square_root_transform',
          reason: `High skewness detected (${stat.skewness.toFixed(2)})`
        });
      }
      
      if (stat.std && stat.mean && stat.std / stat.mean > 1) {
        suggestions.push({
          column: stat.column,
          transformation: 'standardization',
          reason: 'High coefficient of variation detected'
        });
      }
    }
    
    if (stat.missingPercentage > 20) {
      suggestions.push({
        column: stat.column,
        transformation: 'advanced_imputation',
        reason: `High missing value rate (${stat.missingPercentage.toFixed(1)}%)`
      });
    }
  });
  
  return suggestions;
};

const generateInteractionSuggestions = (correlations: { [key: string]: { [key: string]: number } }, columns: string[]) => {
  const interactions: { feature1: string; feature2: string; correlation: number }[] = [];
  
  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const col1 = columns[i];
      const col2 = columns[j];
      const correlation = Math.abs(correlations[col1]?.[col2] || 0);
      
      if (correlation > 0.3 && correlation < 0.9) {
        interactions.push({
          feature1: col1,
          feature2: col2,
          correlation
        });
      }
    }
  }
  
  return interactions.sort((a, b) => b.correlation - a.correlation).slice(0, 5);
};

const generateAdvancedRecommendations = (
  summary: StatisticalSummary[],
  dataQuality: any,
  correlations: any,
  outliers: any[]
): string[] => {
  const recommendations: string[] = [];
  
  // Data quality recommendations
  if (dataQuality.overall > 90) {
    recommendations.push('🎉 Excellent data quality! Your dataset is ready for advanced machine learning.');
  } else if (dataQuality.overall > 80) {
    recommendations.push('✅ Good data quality with minor issues that have been automatically addressed.');
  } else {
    recommendations.push('⚠️ Data quality needs improvement. Consider additional preprocessing steps.');
  }
  
  // Missing value recommendations
  const highMissingColumns = summary.filter(s => s.missingPercentage > 30);
  if (highMissingColumns.length > 0) {
    recommendations.push(`🔍 ${highMissingColumns.length} columns have >30% missing values. Consider advanced imputation or removal.`);
  }
  
  // Correlation insights
  const numericSummary = summary.filter(s => s.type === 'numeric');
  if (numericSummary.length > 1) {
    recommendations.push(`📊 ${numericSummary.length} numerical features available for correlation analysis and feature engineering.`);
  }
  
  // Outlier recommendations
  if (outliers.length > 0) {
    recommendations.push(`🎯 Outliers detected in ${outliers.length} features. Advanced outlier handling has been applied.`);
  }
  
  // Feature engineering suggestions
  const categoricalCount = summary.filter(s => s.type === 'categorical').length;
  if (categoricalCount > 0) {
    recommendations.push(`🔧 ${categoricalCount} categorical features available for encoding and feature engineering.`);
  }
  
  // Model recommendations
  if (summary.length > 10) {
    recommendations.push('🤖 Large feature set detected. Consider feature selection and dimensionality reduction techniques.');
  }
  
  if (summary.some(s => s.type === 'datetime')) {
    recommendations.push('📅 Time-series features detected. Consider temporal analysis and time-based feature engineering.');
  }
  
  recommendations.push('🚀 Dataset preprocessing completed using advanced statistical methods and machine learning techniques.');
  recommendations.push('📈 Ready for comprehensive exploratory data analysis and automated machine learning pipeline.');
  
  return recommendations;
};

// Database Connection Functions
export const connectToDatabase = async (connection: DatabaseConnection, config: RealTimeConfig): Promise<DataSet> => {
  // Simulate database connection and data fetching
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock data for demonstration
  const mockData = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    value: Math.random() * 100,
    category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
    status: Math.random() > 0.5,
    score: Math.random() * 10
  }));
  
  const columns = Object.keys(mockData[0]);
  const types = detectAdvancedDataTypes(mockData, columns);
  const summary = calculateAdvancedSummary(mockData, columns, types);
  
  return {
    data: mockData,
    columns,
    types,
    summary: {
      ...summary,
      dataQualityScore: calculateDataQualityScore(summary, mockData.length, columns.length)
    },
    metadata: {
      fileName: `${connection.database}_data`,
      fileSize: 0,
      uploadTime: new Date(),
      source: 'database'
    }
  };
};

export const setupRealTimeUpdates = (connection: DatabaseConnection, config: RealTimeConfig, onUpdate: (data: DataSet) => void) => {
  if (!config.enabled) return null;
  
  const interval = setInterval(async () => {
    try {
      const updatedData = await connectToDatabase(connection, config);
      onUpdate(updatedData);
    } catch (error) {
      console.error('Real-time update failed:', error);
    }
  }, config.refreshInterval * 1000);
  
  return interval;
};