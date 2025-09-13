/**
 * Comprehensive Metrics Collection Service for Qflow
 * Implements p99 latency, error budget burn, cache hit ratio, and RPS tracking
 */
import { EventEmitter } from 'events';
export interface MetricPoint {
    timestamp: number;
    value: number;
    labels?: Record<string, string>;
}
export interface MetricSeries {
    name: string;
    points: MetricPoint[];
    metadata: {
        unit: string;
        type: 'counter' | 'gauge' | 'histogram' | 'summary';
        description: string;
    };
}
export interface PercentileMetrics {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    p999: number;
    min: number;
    max: number;
    mean: number;
    count: number;
}
export interface ErrorBudgetMetrics {
    totalRequests: number;
    errorRequests: number;
    errorRate: number;
    errorBudget: number;
    budgetRemaining: number;
    budgetBurnRate: number;
    timeToExhaustion: number;
    sloCompliance: boolean;
}
export interface CacheMetrics {
    cacheName: string;
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
    maxSize: number;
    evictions: number;
    avgResponseTime: number;
}
export interface ThroughputMetrics {
    rps: number;
    rpm: number;
    rph: number;
    totalRequests: number;
    peakRps: number;
    avgRps: number;
}
export interface FlowExecutionMetrics {
    flowId: string;
    executionId: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    stepCount: number;
    completedSteps: number;
    failedSteps: number;
    status: 'running' | 'completed' | 'failed' | 'paused' | 'aborted';
    nodeId: string;
    resourceUsage: {
        cpu: number;
        memory: number;
        network: number;
    };
}
export interface ValidationPipelineMetrics {
    operationId: string;
    totalDuration: number;
    layerMetrics: Record<string, {
        duration: number;
        success: boolean;
        cacheHit: boolean;
        errorType?: string;
    }>;
    overallSuccess: boolean;
    cacheHitRate: number;
}
export declare class ComprehensiveMetricsService extends EventEmitter {
    private metricSeries;
    private histograms;
    private counters;
    private gauges;
    private cacheMetrics;
    private errorBudgets;
    private flowMetrics;
    private validationMetrics;
    private aggregationIntervals;
    private config;
    constructor(options?: any);
    /**
     * Record a metric point
     */
    recordMetric(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Record latency metric and calculate percentiles
     */
    recordLatency(operation: string, latency: number, labels?: Record<string, string>): void;
    /**
     * Record request and calculate throughput
     */
    recordRequest(operation: string, success: boolean, labels?: Record<string, string>): void;
    /**
     * Record cache operation
     */
    recordCacheOperation(cacheName: string, hit: boolean, responseTime: number): void;
    /**
     * Record flow execution metrics
     */
    recordFlowExecution(metrics: FlowExecutionMetrics): void;
    /**
     * Record validation pipeline metrics
     */
    recordValidationPipeline(metrics: ValidationPipelineMetrics): void;
    /**
     * Get percentile metrics for an operation
     */
    getPercentileMetrics(operation: string): PercentileMetrics | null;
    /**
     * Get error budget status
     */
    getErrorBudgetStatus(operation: string): ErrorBudgetMetrics | null;
    /**
     * Get cache metrics
     */
    getCacheMetrics(cacheName?: string): CacheMetrics[];
    /**
     * Get throughput metrics
     */
    getThroughputMetrics(operation: string): ThroughputMetrics;
    /**
     * Get comprehensive system metrics
     */
    getSystemMetrics(): {
        latency: Record<string, PercentileMetrics>;
        throughput: Record<string, ThroughputMetrics>;
        errorBudgets: Record<string, ErrorBudgetMetrics>;
        caches: Record<string, CacheMetrics>;
        flows: {
            active: number;
            completed: number;
            failed: number;
            avgDuration: number;
        };
        validation: {
            totalOperations: number;
            avgDuration: number;
            cacheHitRate: number;
            successRate: number;
        };
    };
    /**
     * Get metric history
     */
    getMetricHistory(name: string, timeRange?: number): MetricPoint[];
    /**
     * Export metrics in Prometheus format
     */
    exportPrometheusMetrics(): string;
    /**
     * Private methods
     */
    private initializeDefaultMetrics;
    private createMetricSeries;
    private incrementCounter;
    private calculatePercentiles;
    private percentile;
    private calculateRPS;
    private updateErrorBudget;
    private getRecentErrorRate;
    private cleanupSeries;
    private startAggregation;
    private performAggregation;
}
export default ComprehensiveMetricsService;
//# sourceMappingURL=ComprehensiveMetricsService.d.ts.map