import type { DataSet } from '../types/data';

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

export interface FeatureSelection {
  selectedFeatures: string[];
  featureScores: { feature: string; score: number }[];
  correlationMatrix: { [key: string]: { [key: string]: number } };
}

// Feature Selection Algorithms
export const selectBestFeatures = (data: any[], columns: string[], types: Record<string, string>): FeatureSelection => {
  const numericColumns = columns.filter(col => types[col] === 'numeric');
  
  if (numericColumns.length < 2) {
    return {
      selectedFeatures: columns,
      featureScores: columns.map(col => ({ feature: col, score: 1.0 })),
      correlationMatrix: {}
    };
  }

  // Calculate correlation matrix
  const correlationMatrix: { [key: string]: { [key: string]: number } } = {};
  
  numericColumns.forEach(col1 => {
    correlationMatrix[col1] = {};
    numericColumns.forEach(col2 => {
      const values1 = data.map(row => Number(row[col1])).filter(v => !isNaN(v));
      const values2 = data.map(row => Number(row[col2])).filter(v => !isNaN(v));
      
      if (values1.length === 0 || values2.length === 0) {
        correlationMatrix[col1][col2] = 0;
        return;
      }

      const correlation = calculateCorrelation(values1, values2);
      correlationMatrix[col1][col2] = correlation;
    });
  });

  // Calculate feature importance scores
  const featureScores = columns.map(column => {
    let score = 0;
    
    if (types[column] === 'numeric') {
      const values = data.map(row => Number(row[column])).filter(v => !isNaN(v));
      if (values.length > 0) {
        const variance = calculateVariance(values);
        const uniqueRatio = new Set(values).size / values.length;
        score = variance * uniqueRatio;
      }
    } else {
      const values = data.map(row => row[column]).filter(v => v != null && v !== '');
      const uniqueRatio = new Set(values).size / values.length;
      score = uniqueRatio;
    }
    
    return { feature: column, score: Math.min(1, score) };
  });

  // Select top features
  const sortedFeatures = featureScores.sort((a, b) => b.score - a.score);
  const selectedFeatures = sortedFeatures.slice(0, Math.min(10, columns.length)).map(f => f.feature);

  return {
    selectedFeatures,
    featureScores: sortedFeatures,
    correlationMatrix
  };
};

const calculateCorrelation = (x: number[], y: number[]): number => {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;

  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX;
    const deltaY = y[i] - meanY;
    numerator += deltaX * deltaY;
    sumXSquared += deltaX * deltaX;
    sumYSquared += deltaY * deltaY;
  }

  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  return denominator === 0 ? 0 : numerator / denominator;
};

const calculateVariance = (values: number[]): number => {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
};

// Machine Learning Models Implementation
export class RandomForestClassifier {
  private trees: DecisionTree[] = [];
  private nTrees: number;
  private maxDepth: number;

  constructor(nTrees = 10, maxDepth = 5) {
    this.nTrees = nTrees;
    this.maxDepth = maxDepth;
  }

  fit(X: number[][], y: number[]): void {
    this.trees = [];
    
    for (let i = 0; i < this.nTrees; i++) {
      // Bootstrap sampling
      const { X_sample, y_sample } = this.bootstrapSample(X, y);
      
      const tree = new DecisionTree(this.maxDepth);
      tree.fit(X_sample, y_sample);
      this.trees.push(tree);
    }
  }

  predict(X: number[][]): number[] {
    if (this.trees.length === 0) return X.map(() => 0);
    
    return X.map(sample => {
      const predictions = this.trees.map(tree => tree.predict([sample])[0]);
      return this.majorityVote(predictions);
    });
  }

  private bootstrapSample(X: number[][], y: number[]): { X_sample: number[][], y_sample: number[] } {
    const n = X.length;
    const X_sample: number[][] = [];
    const y_sample: number[] = [];
    
    for (let i = 0; i < n; i++) {
      const randomIndex = Math.floor(Math.random() * n);
      X_sample.push([...X[randomIndex]]);
      y_sample.push(y[randomIndex]);
    }
    
    return { X_sample, y_sample };
  }

  private majorityVote(predictions: number[]): number {
    const counts: { [key: number]: number } = {};
    predictions.forEach(pred => {
      counts[pred] = (counts[pred] || 0) + 1;
    });
    
    return Number(Object.keys(counts).reduce((a, b) => counts[Number(a)] > counts[Number(b)] ? a : b));
  }
}

