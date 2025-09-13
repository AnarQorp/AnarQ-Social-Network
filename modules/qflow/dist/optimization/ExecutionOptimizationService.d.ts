/**
 * Execution Optimization Service
 *
 * Provides advanced execution optimization features including:
 * - Parallel execution for independent steps
 * - Lazy loading for flow components
 * - Resource pooling for WASM runtimes and connections
 * - Performance monitoring and optimization
 */
import { EventEmitter } from 'events';
import { FlowDefinition, FlowStep, ExecutionContext } from '../models/FlowDefinition';
export interface OptimizationConfig {
    maxParallelSteps: number;
    lazyLoadingEnabled: boolean;
    resourcePoolSize: number;
    connectionPoolSize: number;
    preloadThreshold: number;
    optimizationLevel: 'conservative' | 'balanced' | 'aggressive';
}
export interface ParallelExecutionGroup {
    id: string;
    steps: FlowStep[];
    dependencies: string[];
    estimatedDuration: number;
    priority: number;
}
export interface ResourcePool<T> {
    available: T[];
    inUse: Set<T>;
    maxSize: number;
    createResource: () => Promise<T>;
    destroyResource: (resource: T) => Promise<void>;
    validateResource: (resource: T) => boolean;
}
export interface LazyLoadableComponent {
    id: string;
    type: 'step' | 'template' | 'module';
    loadPriority: number;
    estimatedSize: number;
    dependencies: string[];
    loader: () => Promise<any>;
}
export interface OptimizationMetrics {
    parallelExecutionCount: number;
    lazyLoadHitRate: number;
    resourcePoolUtilization: number;
    averageExecutionTime: number;
    optimizationSavings: number;
    memoryUsage: number;
}
export declare class ExecutionOptimizationService extends EventEmitter {
    private config;
    private wasmPool;
    private connectionPool;
    private lazyComponents;
    private loadedComponents;
    private parallelGroups;
    private metrics;
    private optimizationHistory;
    constructor(config: OptimizationConfig);
    /**
     * Initialize resource pools for WASM runtimes and connections
     */
    private initializeResourcePools;
    /**
     * Pre-populate resource pools to avoid cold start delays
     */
    private prePopulateResourcePools;
    /**
     * Analyze flow for parallel execution opportunities
     */
    analyzeParallelExecution(flow: FlowDefinition): ParallelExecutionGroup[];
    /**
     * Execute steps in parallel within a group
     */
    executeParallelGroup(group: ParallelExecutionGroup, context: ExecutionContext): Promise<Map<string, any>>;
    /**
     * Register a component for lazy loading
     */
    registerLazyComponent(component: LazyLoadableComponent): void;
    /**
     * Load a component lazily when needed
     */
    loadComponent(componentId: string): Promise<any>;
    /**
     * Preload components based on usage patterns
     */
    preloadComponents(flowId: string): Promise<void>;
    /**
     * Acquire a resource from a pool
     */
    acquireResource<T>(pool: ResourcePool<T>): Promise<T>;
    /**
     * Release a resource back to the pool
     */
    releaseResource<T>(pool: ResourcePool<T>, resource: T): Promise<void>;
    /**
     * Get optimization metrics
     */
    getMetrics(): OptimizationMetrics;
    /**
     * Get optimization recommendations for a flow
     */
    getOptimizationRecommendations(flow: FlowDefinition): string[];
    /**
     * Apply automatic optimizations to a flow
     */
    optimizeFlow(flow: FlowDefinition): Promise<FlowDefinition>;
    /**
     * Clean up resources and stop monitoring
     */
    cleanup(): Promise<void>;
    private buildDependencyGraph;
    private findIndependentSteps;
    private getGroupDependencies;
    private calculateGroupPriority;
    private executeStepWithRuntime;
    private updateExecutionMetrics;
    private updateLazyLoadMetrics;
    private updateResourcePoolMetrics;
    private startOptimizationMonitoring;
}
//# sourceMappingURL=ExecutionOptimizationService.d.ts.map