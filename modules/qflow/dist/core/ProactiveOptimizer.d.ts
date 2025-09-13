/**
 * Proactive Performance Optimizer for Qflow
 * Implements proactive performance optimization strategies
 */
import { EventEmitter } from 'events';
export interface OptimizationRule {
    id: string;
    name: string;
    type: 'cache' | 'connection_pool' | 'validation' | 'execution' | 'resource';
    trigger: string;
    action: string;
    parameters: Record<string, any>;
    priority: number;
    enabled: boolean;
    cooldownPeriod: number;
    lastExecuted?: number;
    effectiveness?: number;
}
export interface CacheOptimization {
    type: 'validation' | 'flow_definition' | 'node_selection' | 'result';
    currentSize: number;
    targetSize: number;
    hitRate: number;
    targetHitRate: number;
    evictionPolicy: 'lru' | 'lfu' | 'ttl';
}
export interface ConnectionPoolOptimization {
    poolName: string;
    currentSize: number;
    targetSize: number;
    activeConnections: number;
    waitingRequests: number;
    averageWaitTime: number;
}
export interface ValidationOptimization {
    parallelLayers: string[];
    cachePrewarming: boolean;
    batchValidation: boolean;
    skipRedundantChecks: boolean;
}
export declare class ProactiveOptimizer extends EventEmitter {
    private optimizationRules;
    private activeOptimizations;
    private optimizationHistory;
    private currentMetrics;
    private cacheStates;
    private connectionPools;
    constructor(options?: any);
    /**
     * Add optimization rule
     */
    addOptimizationRule(rule: OptimizationRule): void;
    /**
     * Update current metrics for optimization decisions
     */
    updateMetrics(metrics: any): void;
    /**
     * Trigger immediate optimization evaluation
     */
    triggerOptimizationEvaluation(): Promise<void>;
    /**
     * Get optimization status
     */
    getOptimizationStatus(): {
        rules: Array<{
            id: string;
            name: string;
            type: string;
            enabled: boolean;
            lastExecuted?: number;
            effectiveness?: number;
            status: 'active' | 'cooldown' | 'disabled';
        }>;
        activeOptimizations: Array<{
            ruleId: string;
            timestamp: number;
            type: string;
        }>;
        cacheStates: Record<string, CacheOptimization>;
        connectionPools: Record<string, ConnectionPoolOptimization>;
        recentEffectiveness: number;
    };
    /**
     * Execute specific optimization
     */
    executeOptimization(ruleId: string, force?: boolean): Promise<void>;
    /**
     * Private methods
     */
    private setupDefaultRules;
    private initializeCacheStates;
    private initializeConnectionPools;
    private evaluateOptimizations;
    private evaluateOptimizationTrigger;
    private performOptimization;
    private optimizeCacheSize;
    private optimizeValidationParallelism;
    private optimizeConnectionPool;
    private prewarmCache;
    private optimizeResourceAllocation;
    private optimizeBatchValidation;
    private optimizeResultCaching;
    private analyzeEffectiveness;
    private calculateOptimizationEffectiveness;
    private calculateRecentEffectiveness;
}
export default ProactiveOptimizer;
//# sourceMappingURL=ProactiveOptimizer.d.ts.map