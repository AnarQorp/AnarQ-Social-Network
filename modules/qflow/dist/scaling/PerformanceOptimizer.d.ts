/**
 * Performance-Based Node Selection Optimization
 *
 * Implements machine learning for node selection optimization,
 * historical performance analysis and prediction, and adaptive
 * algorithms based on execution patterns
 */
import { EventEmitter } from 'events';
export interface PerformanceMetric {
    metricId: string;
    nodeId: string;
    timestamp: string;
    metrics: {
        executionTime: number;
        throughput: number;
        errorRate: number;
        resourceUtilization: {
            cpu: number;
            memory: number;
            disk: number;
            network: number;
        };
        responseTime: number;
        queueTime: number;
        successRate: number;
    };
    workloadCharacteristics: {
        taskType: string;
        complexity: 'low' | 'medium' | 'high';
        dataSize: number;
        priority: 'low' | 'normal' | 'high' | 'critical';
    };
}
export interface NodePerformanceProfile {
    nodeId: string;
    profileId: string;
    capabilities: string[];
    strengths: string[];
    weaknesses: string[];
    optimalWorkloads: string[];
    performanceScores: {
        overall: number;
        reliability: number;
        speed: number;
        efficiency: number;
        consistency: number;
    };
    historicalTrends: {
        improving: boolean;
        degrading: boolean;
        stable: boolean;
        trendScore: number;
    };
    lastUpdated: string;
}
export interface MLModel {
    modelId: string;
    type: 'linear-regression' | 'random-forest' | 'neural-network' | 'gradient-boosting' | 'ensemble';
    purpose: 'performance-prediction' | 'node-ranking' | 'workload-matching' | 'anomaly-detection';
    features: string[];
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingData: {
        samples: number;
        lastTrained: string;
        trainingDuration: number;
    };
    hyperparameters: Record<string, any>;
    status: 'training' | 'ready' | 'updating' | 'deprecated';
}
export interface PredictionResult {
    predictionId: string;
    nodeId: string;
    workloadId: string;
    predictedPerformance: {
        executionTime: number;
        successProbability: number;
        resourceUsage: Record<string, number>;
        confidence: number;
    };
    reasoning: string[];
    alternatives: Array<{
        nodeId: string;
        score: number;
        reason: string;
    }>;
    timestamp: string;
}
export interface AdaptiveAlgorithm {
    algorithmId: string;
    name: string;
    type: 'reinforcement-learning' | 'genetic-algorithm' | 'particle-swarm' | 'simulated-annealing';
    objective: 'minimize-latency' | 'maximize-throughput' | 'optimize-cost' | 'balance-load';
    parameters: Record<string, any>;
    performance: {
        currentScore: number;
        bestScore: number;
        improvementRate: number;
        convergenceStatus: 'converging' | 'converged' | 'diverging';
    };
    adaptationHistory: Array<{
        timestamp: string;
        parameterChanges: Record<string, any>;
        performanceImpact: number;
        reason: string;
    }>;
}
export interface ExecutionPattern {
    patternId: string;
    name: string;
    description: string;
    characteristics: {
        taskTypes: string[];
        timePatterns: string[];
        resourcePatterns: string[];
        userPatterns: string[];
    };
    frequency: number;
    impact: {
        performanceEffect: number;
        resourceEffect: number;
        costEffect: number;
    };
    recommendations: string[];
    detectedAt: string;
    lastSeen: string;
}
/**
 * Performance Optimizer with ML-based Node Selection
 */
export declare class PerformanceOptimizer extends EventEmitter {
    private performanceMetrics;
    private nodeProfiles;
    private mlModels;
    private adaptiveAlgorithms;
    private executionPatterns;
    private predictions;
    private isRunning;
    private trainingInterval;
    private optimizationInterval;
    private patternDetectionInterval;
    constructor();
    /**
     * Start performance optimizer
     */
    start(): Promise<void>;
    /**
     * Stop performance optimizer
     */
    stop(): Promise<void>;
    /**
     * Record performance metric
     */
    recordPerformanceMetric(metric: PerformanceMetric): Promise<void>;
    /**
     * Predict node performance for workload
     */
    predictNodePerformance(nodeIds: string[], workloadCharacteristics: PerformanceMetric['workloadCharacteristics']): Promise<PredictionResult[]>;
    /**
     * Get optimal node selection
     */
    getOptimalNodeSelection(availableNodes: string[], workloadCharacteristics: PerformanceMetric['workloadCharacteristics'], selectionCriteria: {
        prioritize: 'speed' | 'reliability' | 'efficiency' | 'cost';
        maxNodes: number;
        minConfidence: number;
    }): Promise<{
        selectedNodes: string[];
        reasoning: string;
        confidence: number;
        alternatives: Array<{
            nodes: string[];
            score: number;
            reason: string;
        }>;
    }>;
    /**
     * Get node performance profile
     */
    getNodeProfile(nodeId: string): NodePerformanceProfile | undefined;
    /**
     * Get execution patterns
     */
    getExecutionPatterns(): ExecutionPattern[];
    /**
     * Get ML model status
     */
    getMLModelStatus(): Array<{
        modelId: string;
        type: string;
        purpose: string;
        accuracy: number;
        status: string;
        lastTrained: string;
    }>;
    /**
     * Get optimization statistics
     */
    getOptimizationStats(): {
        totalMetrics: number;
        nodeProfiles: number;
        activePredictions: number;
        detectedPatterns: number;
        modelAccuracy: number;
        optimizationScore: number;
    };
    private updateNodeProfile;
    private calculateReliabilityScore;
    private calculateSpeedScore;
    private calculateEfficiencyScore;
    private calculateConsistencyScore;
    private analyzeTrends;
    private identifyStrengths;
    private identifyWeaknesses;
    private determineOptimalWorkloads;
    private generatePrediction;
    private runMLPrediction;
    private applySelectionAlgorithm;
    private generateSelectionReasoning;
    private generateAlternatives;
    private calculateAlternativeScore;
    private trainModels;
    private trainModel;
    private optimizeAlgorithms;
    private optimizeAlgorithm;
    private detectExecutionPatterns;
    private detectTimePatterns;
    private detectWorkloadPatterns;
    private detectResourcePatterns;
    private initializeMLModels;
    private initializeAdaptiveAlgorithms;
    private generateProfileId;
    private generatePredictionId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const performanceOptimizer: PerformanceOptimizer;
//# sourceMappingURL=PerformanceOptimizer.d.ts.map