/**
 * Automatic Scaling and Resource Optimization
 *
 * Implements horizontal scaling with new node integration,
 * vertical scaling optimization per node, and capacity planning
 * with resource forecasting
 */
import { EventEmitter } from 'events';
export interface ScalingPolicy {
    policyId: string;
    name: string;
    type: 'horizontal' | 'vertical' | 'hybrid';
    triggers: ScalingTrigger[];
    constraints: ScalingConstraints;
    cooldownPeriod: number;
    enabled: boolean;
}
export interface ScalingTrigger {
    triggerId: string;
    metric: 'cpu' | 'memory' | 'network' | 'disk' | 'response-time' | 'throughput' | 'error-rate' | 'queue-length';
    threshold: number;
    comparison: 'greater-than' | 'less-than' | 'equals';
    duration: number;
    action: 'scale-up' | 'scale-down' | 'optimize';
}
export interface ScalingConstraints {
    minNodes: number;
    maxNodes: number;
    minResourcesPerNode: {
        cpu: number;
        memory: number;
        disk: number;
    };
    maxResourcesPerNode: {
        cpu: number;
        memory: number;
        disk: number;
    };
    maxCostPerHour: number;
    allowedRegions: string[];
    requiredCapabilities: string[];
}
export interface ScalingAction {
    actionId: string;
    type: 'add-node' | 'remove-node' | 'upgrade-node' | 'downgrade-node' | 'redistribute-load';
    triggeredBy: string;
    targetNodes: string[];
    parameters: Record<string, any>;
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
    startedAt: string;
    completedAt?: string;
    error?: string;
    impact: {
        expectedLoadChange: number;
        expectedCostChange: number;
        expectedPerformanceChange: number;
    };
}
export interface ResourceOptimization {
    optimizationId: string;
    nodeId: string;
    type: 'cpu-optimization' | 'memory-optimization' | 'disk-optimization' | 'network-optimization';
    currentConfig: NodeConfiguration;
    recommendedConfig: NodeConfiguration;
    expectedBenefit: {
        performanceImprovement: number;
        costReduction: number;
        resourceEfficiency: number;
    };
    confidence: number;
    validUntil: string;
}
export interface NodeConfiguration {
    cpu: {
        cores: number;
        frequency: number;
        architecture: string;
    };
    memory: {
        size: number;
        type: string;
        speed: number;
    };
    disk: {
        size: number;
        type: 'ssd' | 'hdd' | 'nvme';
        iops: number;
    };
    network: {
        bandwidth: number;
        latency: number;
    };
}
export interface CapacityForecast {
    forecastId: string;
    timeHorizon: string;
    predictions: Array<{
        timestamp: string;
        requiredNodes: number;
        requiredResources: {
            totalCpu: number;
            totalMemory: number;
            totalDisk: number;
            totalNetwork: number;
        };
        confidence: number;
        factors: string[];
    }>;
    recommendations: Array<{
        action: string;
        timing: string;
        rationale: string;
        impact: Record<string, number>;
    }>;
    generatedAt: string;
}
export interface NodePool {
    poolId: string;
    name: string;
    nodeType: string;
    minSize: number;
    maxSize: number;
    currentSize: number;
    targetSize: number;
    nodes: string[];
    autoScaling: boolean;
    configuration: NodeConfiguration;
    cost: {
        hourlyRate: number;
        currency: string;
    };
}
/**
 * Auto Scaling Manager
 */
export declare class AutoScalingManager extends EventEmitter {
    private scalingPolicies;
    private activeActions;
    private optimizations;
    private capacityForecasts;
    private nodePools;
    private triggerStates;
    private isRunning;
    private evaluationInterval;
    private forecastingInterval;
    constructor();
    /**
     * Start auto scaling manager
     */
    start(): Promise<void>;
    /**
     * Stop auto scaling manager
     */
    stop(): Promise<void>;
    /**
     * Add scaling policy
     */
    addScalingPolicy(policy: ScalingPolicy): Promise<void>;
    /**
     * Execute scaling action
     */
    executeScalingAction(type: ScalingAction['type'], triggeredBy: string, targetNodes?: string[], parameters?: Record<string, any>): Promise<string>;
    /**
     * Generate resource optimization recommendations
     */
    generateOptimizations(nodeId?: string): Promise<ResourceOptimization[]>;
    /**
     * Get capacity forecast
     */
    getCapacityForecast(timeHorizon?: string): Promise<CapacityForecast>;
    /**
     * Add node pool
     */
    addNodePool(pool: NodePool): Promise<void>;
    /**
     * Get scaling status
     */
    getScalingStatus(): {
        activePolicies: number;
        activeActions: number;
        totalNodes: number;
        pendingOptimizations: number;
        lastForecastUpdate: string;
    };
    private evaluateScalingPolicies;
    private evaluatePolicy;
    private evaluateTrigger;
    private getCurrentMetricValue;
    private executeTriggeredAction;
    private performScalingAction;
    private addNode;
    private removeNode;
    private upgradeNode;
    private downgradeNode;
    private redistributeLoad;
    private calculateActionImpact;
    private findBestNodePool;
    private getCurrentNodeConfiguration;
    private analyzeResourceUtilization;
    private optimizeCPU;
    private optimizeMemory;
    private optimizeDisk;
    private generateCapacityForecasts;
    private generateCapacityForecast;
    private isForecastStale;
    private initializeDefaultPolicies;
    private initializeDefaultNodePools;
    private generateActionId;
    private generateOptimizationId;
    private generateForecastId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const autoScalingManager: AutoScalingManager;
//# sourceMappingURL=AutoScalingManager.d.ts.map