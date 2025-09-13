/**
 * Performance Profiling Module
 *
 * Comprehensive performance profiling and optimization tools for Qflow,
 * including execution profiling, bottleneck identification, performance
 * regression detection, and automated optimization recommendations.
 */
export { PerformanceProfiler, ProfilerConfig, PerformanceThresholds, ExecutionTrace, StepTrace, Bottleneck, PerformanceBaseline, FlowPerformanceAnalysis, PerformanceTrend, OptimizationRecommendation, RegressionDetector } from './PerformanceProfiler';
export { OptimizationEngine, OptimizationConfig, OptimizationResult, PerformanceMetrics, OptimizationStrategy } from './OptimizationEngine';
export { AdvancedRegressionDetector, RegressionConfig, RegressionAlert, StatisticalAnalysis, AnomalyDetectionResult } from './RegressionDetector';
export { PerformanceDashboard, DashboardConfig, AlertThresholds, DashboardMetrics, SystemMetrics, FlowMetrics, DashboardAlert, PerformanceTrends, TrendData, DataPoint } from './PerformanceDashboard';
/**
 * Factory function to create a complete profiling system
 */
export declare function createProfilingSystem(config: {
    profiler: ProfilerConfig;
    optimization: OptimizationConfig;
    regression: RegressionConfig;
    dashboard: DashboardConfig;
}): {
    profiler: any;
    regressionDetector: any;
    optimizationEngine: any;
    dashboard: any;
};
/**
 * Default configuration for profiling system
 */
export declare const defaultProfilingConfig: {
    profiler: {
        enableTracing: boolean;
        enableBottleneckDetection: boolean;
        enableRegressionDetection: boolean;
        samplingRate: number;
        maxTraceHistory: number;
        performanceThresholds: {
            maxExecutionTime: number;
            maxMemoryUsage: number;
            maxCpuUsage: number;
            minThroughput: number;
            maxLatency: number;
        };
    };
    optimization: {
        enableAutoOptimization: boolean;
        optimizationThreshold: number;
        maxOptimizationAttempts: number;
        learningRate: number;
        confidenceThreshold: number;
    };
    regression: {
        enableDetection: boolean;
        sensitivityLevel: "medium";
        minSampleSize: number;
        confidenceThreshold: number;
        alertThreshold: number;
        windowSize: number;
    };
    dashboard: {
        enableRealTimeUpdates: boolean;
        updateInterval: number;
        maxDataPoints: number;
        enableAlerts: boolean;
        alertThresholds: {
            criticalLatency: number;
            warningLatency: number;
            criticalMemory: number;
            warningMemory: number;
            criticalErrorRate: number;
            warningErrorRate: number;
        };
    };
};
//# sourceMappingURL=index.d.ts.map