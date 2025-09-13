/**
 * Flow Burn-Rate Service for Qflow
 * Implements flow-level burn-rate actions and cost control
 */
import { EventEmitter } from 'events';
export interface FlowPriority {
    flowId: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    costWeight: number;
    resourceWeight: number;
    slaRequirements?: {
        maxLatency: number;
        minThroughput: number;
        maxErrorRate: number;
    };
}
export interface BurnRateMetrics {
    timestamp: number;
    overallBurnRate: number;
    resourceBurnRate: {
        cpu: number;
        memory: number;
        network: number;
        storage: number;
    };
    costBurnRate: {
        computeCost: number;
        networkCost: number;
        storageCost: number;
        totalCost: number;
    };
    performanceBurnRate: {
        latencyBurn: number;
        errorRateBurn: number;
        throughputBurn: number;
    };
}
export interface FlowCostAnalysis {
    flowId: string;
    estimatedCost: {
        compute: number;
        network: number;
        storage: number;
        total: number;
    };
    resourceConsumption: {
        cpuHours: number;
        memoryGBHours: number;
        networkGB: number;
        storageGB: number;
    };
    executionMetrics: {
        duration: number;
        stepCount: number;
        retryCount: number;
        nodeCount: number;
    };
}
export interface CostControlPolicy {
    id: string;
    name: string;
    burnRateThreshold: number;
    actions: Array<{
        type: 'pause_flows' | 'defer_steps' | 'reroute_cold' | 'reduce_parallelism' | 'graceful_degradation';
        priority: 'critical' | 'high' | 'medium' | 'low';
        parameters: Record<string, any>;
    }>;
    enabled: boolean;
    cooldownPeriod: number;
    lastTriggered?: number;
}
export interface GracefulDegradationLevel {
    level: number;
    name: string;
    burnRateThreshold: number;
    actions: {
        pauseLowPriorityFlows: boolean;
        deferHeavySteps: boolean;
        rerouteToColdNodes: boolean;
        reduceParallelism: number;
        disableNonEssentialFeatures: boolean;
        enableAggressiveCaching: boolean;
    };
    resourceLimits: {
        maxCpuUtilization: number;
        maxMemoryUtilization: number;
        maxNetworkUtilization: number;
    };
}
export declare class FlowBurnRateService extends EventEmitter {
    private flowPriorities;
    private burnRateHistory;
    private flowCostAnalyses;
    private costControlPolicies;
    private gracefulDegradationLevels;
    private currentDegradationLevel;
    private pausedFlows;
    private deferredSteps;
    private coldNodes;
    private config;
    constructor(options?: any);
    /**
     * Set flow priority and cost parameters
     */
    setFlowPriority(flowPriority: FlowPriority): void;
    /**
     * Calculate current burn rate
     */
    calculateBurnRate(): BurnRateMetrics;
    /**
     * Handle burn rate threshold exceeded
     */
    handleBurnRateExceeded(burnRate: number): Promise<void>;
    /**
     * Pause low-priority flows
     */
    pauseLowPriorityFlows(burnRate: number, maxFlowsToPause?: number): Promise<string[]>;
    /**
     * Defer heavy steps to cold nodes
     */
    deferHeavySteps(burnRate: number): Promise<void>;
    /**
     * Reroute flows to cold nodes
     */
    rerouteFlowsToColdNodes(burnRate: number, percentage?: number): Promise<void>;
    /**
     * Analyze flow cost
     */
    analyzeFlowCost(flowId: string, executionMetrics: any): FlowCostAnalysis;
    /**
     * Get cost control status
     */
    getCostControlStatus(): {
        currentBurnRate: number;
        degradationLevel: number;
        pausedFlows: number;
        deferredSteps: number;
        costLimits: any;
        currentCosts: {
            hourly: number;
            daily: number;
            monthly: number;
        };
        projectedCosts: {
            hourly: number;
            daily: number;
            monthly: number;
        };
        recommendations: string[];
    };
    /**
     * Private methods
     */
    private initializeGracefulDegradationLevels;
    private initializeDefaultPolicies;
    private initializeColdNodes;
    private startBurnRateMonitoring;
    private calculateResourceBurnRate;
    private calculateCostBurnRate;
    private calculatePerformanceBurnRate;
    private executeCostControlPolicies;
    private executeAction;
    private triggerGracefulDegradation;
    private setGracefulDegradationLevel;
    private pauseFlow;
    private resumeFlow;
    private calculatePauseDuration;
    private identifyHeavySteps;
    private selectColdNode;
    private executeDeferredStep;
    private rerouteFlow;
    private reduceParallelism;
    private getActiveFlows;
    private calculateFlowCost;
    private checkFlowResumption;
    private cleanupDeferredSteps;
    private calculateCurrentCosts;
    private calculateProjectedCosts;
    private generateCostRecommendations;
}
export default FlowBurnRateService;
//# sourceMappingURL=FlowBurnRateService.d.ts.map