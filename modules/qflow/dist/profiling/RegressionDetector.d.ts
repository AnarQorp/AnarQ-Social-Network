/**
 * Performance Regression Detector
 *
 * Advanced regression detection system that uses statistical analysis
 * and machine learning to identify performance degradations in Qflow executions.
 */
import { EventEmitter } from 'events';
import { ExecutionTrace, PerformanceBaseline } from './PerformanceProfiler';
export interface RegressionConfig {
    enableDetection: boolean;
    sensitivityLevel: 'low' | 'medium' | 'high';
    minSampleSize: number;
    confidenceThreshold: number;
    alertThreshold: number;
    windowSize: number;
}
export interface RegressionAlert {
    flowId: string;
    metric: 'duration' | 'memory' | 'cpu' | 'throughput';
    severity: 'warning' | 'critical';
    currentValue: number;
    baselineValue: number;
    regressionPercent: number;
    confidence: number;
    detectedAt: number;
    affectedExecutions: string[];
    possibleCauses: string[];
    recommendations: string[];
}
export interface StatisticalAnalysis {
    mean: number;
    median: number;
    standardDeviation: number;
    variance: number;
    percentiles: {
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
    };
    outliers: number[];
    trend: 'improving' | 'stable' | 'degrading';
    changePoint?: number;
}
export interface AnomalyDetectionResult {
    isAnomaly: boolean;
    anomalyScore: number;
    expectedRange: [number, number];
    actualValue: number;
    confidence: number;
}
export declare class AdvancedRegressionDetector extends EventEmitter {
    private config;
    private performanceHistory;
    private regressionAlerts;
    private statisticalModels;
    constructor(config: RegressionConfig);
    /**
     * Analyze execution for performance regressions
     */
    analyzeExecution(trace: ExecutionTrace, baseline?: PerformanceBaseline): RegressionAlert[];
    /**
     * Perform comprehensive statistical analysis
     */
    private performStatisticalAnalysis;
    /**
     * Detect anomalies using statistical methods
     */
    private detectAnomaly;
    /**
     * Detect change points in time series data
     */
    private detectChangePoint;
    /**
     * Create regression alert
     */
    private createRegressionAlert;
    /**
     * Create change point alert
     */
    private createChangePointAlert;
    /**
     * Identify possible causes of regression
     */
    private identifyPossibleCauses;
    /**
     * Generate recommendations for addressing regression
     */
    private generateRecommendations;
    /**
     * Update performance history
     */
    private updatePerformanceHistory;
    /**
     * Get memory usage history
     */
    private getMemoryHistory;
    /**
     * Calculate percentile
     */
    private calculatePercentile;
    /**
     * Calculate trend using simple linear regression
     */
    private calculateTrend;
    /**
     * Get regression alerts for a flow
     */
    getRegressionAlerts(flowId: string): RegressionAlert[];
    /**
     * Clear regression alerts
     */
    clearRegressionAlerts(flowId?: string): void;
    /**
     * Get performance summary
     */
    getPerformanceSummary(flowId: string): any;
}
//# sourceMappingURL=RegressionDetector.d.ts.map