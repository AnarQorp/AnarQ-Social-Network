/**
 * Auto Scaling Engine for Qflow
 * Implements automatic scaling triggers based on performance metrics
 */
import { EventEmitter } from 'events';
export interface ScalingTrigger {
    id: string;
    name: string;
    metric: string;
    threshold: number;
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
    action: 'scale_up' | 'scale_down';
    cooldownPeriod: number;
    minNodes: number;
    maxNodes: number;
    scalingFactor: number;
    enabled: boolean;
    lastTriggered?: number;
}
export interface LoadRedirectionPolicy {
    id: string;
    name: string;
    condition: string;
    targetNodePool: string;
    redirectionPercentage: number;
    priority: number;
    enabled: boolean;
    maxDuration: number;
}
export interface FlowPausingPolicy {
    id: string;
    name: string;
    condition: string;
    targetPriority: 'low' | 'medium' | 'high';
    pauseDuration: number;
    maxFlowsTosPause: number;
    enabled: boolean;
}
export declare class AutoScalingEngine extends EventEmitter {
    private scalingTriggers;
    private redirectionPolicies;
    private pausingPolicies;
    private activeScalingActions;
    private activeRedirections;
    private pausedFlows;
    private currentMetrics;
    private nodePool;
    constructor(options?: any);
    /**
     * Add scaling trigger
     */
    addScalingTrigger(trigger: ScalingTrigger): void;
    /**
     * Add load redirection policy
     */
    addRedirectionPolicy(policy: LoadRedirectionPolicy): void;
    /**
     * Add flow pausing policy
     */
    addFlowPausingPolicy(policy: FlowPausingPolicy): void;
    /**
     * Update current metrics for evaluation
     */
    updateMetrics(metrics: any): void;
    /**
     * Update node pool information
     */
    updateNodePool(nodes: Map<string, any>): void;
    /**
     * Trigger immediate scaling evaluation
     */
    triggerScalingEvaluation(): Promise<void>;
    /**
     * Get scaling status
     */
    getScalingStatus(): {
        triggers: Array<{
            id: string;
            name: string;
            status: 'active' | 'cooldown' | 'disabled';
            lastTriggered?: number;
            nextEvaluation?: number;
        }>;
        activeActions: Array<{
            triggerId: string;
            action: string;
            timestamp: number;
            nodeCount: number;
        }>;
        nodeCount: number;
        redirections: Array<{
            policyId: string;
            timestamp: number;
            targetPool: string;
        }>;
        pausedFlows: number;
    };
    /**
     * Private methods
     */
    private setupDefaultTriggers;
    private setupDefaultPolicies;
    private evaluateScalingTriggers;
    private executeScalingAction;
    private evaluateRedirectionPolicies;
    private executeLoadRedirection;
    private evaluateFlowPausing;
    private executeFlowPausing;
    private getMetricValue;
    private evaluateCondition;
    private evaluateRedirectionCondition;
    private performScaling;
    private performLoadRedirection;
    private performFlowPausing;
    private getFlowsToPause;
}
export default AutoScalingEngine;
//# sourceMappingURL=AutoScalingEngine.d.ts.map