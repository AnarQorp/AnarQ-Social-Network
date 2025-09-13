/**
 * Predictive Performance Service for Qflow
 * Implements predictive performance modeling and forecasting
 */
import { EventEmitter } from 'events';
import { EcosystemCorrelationService } from './EcosystemCorrelationService.js';
export interface PredictionModel {
    id: string;
    name: string;
    type: 'linear_regression' | 'time_series' | 'neural_network' | 'ensemble';
    targetMetric: string;
    inputFeatures: string[];
    accuracy: number;
    lastTrained: number;
    trainingDataSize: number;
    parameters: Record<string, any>;
}
export interface PerformanceForecast {
    targetModule: string;
    targetMetric: string;
    timeHorizon: number;
    predictions: Array<{
        timestamp: number;
        value: number;
        confidence: number;
        upperBound: number;
        lowerBound: number;
    }>;
    modelUsed: string;
    accuracy: number;
    assumptions: string[];
    riskFactors: string[];
}
export interface AnomalyPrediction {
    module: string;
    metric: string;
    probabilityOfAnomaly: number;
    expectedTimeToAnomaly: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    contributingFactors: Array<{
        factor: string;
        impact: number;
        confidence: number;
    }>;
}
export interface CapacityForecast {
    module: string;
    resource: 'cpu' | 'memory' | 'network' | 'storage';
    currentUtilization: number;
    predictedUtilization: Array<{
        timestamp: number;
        utilization: number;
        confidence: number;
    }>;
    capacityExhaustionTime?: number;
    recommendedActions: string[];
}
export declare class PredictivePerformanceService extends EventEmitter {
    private correlationService;
    private predictionModels;
    private trainingData;
    private forecastCache;
    private anomalyDetectors;
    private config;
    constructor(correlationService: EcosystemCorrelationService, options?: any);
    /**
     * Generate performance forecast for a module
     */
    generatePerformanceForecast(targetModule: string, targetMetric: string, timeHorizon?: number): Promise<PerformanceForecast>;
    /**
     * Predict anomalies for a module
     */
    predictAnomalies(targetModule: string, timeHorizon?: number): Promise<AnomalyPrediction[]>;
    /**
     * Generate capacity forecasts
     */
    generateCapacityForecasts(targetModule: string, timeHorizon?: number): Promise<CapacityForecast[]>;
    /**
     * Train or retrain prediction models
     */
    trainModels(forceRetrain?: boolean): Promise<void>;
    /**
     * Get model performance statistics
     */
    getModelStatistics(): {
        totalModels: number;
        averageAccuracy: number;
        modelsByType: Record<string, number>;
        recentPredictions: number;
        trainingDataSize: number;
    };
    /**
     * Get ecosystem-wide performance predictions
     */
    getEcosystemPredictions(timeHorizon?: number): Promise<{
        overallHealth: {
            current: number;
            predicted: number;
            confidence: number;
        };
        moduleForecasts: Array<{
            module: string;
            currentHealth: string;
            predictedHealth: string;
            confidence: number;
            keyRisks: string[];
        }>;
        criticalAlerts: Array<{
            module: string;
            alert: string;
            severity: string;
            timeToImpact: number;
        }>;
    }>;
    /**
     * Private methods
     */
    private initializePredictionModels;
    private startModelTraining;
    private setupEventHandlers;
    private selectBestModel;
    private generatePredictions;
    private generateSinglePrediction;
    private predictMetricAnomaly;
    private generateResourceCapacityForecast;
    private trainModel;
    private updateTrainingData;
    private getCurrentMetricValue;
    private getHistoricalValues;
    private getCurrentResourceUtilization;
    private getHistoricalResourceUtilization;
    private calculateTrend;
    private estimateTimeToAnomaly;
    private identifyContributingFactors;
    private calculateCapacityExhaustionTime;
    private generateCapacityRecommendations;
    private identifyRiskFactors;
    private generateAssumptions;
    private estimateModuleHealth;
    private predictModuleHealth;
    private identifyModuleRisks;
    private predictEcosystemHealth;
}
export default PredictivePerformanceService;
//# sourceMappingURL=PredictivePerformanceService.d.ts.map