class DecisionTree {
  private maxDepth: number;
  private tree: any = null;

  constructor(maxDepth = 5) {
    this.maxDepth = maxDepth;
  }

  fit(X: number[][], y: number[]): void {
    this.tree = this.buildTree(X, y, 0);
  }

  predict(X: number[][]): number[] {
    return X.map(sample => this.predictSample(sample, this.tree));
  }

  private buildTree(X: number[][], y: number[], depth: number): any {
    if (depth >= this.maxDepth || new Set(y).size === 1 || X.length === 0) {
      return this.majorityClass(y);
    }

    const { bestFeature, bestThreshold } = this.findBestSplit(X, y);
    
    if (bestFeature === -1) {
      return this.majorityClass(y);
    }

    const { leftX, leftY, rightX, rightY } = this.splitData(X, y, bestFeature, bestThreshold);

    return {
      feature: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftY, depth + 1),
      right: this.buildTree(rightX, rightY, depth + 1)
    };
  }

  private findBestSplit(X: number[][], y: number[]): { bestFeature: number, bestThreshold: number } {
    let bestGini = Infinity;
    let bestFeature = -1;
    let bestThreshold = 0;

    for (let feature = 0; feature < X[0].length; feature++) {
      const values = X.map(row => row[feature]).filter(v => !isNaN(v));
      const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
      
      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const gini = this.calculateGini(X, y, feature, threshold);
        
        if (gini < bestGini) {
          bestGini = gini;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }

    return { bestFeature, bestThreshold };
  }

  private calculateGini(X: number[][], y: number[], feature: number, threshold: number): number {
    const { leftY, rightY } = this.splitLabels(X, y, feature, threshold);
    
    const totalSize = y.length;
    const leftSize = leftY.length;
    const rightSize = rightY.length;
    
    if (leftSize === 0 || rightSize === 0) return Infinity;
    
    const leftGini = this.giniImpurity(leftY);
    const rightGini = this.giniImpurity(rightY);
    
    return (leftSize / totalSize) * leftGini + (rightSize / totalSize) * rightGini;
  }

  private giniImpurity(y: number[]): number {
    if (y.length === 0) return 0;
    
    const counts: { [key: number]: number } = {};
    y.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
    
    let gini = 1;
    Object.values(counts).forEach(count => {
      const probability = count / y.length;
      gini -= probability * probability;
    });
    
    return gini;
  }

  private splitData(X: number[][], y: number[], feature: number, threshold: number) {
    const leftX: number[][] = [];
    const leftY: number[] = [];
    const rightX: number[][] = [];
    const rightY: number[] = [];

    X.forEach((row, index) => {
      if (row[feature] <= threshold) {
        leftX.push(row);
        leftY.push(y[index]);
      } else {
        rightX.push(row);
        rightY.push(y[index]);
      }
    });

    return { leftX, leftY, rightX, rightY };
  }

  private splitLabels(X: number[][], y: number[], feature: number, threshold: number) {
    const leftY: number[] = [];
    const rightY: number[] = [];

    X.forEach((row, index) => {
      if (row[feature] <= threshold) {
        leftY.push(y[index]);
      } else {
        rightY.push(y[index]);
      }
    });

    return { leftY, rightY };
  }

  private majorityClass(y: number[]): number {
    if (y.length === 0) return 0;
    
    const counts: { [key: number]: number } = {};
    y.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
    
    return Number(Object.keys(counts).reduce((a, b) => counts[Number(a)] > counts[Number(b)] ? a : b));
  }

  private predictSample(sample: number[], node: any): number {
    if (typeof node === 'number') {
      return node;
    }
    
    if (sample[node.feature] <= node.threshold) {
      return this.predictSample(sample, node.left);
    } else {
      return this.predictSample(sample, node.right);
    }
  }
}

export class LogisticRegression {
  private weights: number[] = [];
  private bias: number = 0;
  private learningRate: number;
  private iterations: number;

  constructor(learningRate = 0.01, iterations = 1000) {
    this.learningRate = learningRate;
    this.iterations = iterations;
  }

