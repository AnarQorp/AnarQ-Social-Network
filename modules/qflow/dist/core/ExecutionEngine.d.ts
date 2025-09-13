/**
 * Qflow Execution Engine
 *
 * Core execution engine for sequential flow processing
 * Handles flow execution lifecycle and state management
 */
import { FlowDefinition, ExecutionState, ExecutionContext, ExecutionError } from '../models/FlowDefinition.js';
export type ExecutionId = string;
export interface ExecutionResult {
    success: boolean;
    result?: any;
    error?: ExecutionError;
    duration: number;
}
export interface StepExecutionResult {
    stepId: string;
    success: boolean;
    result?: any;
    error?: ExecutionError;
    duration: number;
    nextStep?: string;
}
/**
 * Execution Engine
 * Manages flow execution lifecycle with sequential step processing
 */
export declare class ExecutionEngine {
    private executions;
    private flowDefinitions;
    private optimizationService;
    private lazyLoadingManager;
    private resourcePoolManager;
    private parallelExecutionEngine;
    private optimizationEnabled;
    constructor(optimizationEnabled?: boolean);
    /**
     * Register a flow definition for execution
     */
    registerFlow(flow: FlowDefinition): void;
    /**
     * Start flow execution
     */
    startExecution(flowId: string, context: ExecutionContext): Promise<ExecutionId>;
    /**
     * Pause execution
     */
    pauseExecution(executionId: ExecutionId): Promise<void>;
    /**
     * Resume execution
     */
    resumeExecution(executionId: ExecutionId): Promise<void>;
    /**
     * Abort execution
     */
    abortExecution(executionId: ExecutionId): Promise<void>;
    /**
     * Get execution status
     */
    getExecutionStatus(executionId: ExecutionId): Promise<ExecutionState | null>;
    /**
     * Execute flow steps sequentially
     */
    private executeFlow;
    /**
     * Execute a single step
     */
    private executeStep;
    /**
     * Execute task step (placeholder implementation)
     */
    private executeTask;
    /**
     * Execute condition step (placeholder implementation)
     */
    private executeCondition;
    /**
     * Execute parallel step (placeholder implementation)
     */
    private executeParallel;
    /**
     * Execute event trigger step (placeholder implementation)
     */
    private executeEventTrigger;
    /**
     * Execute module call step (placeholder implementation)
     */
    private executeModuleCall;
    /**
     * Handle execution error
     */
    private handleExecutionError;
    /**
     * Get all executions (for monitoring)
     */
    getAllExecutions(): ExecutionState[];
    /**
     * Clean up completed executions (basic cleanup)
     */
    cleanupExecutions(maxAge?: number): void;
    /**
     * Release DAO resources for execution
     */
    private releaseDAOResources;
    /**
     * Setup optimization event handlers
     */
    private setupOptimizationEventHandlers;
    /**
     * Get optimization metrics
     */
    getOptimizationMetrics(): any;
    /**
     * Optimize a flow for better performance
     */
    optimizeFlow(flow: FlowDefinition): Promise<FlowDefinition>;
    /**
     * Execute steps with optimization
     */
    private executeStepsOptimized;
    /**
     * Get optimization recommendations for a flow
     */
    getOptimizationRecommendations(flowId: string): string[];
    /**
     * Cleanup optimization resources
     */
    cleanup(): Promise<void>;
}
export declare const executionEngine: ExecutionEngine;
//# sourceMappingURL=ExecutionEngine.d.ts.map