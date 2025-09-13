/**
 * Performance Profiler
 *
 * Provides comprehensive performance profiling and bottleneck identification
 * for Qflow execution, including execution tracing, performance regression
 * detection, and automated optimization recommendations.
 */
import { EventEmitter } from 'events';
import { FlowStep, ExecutionContext } from '../models/FlowDefinition';
export interface ProfilerConfig {
    enableTracing: boolean;
    enableBottleneckDetection: boolean;
    enableRegressionDetection: boolean;
    samplingRate: number;
    maxTraceHistory: number;
    performanceThresholds: PerformanceThresholds;
}
export interface PerformanceThresholds {
    maxExecutionTime: number;
    maxMemoryUsage: number;
    maxCpuUsage: number;
    minThroughput: number;
    maxLatency: number;
}
export interface ExecutionTrace {
    traceId: string;
    flowId: string;
    executionId: string;
    startTime: number;
    endTime?: number;
    steps: StepTrace[];
    totalDuration?: number;
    memoryPeak: number;
    cpuUsage: number;
    bottlenecks: Bottleneck[];
}
export interface StepTrace {
    stepId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    memoryUsage: number;
    cpuUsage: number;
    resourceWaitTime: number;
    validationTime: number;
    executionTime: number;
    status: 'running' | 'completed' | 'failed';
    error?: string;
}
export interface Bottleneck {
    type: 'cpu' | 'memory' | 'io' | 'validation' | 'resource-wait';
    stepId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    impact: number;
    description: string;
    recommendation: string;
}
export interface PerformanceBaseline {
    flowId: string;
    averageDuration: number;
    averageMemoryUsage: number;
    averageCpuUsage: number;
    sampleCount: number;
    lastUpdated: number;
}
export interface FlowPerformanceAnalysis {
    flowId: string;
    executionCount: number;
    averageDuration: number;
    medianDuration: number;
    p95Duration: number;
    p99Duration: number;
    bottlenecks: Bottleneck[];
    recommendations: string[];
    trends: PerformanceTrend[];
}
export interface PerformanceTrend {
    metric: 'duration' | 'memory' | 'cpu' | 'throughput';
    direction: 'improving' | 'degrading' | 'stable';
    changePercent: number;
    confidence: number;
}
export interface OptimizationRecommendation {
    type: 'caching' | 'parallelization' | 'resource-optimization' | 'step-reordering';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expectedImprovement: number;
    implementationComplexity: 'low' | 'medium' | 'high';
    steps: string[];
}
export declare class RegressionDetector {
    private readonly REGRESSION_THRESHOLD;
    private readonly MIN_SAMPLES;
    detectRegression(currentTrace: ExecutionTrace, baseline: PerformanceBaseline): boolean;
    calculateTrend(values: number[]): PerformanceTrend;
}
export declare class PerformanceProfiler extends EventEmitter {
    private config;
    private activeTraces;
    private traceHistory;
    private performanceBaselines;
    private regressionDetector;
    constructor(config: ProfilerConfig);
    /**
     * Start profiling an execution
     */
    startProfiling(flowId: string, executionId: string, context: ExecutionContext): string;
    /**
     * Profile a step execution
     */
    profileStep(traceId: string, step: FlowStep, startTime: number, endTime?: number): void;
    /**
     * Complete profiling for an execution
     */
    completeProfiling(traceId: string): ExecutionTrace | null;
    /**
     * Get performance analysis for a flow
     */
    getFlowAnalysis(flowId: string): FlowPerformanceAnalysis;
    /**
     * Detect bottlenecks in step execution
     */
    private detectStepBottlenecks;
    /**
     * Perform final analysis on completed trace
     */
    private performFinalAnalysis;
    /**
     * Update performance baseline for a flow
     */
    private updatePerformanceBaseline;
    /**
     * Check for performance regressions
     */
    private checkForRegressions;
    /**
     * Analyze flow performance from historical traces
     */
    private analyzeFlowPerformance;
    /**
     * Aggregate bottlenecks from multiple traces
     */
    private aggregateBottlenecks;
    /**
     * Generate optimization recommendations
     */
    private generateOptimizationRecommendations;
    /**
     * Get current memory usage (mock implementation)
     */
    private getCurrentMemoryUsage;
    /**
     * Get current CPU usage (mock implementation)
     */
    private getCurrentCpuUsage;
    /**
     * Get optimization recommendations for a specific flow
     */
    getOptimizationRecommendations(flowId: string): OptimizationRecommendation[];
    /**
     * Export performance data for external analysis
     */
    exportPerformanceData(flowId?: string): any;
    /**
     * Clear performance history
     */
    clearHistory(flowId?: string): void;
}
//# sourceMappingURL=PerformanceProfiler.d.ts.map