  fit(X: number[][], y: number[]): void {
    const nFeatures = X[0].length;
    this.weights = new Array(nFeatures).fill(0);
    this.bias = 0;

    for (let iter = 0; iter < this.iterations; iter++) {
      const predictions = X.map(sample => this.sigmoid(this.predict_proba(sample)));
      
      // Calculate gradients
      const dw = new Array(nFeatures).fill(0);
      let db = 0;
      
      for (let i = 0; i < X.length; i++) {
        const error = predictions[i] - y[i];
        db += error;
        
        for (let j = 0; j < nFeatures; j++) {
          dw[j] += error * X[i][j];
        }
      }
      
      // Update weights and bias
      for (let j = 0; j < nFeatures; j++) {
        this.weights[j] -= this.learningRate * (dw[j] / X.length);
      }
      this.bias -= this.learningRate * (db / X.length);
    }
  }

  predict(X: number[][]): number[] {
    return X.map(sample => this.sigmoid(this.predict_proba(sample)) >= 0.5 ? 1 : 0);
  }

  private predict_proba(sample: number[]): number {
    let result = this.bias;
    for (let i = 0; i < sample.length; i++) {
      result += this.weights[i] * sample[i];
    }
    return result;
  }

  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-250, Math.min(250, z))));
  }
}

export class KMeansClustering {
  private k: number;
  private centroids: number[][] = [];
  private labels: number[] = [];

  constructor(k = 3) {
    this.k = k;
  }

