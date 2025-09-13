/**
 * Adaptive Performance Service for Qflow
 * Implements automatic scaling and performance optimization
 */
import { EventEmitter } from 'events';
import { PerformanceIntegrationService } from './PerformanceIntegrationService.js';
export interface ScalingPolicy {
    name: string;
    metric: string;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    minNodes: number;
    maxNodes: number;
    cooldownPeriod: number;
    enabled: boolean;
}
export interface LoadRedirectionRule {
    name: string;
    condition: string;
    targetNodes: string[];
    percentage: number;
    priority: number;
    enabled: boolean;
}
export interface PerformanceOptimization {
    name: string;
    type: 'cache' | 'connection_pool' | 'validation' | 'execution';
    trigger: string;
    parameters: Record<string, any>;
    enabled: boolean;
}
export declare class AdaptivePerformanceService extends EventEmitter {
    private performanceService;
    private scalingPolicies;
    private redirectionRules;
    private optimizations;
    private activeScalingActions;
    private nodeMetrics;
    private config;
    constructor(performanceService: PerformanceIntegrationService, options?: any);
    /**
     * Start adaptive performance monitoring
     */
    start(): void;
    /**
     * Stop adaptive performance monitoring
     */
    stop(): void;
    /**
     * Add scaling policy
     */
    addScalingPolicy(policy: ScalingPolicy): void;
    /**
     * Add load redirection rule
     */
    addRedirectionRule(rule: LoadRedirectionRule): void;
    /**
     * Add performance optimization
     */
    addOptimization(optimization: PerformanceOptimization): void;
    /**
     * Handle automatic scaling based on metrics
     */
    handleAutoScaling(metrics: any): Promise<void>;
    /**
     * Handle load redirection based on performance conditions
     */
    handleLoadRedirection(performanceStatus: any): Promise<void>;
    /**
     * Handle proactive performance optimization
     */
    handleProactiveOptimization(metrics: any): Promise<void>;
    /**
     * Implement flow-level burn-rate actions
     */
    handleFlowBurnRateActions(burnRate: number): Promise<void>;
    /**
     * Get current scaling status
     */
    getScalingStatus(): {
        policies: Array<{
            name: string;
            status: 'active' | 'cooldown' | 'inactive';
            lastAction?: string;
            lastActionTime?: number;
        }>;
        activeActions: number;
        nodeCount: number;
        loadDistribution: Record<string, number>;
    };
    /**
     * Get performance optimization status
     */
    getOptimizationStatus(): {
        optimizations: Array<{
            name: string;
            type: string;
            enabled: boolean;
            lastTriggered?: number;
            effectiveness?: number;
        }>;
        cacheHitRates: Record<string, number>;
        resourceUtilization: Record<string, number>;
    };
    /**
     * Private methods
     */
    private setupDefaultPolicies;
    private setupEventHandlers;
    private scaleUp;
    private scaleDown;
    private redirectLoad;
    private applyOptimization;
    private pauseLowPriorityFlows;
    private deferHeavySteps;
    private triggerGracefulDegradation;
    private handleEmergencyResponse;
    private handleSLOViolation;
    private getMetricValue;
    private evaluateCondition;
    private shouldTriggerOptimization;
    private calculateBurnRate;
    private calculateLoadDistribution;
    /**
     * Initialize the adaptive performance service
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the adaptive performance service
     */
    shutdown(): Promise<void>;
}
export default AdaptivePerformanceService;
//# sourceMappingURL=AdaptivePerformanceService.d.ts.map