/**
 * Parallel Execution Engine
 *
 * Handles parallel execution of independent flow steps to optimize
 * execution time and resource utilization.
 */
import { EventEmitter } from 'events';
import { FlowStep, ExecutionContext } from '../models/FlowDefinition';
import { ResourcePoolManager } from './ResourcePoolManager';
export interface ParallelExecutionConfig {
    maxConcurrentSteps: number;
    timeoutMs: number;
    retryAttempts: number;
    failureStrategy: 'fail-fast' | 'continue-on-error' | 'retry-failed';
    resourceAllocation: 'balanced' | 'priority-based' | 'round-robin';
}
export interface ExecutionGroup {
    id: string;
    steps: FlowStep[];
    dependencies: string[];
    priority: number;
    estimatedDuration: number;
    maxConcurrency: number;
}
export interface StepExecution {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime?: number;
    endTime?: number;
    result?: any;
    error?: string;
    retryCount: number;
    resourceId?: string;
}
export interface ExecutionPlan {
    groups: ExecutionGroup[];
    totalSteps: number;
    estimatedDuration: number;
    parallelizationRatio: number;
}
export interface ExecutionResult {
    success: boolean;
    results: Map<string, any>;
    errors: Map<string, string>;
    executionTime: number;
    parallelEfficiency: number;
    resourceUtilization: number;
}
export declare class ParallelExecutionEngine extends EventEmitter {
    private config;
    private resourceManager;
    private activeExecutions;
    private executionQueue;
    private semaphore;
    constructor(config: ParallelExecutionConfig, resourceManager: ResourcePoolManager);
    /**
     * Analyze steps for parallel execution opportunities
     */
    analyzeSteps(steps: FlowStep[]): ExecutionPlan;
    /**
     * Execute steps in parallel according to the execution plan
     */
    executeParallel(steps: FlowStep[], context: ExecutionContext): Promise<ExecutionResult>;
    /**
     * Execute a single group of parallel steps
     */
    private executeGroup;
    /**
     * Execute a single step with retry logic
     */
    private executeStepWithRetry;
    /**
     * Build dependency graph for steps
     */
    private buildDependencyGraph;
    /**
     * Identify groups of steps that can be executed in parallel
     */
    private identifyParallelGroups;
    /**
     * Perform topological sort to determine execution levels
     */
    private topologicalSort;
    /**
     * Partition steps into independent groups
     */
    private partitionIndependentSteps;
    /**
     * Check if two steps are independent and can run in parallel
     */
    private areStepsIndependent;
    /**
     * Check for resource conflicts between steps
     */
    private haveResourceConflicts;
    /**
     * Check for state conflicts between steps
     */
    private haveStateConflicts;
    private getStepResources;
    private getStepWrites;
    private getStepReads;
    private getGroupDependencies;
    private calculateStepPriority;
    private estimateExecutionDuration;
    private calculateParallelEfficiency;
    private calculateResourceUtilization;
    private acquireExecutionResource;
    private releaseExecutionResource;
    private executeStepOnResource;
}
//# sourceMappingURL=ParallelExecutionEngine.d.ts.map