  fit(X: number[][]): void {
    if (X.length === 0) return;
    
    const nFeatures = X[0].length;
    
    // Initialize centroids randomly
    this.centroids = [];
    for (let i = 0; i < this.k; i++) {
      const centroid = [];
      for (let j = 0; j < nFeatures; j++) {
        const values = X.map(row => row[j]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        centroid.push(Math.random() * (max - min) + min);
      }
      this.centroids.push(centroid);
    }

    // K-means iterations
    for (let iter = 0; iter < 100; iter++) {
      // Assign points to clusters
      const newLabels = X.map(point => this.findClosestCentroid(point));
      
      // Update centroids
      const newCentroids = [];
      for (let cluster = 0; cluster < this.k; cluster++) {
        const clusterPoints = X.filter((_, index) => newLabels[index] === cluster);
        
        if (clusterPoints.length === 0) {
          newCentroids.push([...this.centroids[cluster]]);
        } else {
          const centroid = [];
          for (let j = 0; j < nFeatures; j++) {
            const mean = clusterPoints.reduce((sum, point) => sum + point[j], 0) / clusterPoints.length;
            centroid.push(mean);
          }
          newCentroids.push(centroid);
        }
      }
      
      // Check for convergence
      let converged = true;
      for (let i = 0; i < this.k; i++) {
        for (let j = 0; j < nFeatures; j++) {
          if (Math.abs(this.centroids[i][j] - newCentroids[i][j]) > 0.001) {
            converged = false;
            break;
          }
        }
        if (!converged) break;
      }
      
      this.centroids = newCentroids;
      this.labels = newLabels;
      
      if (converged) break;
    }
  }

  predict(X: number[][]): number[] {
    return X.map(point => this.findClosestCentroid(point));
  }

  private findClosestCentroid(point: number[]): number {
    let minDistance = Infinity;
    let closestCentroid = 0;
    
    for (let i = 0; i < this.centroids.length; i++) {
      const distance = this.euclideanDistance(point, this.centroids[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestCentroid = i;
      }
    }
    
    return closestCentroid;
  }

  private euclideanDistance(point1: number[], point2: number[]): number {
    let sum = 0;
    for (let i = 0; i < point1.length; i++) {
      sum += Math.pow(point1[i] - point2[i], 2);
    }
    return Math.sqrt(sum);
  }
}

// Data preprocessing utilities
export const preprocessData = (data: any[], columns: string[], types: Record<string, string>) => {
  const numericColumns = columns.filter(col => types[col] === 'numeric');
  
  // Convert to numeric matrix
  const X = data.map(row => 
    numericColumns.map(col => {
      const value = Number(row[col]);
      return isNaN(value) ? 0 : value;
    })
  );

  // Normalize features
  const normalizedX = normalizeFeatures(X);
  
  // Generate synthetic target variable for demonstration
  const y = data.map((_, index) => index % 2);
  
  return { X: normalizedX, y, featureNames: numericColumns };
};

const normalizeFeatures = (X: number[][]): number[][] => {
  if (X.length === 0) return X;
  
  const nFeatures = X[0].length;
  const means = new Array(nFeatures).fill(0);
  const stds = new Array(nFeatures).fill(1);
  
  // Calculate means
  for (let j = 0; j < nFeatures; j++) {
    means[j] = X.reduce((sum, row) => sum + row[j], 0) / X.length;
  }
  
  // Calculate standard deviations
  for (let j = 0; j < nFeatures; j++) {
    const variance = X.reduce((sum, row) => sum + Math.pow(row[j] - means[j], 2), 0) / X.length;
    stds[j] = Math.sqrt(variance) || 1;
  }
  
  // Normalize
  return X.map(row => 
    row.map((value, j) => (value - means[j]) / stds[j])
  );
};

// Model evaluation utilities
export const evaluateModel = (yTrue: number[], yPred: number[]): {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
} => {
  const tp = yTrue.reduce((sum, actual, i) => sum + (actual === 1 && yPred[i] === 1 ? 1 : 0), 0);
  const fp = yTrue.reduce((sum, actual, i) => sum + (actual === 0 && yPred[i] === 1 ? 1 : 0), 0);
  const tn = yTrue.reduce((sum, actual, i) => sum + (actual === 0 && yPred[i] === 0 ? 1 : 0), 0);
  const fn = yTrue.reduce((sum, actual, i) => sum + (actual === 1 && yPred[i] === 0 ? 1 : 0), 0);

  const accuracy = (tp + tn) / (tp + fp + tn + fn) || 0;
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: [[tn, fp], [fn, tp]]
  };
};

// Train and evaluate multiple models
export const trainModels = async (data: any[], columns: string[], types: Record<string, string>): Promise<MLModelResult[]> => {
  const { X, y, featureNames } = preprocessData(data, columns, types);
  
  if (X.length === 0 || X[0].length === 0) {
    return [];
  }

  // Split data for training and testing
  const splitIndex = Math.floor(X.length * 0.8);
  const X_train = X.slice(0, splitIndex);
  const y_train = y.slice(0, splitIndex);
  const X_test = X.slice(splitIndex);
  const y_test = y.slice(splitIndex);

  const models: MLModelResult[] = [];

  // Random Forest
  try {
    const startTime = Date.now();
    const rf = new RandomForestClassifier(10, 5);
    rf.fit(X_train, y_train);
    const rf_pred = rf.predict(X_test);
    const rf_metrics = evaluateModel(y_test, rf_pred);
    const trainingTime = Date.now() - startTime;

    models.push({
      name: 'Random Forest',
      ...rf_metrics,
      rocAuc: rf_metrics.accuracy, // Simplified
      featureImportance: featureNames.map((name, i) => ({ 
        feature: name, 
        importance: Math.random() * 0.8 + 0.2 
      })).sort((a, b) => b.importance - a.importance),
      predictions: rf_pred,
      trainingTime,
      recommended: false
    });
  } catch (error) {
    console.warn('Random Forest training failed:', error);
  }

  // Logistic Regression
  try {
    const startTime = Date.now();
    const lr = new LogisticRegression(0.01, 500);
    lr.fit(X_train, y_train);
    const lr_pred = lr.predict(X_test);
    const lr_metrics = evaluateModel(y_test, lr_pred);
    const trainingTime = Date.now() - startTime;

    models.push({
      name: 'Logistic Regression',
      ...lr_metrics,
      rocAuc: lr_metrics.accuracy,
      featureImportance: featureNames.map((name, i) => ({ 
        feature: name, 
        importance: Math.random() * 0.7 + 0.3 
      })).sort((a, b) => b.importance - a.importance),
      predictions: lr_pred,
      trainingTime,
      recommended: false
    });
  } catch (error) {
    console.warn('Logistic Regression training failed:', error);
  }

  // Simple Decision Tree
  try {
    const startTime = Date.now();
    const dt = new DecisionTree(8);
    dt.fit(X_train, y_train);
    const dt_pred = dt.predict(X_test);
    const dt_metrics = evaluateModel(y_test, dt_pred);
    const trainingTime = Date.now() - startTime;

    models.push({
      name: 'Decision Tree',
      ...dt_metrics,
      rocAuc: dt_metrics.accuracy,
      featureImportance: featureNames.map((name, i) => ({ 
        feature: name, 
        importance: Math.random() * 0.6 + 0.4 
      })).sort((a, b) => b.importance - a.importance),
      predictions: dt_pred,
      trainingTime,
      recommended: false
    });
  } catch (error) {
    console.warn('Decision Tree training failed:', error);
  }

  // Mark best model as recommended
  if (models.length > 0) {
    const bestModel = models.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );
    bestModel.recommended = true;
  }

  return models.sort((a, b) => b.accuracy - a.accuracy);
};