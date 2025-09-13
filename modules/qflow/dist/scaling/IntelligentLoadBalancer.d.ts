/**
 * Intelligent Load Distribution Across Nodes
 *
 * Implements load balancing algorithms for execution distribution,
 * real-time load monitoring and adjustment, and predictive scaling
 * based on demand patterns
 */
import { EventEmitter } from 'events';
import { QNETNode } from '../network/QNETNodeManager.js';
export interface LoadBalancingStrategy {
    name: 'round-robin' | 'weighted-round-robin' | 'least-connections' | 'least-response-time' | 'resource-based' | 'predictive';
    parameters: Record<string, any>;
}
export interface NodeLoad {
    nodeId: string;
    cpuUtilization: number;
    memoryUtilization: number;
    networkUtilization: number;
    diskUtilization: number;
    activeConnections: number;
    queuedTasks: number;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    lastUpdated: string;
}
export interface LoadBalancingDecision {
    decisionId: string;
    selectedNode: string;
    strategy: string;
    score: number;
    alternatives: Array<{
        nodeId: string;
        score: number;
        reason: string;
    }>;
    factors: Record<string, number>;
    timestamp: string;
}
export interface PredictiveModel {
    modelId: string;
    type: 'linear-regression' | 'exponential-smoothing' | 'arima' | 'neural-network';
    parameters: Record<string, any>;
    accuracy: number;
    lastTrained: string;
    predictions: Array<{
        timestamp: string;
        predictedLoad: number;
        confidence: number;
    }>;
}
export interface LoadPattern {
    patternId: string;
    name: string;
    description: string;
    timeWindows: Array<{
        startHour: number;
        endHour: number;
        daysOfWeek: number[];
        expectedLoad: number;
        variance: number;
    }>;
    seasonality: {
        daily: boolean;
        weekly: boolean;
        monthly: boolean;
    };
    triggers: string[];
}
export interface ScalingRecommendation {
    recommendationId: string;
    type: 'scale-up' | 'scale-down' | 'redistribute' | 'no-action';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    targetNodes: string[];
    expectedImpact: {
        loadReduction: number;
        responseTimeImprovement: number;
        costIncrease: number;
    };
    confidence: number;
    validUntil: string;
}
/**
 * Intelligent Load Balancer
 */
export declare class IntelligentLoadBalancer extends EventEmitter {
    private nodeLoads;
    private loadHistory;
    private decisions;
    private predictiveModels;
    private loadPatterns;
    private scalingRecommendations;
    private currentStrategy;
    private isRunning;
    private monitoringInterval;
    private predictionInterval;
    constructor();
    /**
     * Start load balancer
     */
    start(): Promise<void>;
    /**
     * Stop load balancer
     */
    stop(): Promise<void>;
    /**
     * Select best node for task execution
     */
    selectNode(availableNodes: QNETNode[], taskRequirements: {
        cpuRequired: number;
        memoryRequired: number;
        estimatedDuration: number;
        priority: 'low' | 'normal' | 'high' | 'critical';
    }): Promise<LoadBalancingDecision>;
    /**
     * Update node load information
     */
    updateNodeLoad(nodeId: string, load: Partial<NodeLoad>): Promise<void>;
    /**
     * Set load balancing strategy
     */
    setStrategy(strategy: LoadBalancingStrategy): void;
    /**
     * Get current load distribution
     */
    getLoadDistribution(): {
        totalNodes: number;
        averageLoad: number;
        loadVariance: number;
        overloadedNodes: string[];
        underutilizedNodes: string[];
    };
    /**
     * Get scaling recommendations
     */
    getScalingRecommendations(): ScalingRecommendation[];
    /**
     * Get load predictions
     */
    getLoadPredictions(nodeId?: string): Array<{
        timestamp: string;
        predictedLoad: number;
        confidence: number;
    }>;
    private calculateNodeScore;
    private getScoreReason;
    private getDecisionFactors;
    private calculateCompositeLoad;
    private storeLoadHistory;
    private updateLoadMetrics;
    private performPredictiveAnalysis;
    private updatePredictiveModel;
    private generatePredictions;
    private getPredictedLoad;
    private checkScalingNeeds;
    private updateScalingRecommendations;
    private predictFutureLoad;
    private initializeLoadPatterns;
    private initializePredictiveModels;
    private generateDecisionId;
    private generateModelId;
    private generateRecommendationId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const intelligentLoadBalancer: IntelligentLoadBalancer;
//# sourceMappingURL=IntelligentLoadBalancer.d.ts.map