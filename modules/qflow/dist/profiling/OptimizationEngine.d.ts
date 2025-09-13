/**
 * Optimization Engine
 *
 * Provides automated optimization recommendations and performance tuning
 * for Qflow executions based on profiling data and machine learning insights.
 */
import { EventEmitter } from 'events';
import { FlowDefinition } from '../models/FlowDefinition';
import { PerformanceProfiler, OptimizationRecommendation, FlowPerformanceAnalysis } from './PerformanceProfiler';
export interface OptimizationConfig {
    enableAutoOptimization: boolean;
    optimizationThreshold: number;
    maxOptimizationAttempts: number;
    learningRate: number;
    confidenceThreshold: number;
}
export interface OptimizationResult {
    flowId: string;
    optimizationType: string;
    beforeMetrics: PerformanceMetrics;
    afterMetrics: PerformanceMetrics;
    improvement: number;
    success: boolean;
    timestamp: number;
}
export interface PerformanceMetrics {
    averageDuration: number;
    memoryUsage: number;
    cpuUsage: number;
    throughput: number;
    errorRate: number;
}
export interface OptimizationStrategy {
    name: string;
    description: string;
    applicableConditions: (analysis: FlowPerformanceAnalysis) => boolean;
    apply: (flow: FlowDefinition) => Promise<FlowDefinition>;
    expectedImprovement: number;
    riskLevel: 'low' | 'medium' | 'high';
}
export declare class OptimizationEngine extends EventEmitter {
    private config;
    private profiler;
    private optimizationHistory;
    private strategies;
    private learningModel;
    constructor(config: OptimizationConfig, profiler: PerformanceProfiler);
    /**
     * Analyze flow and suggest optimizations
     */
    analyzeAndOptimize(flowId: string): Promise<OptimizationRecommendation[]>;
    /**
     * Apply automatic optimization if enabled
     */
    autoOptimize(flowId: string, flow: FlowDefinition): Promise<FlowDefinition | null>;
    /**
     * Initialize optimization strategies
     */
    private initializeStrategies;
    /**
     * Apply step parallelization optimization
     */
    private applyStepParallelization;
    /**
     * Apply validation caching optimization
     */
    private applyValidationCaching;
    /**
     * Apply resource pooling optimization
     */
    private applyResourcePooling;
    /**
     * Apply step reordering optimization
     */
    private applyStepReordering;
    /**
     * Apply lazy loading optimization
     */
    private applyLazyLoading;
    /**
     * Build dependency graph for steps
     */
    private buildDependencyGraph;
    /**
     * Find parallelizable groups of steps
     */
    private findParallelizableGroups;
    /**
     * Get step weight for reordering
     */
    private getStepWeight;
    /**
     * Select best optimization strategy
     */
    private selectBestStrategy;
    /**
     * Create optimization recommendation
     */
    private createRecommendation;
    /**
     * Generate implementation steps for a strategy
     */
    private generateImplementationSteps;
    /**
     * Extract performance metrics from analysis
     */
    private extractMetrics;
    /**
     * Record optimization result
     */
    private recordOptimization;
    /**
     * Get optimization history for a flow
     */
    getOptimizationHistory(flowId: string): OptimizationResult[];
    /**
     * Clear optimization history
     */
    clearOptimizationHistory(flowId?: string): void;
}
//# sourceMappingURL=OptimizationEngine.d.ts.map