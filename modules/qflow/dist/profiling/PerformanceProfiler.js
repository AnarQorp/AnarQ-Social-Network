/**
 * Performance Profiler
 *
 * Provides comprehensive performance profiling and bottleneck identification
 * for Qflow execution, including execution tracing, performance regression
 * detection, and automated optimization recommendations.
 */
import { EventEmitter } from 'events';
export class RegressionDetector {
    REGRESSION_THRESHOLD = 0.15; // 15% performance degradation
    MIN_SAMPLES = 5;
    detectRegression(currentTrace, baseline) {
        if (baseline.sampleCount < this.MIN_SAMPLES) {
            return false;
        }
        const durationRegression = (currentTrace.totalDuration - baseline.averageDuration) / baseline.averageDuration;
        const memoryRegression = (currentTrace.memoryPeak - baseline.averageMemoryUsage) / baseline.averageMemoryUsage;
        return durationRegression > this.REGRESSION_THRESHOLD || memoryRegression > this.REGRESSION_THRESHOLD;
    }
    calculateTrend(values) {
        if (values.length < 3) {
            return {
                metric: 'duration',
                direction: 'stable',
                changePercent: 0,
                confidence: 0
            };
        }
        // Simple linear regression to detect trend
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const changePercent = (slope / (sumY / n)) * 100;
        return {
            metric: 'duration',
            direction: changePercent > 5 ? 'degrading' : changePercent < -5 ? 'improving' : 'stable',
            changePercent: Math.abs(changePercent),
            confidence: Math.min(n / 10, 1) // Confidence increases with sample size
        };
    }
}
export class PerformanceProfiler extends EventEmitter {
    config;
    activeTraces;
    traceHistory;
    performanceBaselines;
    regressionDetector;
    constructor(config) {
        super();
        this.config = config;
        this.activeTraces = new Map();
        this.traceHistory = [];
        this.performanceBaselines = new Map();
        this.regressionDetector = new RegressionDetector();
    }
    /**
     * Start profiling an execution
     */
    startProfiling(flowId, executionId, context) {
        if (!this.config.enableTracing) {
            return '';
        }
        const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const trace = {
            traceId,
            flowId,
            executionId,
            startTime: Date.now(),
            steps: [],
            memoryPeak: 0,
            cpuUsage: 0,
            bottlenecks: []
        };
        this.activeTraces.set(traceId, trace);
        this.emit('profiling_started', {
            traceId,
            flowId,
            executionId,
            timestamp: Date.now()
        });
        return traceId;
    }
    /**
     * Profile a step execution
     */
    profileStep(traceId, step, startTime, endTime) {
        const trace = this.activeTraces.get(traceId);
        if (!trace)
            return;
        const stepTrace = {
            stepId: step.id,
            startTime,
            endTime,
            duration: endTime ? endTime - startTime : undefined,
            memoryUsage: this.getCurrentMemoryUsage(),
            cpuUsage: this.getCurrentCpuUsage(),
            resourceWaitTime: 0,
            validationTime: 0,
            executionTime: 0,
            status: endTime ? 'completed' : 'running'
        };
        // Update or add step trace
        const existingIndex = trace.steps.findIndex(s => s.stepId === step.id);
        if (existingIndex >= 0) {
            trace.steps[existingIndex] = stepTrace;
        }
        else {
            trace.steps.push(stepTrace);
        }
        // Update trace memory peak
        trace.memoryPeak = Math.max(trace.memoryPeak, stepTrace.memoryUsage);
        // Detect bottlenecks if step is completed
        if (endTime && this.config.enableBottleneckDetection) {
            const bottlenecks = this.detectStepBottlenecks(stepTrace, step);
            trace.bottlenecks.push(...bottlenecks);
        }
        this.emit('step_profiled', {
            traceId,
            stepId: step.id,
            duration: stepTrace.duration,
            memoryUsage: stepTrace.memoryUsage
        });
    }
    /**
     * Complete profiling for an execution
     */
    completeProfiling(traceId) {
        const trace = this.activeTraces.get(traceId);
        if (!trace)
            return null;
        trace.endTime = Date.now();
        trace.totalDuration = trace.endTime - trace.startTime;
        // Perform final analysis
        this.performFinalAnalysis(trace);
        // Move to history
        this.traceHistory.push(trace);
        if (this.traceHistory.length > this.config.maxTraceHistory) {
            this.traceHistory.shift();
        }
        this.activeTraces.delete(traceId);
        // Check for performance regressions
        if (this.config.enableRegressionDetection) {
            this.checkForRegressions(trace);
        }
        this.emit('profiling_completed', {
            traceId,
            flowId: trace.flowId,
            totalDuration: trace.totalDuration,
            bottleneckCount: trace.bottlenecks.length,
            memoryPeak: trace.memoryPeak
        });
        return trace;
    }
    /**
     * Get performance analysis for a flow
     */
    getFlowAnalysis(flowId) {
        const flowTraces = this.traceHistory.filter(t => t.flowId === flowId);
        if (flowTraces.length === 0) {
            return {
                flowId,
                executionCount: 0,
                averageDuration: 0,
                medianDuration: 0,
                p95Duration: 0,
                p99Duration: 0,
                bottlenecks: [],
                recommendations: ['No execution history available for analysis'],
                trends: []
            };
        }
        const analysis = this.analyzeFlowPerformance(flowTraces);
        return analysis;
    }
    /**
     * Detect bottlenecks in step execution
     */
    detectStepBottlenecks(stepTrace, step) {
        const bottlenecks = [];
        const duration = stepTrace.duration || 0;
        // CPU bottleneck detection
        if (stepTrace.cpuUsage > 90) {
            bottlenecks.push({
                type: 'cpu',
                stepId: step.id,
                severity: stepTrace.cpuUsage > 95 ? 'critical' : 'high',
                impact: stepTrace.cpuUsage / 100,
                description: `High CPU usage (${stepTrace.cpuUsage}%) in step ${step.id}`,
                recommendation: 'Consider optimizing step logic or using parallel execution'
            });
        }
        // Memory bottleneck detection
        if (stepTrace.memoryUsage > this.config.performanceThresholds.maxMemoryUsage * 0.8) {
            bottlenecks.push({
                type: 'memory',
                stepId: step.id,
                severity: stepTrace.memoryUsage > this.config.performanceThresholds.maxMemoryUsage ? 'critical' : 'high',
                impact: stepTrace.memoryUsage / this.config.performanceThresholds.maxMemoryUsage,
                description: `High memory usage (${Math.round(stepTrace.memoryUsage / 1024 / 1024)}MB) in step ${step.id}`,
                recommendation: 'Consider lazy loading or data streaming for large datasets'
            });
        }
        // Validation time bottleneck
        if (stepTrace.validationTime > duration * 0.3) {
            bottlenecks.push({
                type: 'validation',
                stepId: step.id,
                severity: stepTrace.validationTime > duration * 0.5 ? 'high' : 'medium',
                impact: stepTrace.validationTime / duration,
                description: `High validation time (${stepTrace.validationTime}ms) in step ${step.id}`,
                recommendation: 'Consider caching validation results or optimizing validation pipeline'
            });
        }
        // Resource wait time bottleneck
        if (stepTrace.resourceWaitTime > duration * 0.2) {
            bottlenecks.push({
                type: 'resource-wait',
                stepId: step.id,
                severity: stepTrace.resourceWaitTime > duration * 0.4 ? 'high' : 'medium',
                impact: stepTrace.resourceWaitTime / duration,
                description: `High resource wait time (${stepTrace.resourceWaitTime}ms) in step ${step.id}`,
                recommendation: 'Consider resource pooling or pre-allocation strategies'
            });
        }
        return bottlenecks;
    }
    /**
     * Perform final analysis on completed trace
     */
    performFinalAnalysis(trace) {
        // Calculate step execution percentages
        const totalDuration = trace.totalDuration || 0;
        trace.steps.forEach(step => {
            if (step.duration) {
                const percentage = (step.duration / totalDuration) * 100;
                if (percentage > 50) {
                    trace.bottlenecks.push({
                        type: 'cpu',
                        stepId: step.stepId,
                        severity: 'high',
                        impact: percentage / 100,
                        description: `Step ${step.stepId} consumes ${percentage.toFixed(1)}% of total execution time`,
                        recommendation: 'Consider breaking down this step or optimizing its implementation'
                    });
                }
            }
        });
        // Update performance baseline
        this.updatePerformanceBaseline(trace);
    }
    /**
     * Update performance baseline for a flow
     */
    updatePerformanceBaseline(trace) {
        const existing = this.performanceBaselines.get(trace.flowId);
        if (!existing) {
            this.performanceBaselines.set(trace.flowId, {
                flowId: trace.flowId,
                averageDuration: trace.totalDuration || 0,
                averageMemoryUsage: trace.memoryPeak,
                averageCpuUsage: trace.cpuUsage,
                sampleCount: 1,
                lastUpdated: Date.now()
            });
        }
        else {
            // Exponential moving average
            const alpha = 0.1;
            existing.averageDuration = existing.averageDuration * (1 - alpha) + (trace.totalDuration || 0) * alpha;
            existing.averageMemoryUsage = existing.averageMemoryUsage * (1 - alpha) + trace.memoryPeak * alpha;
            existing.averageCpuUsage = existing.averageCpuUsage * (1 - alpha) + trace.cpuUsage * alpha;
            existing.sampleCount++;
            existing.lastUpdated = Date.now();
        }
    }
    /**
     * Check for performance regressions
     */
    checkForRegressions(trace) {
        const baseline = this.performanceBaselines.get(trace.flowId);
        if (!baseline)
            return;
        const hasRegression = this.regressionDetector.detectRegression(trace, baseline);
        if (hasRegression) {
            this.emit('performance_regression', {
                flowId: trace.flowId,
                executionId: trace.executionId,
                currentDuration: trace.totalDuration,
                baselineDuration: baseline.averageDuration,
                regressionPercent: ((trace.totalDuration - baseline.averageDuration) / baseline.averageDuration) * 100,
                timestamp: Date.now()
            });
        }
    }
    /**
     * Analyze flow performance from historical traces
     */
    analyzeFlowPerformance(traces) {
        const durations = traces.map(t => t.totalDuration || 0).filter(d => d > 0);
        if (durations.length === 0) {
            return {
                flowId: traces[0].flowId,
                executionCount: traces.length,
                averageDuration: 0,
                medianDuration: 0,
                p95Duration: 0,
                p99Duration: 0,
                bottlenecks: [],
                recommendations: ['No valid execution durations found'],
                trends: []
            };
        }
        durations.sort((a, b) => a - b);
        const analysis = {
            flowId: traces[0].flowId,
            executionCount: traces.length,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            medianDuration: durations[Math.floor(durations.length / 2)],
            p95Duration: durations[Math.floor(durations.length * 0.95)],
            p99Duration: durations[Math.floor(durations.length * 0.99)],
            bottlenecks: this.aggregateBottlenecks(traces),
            recommendations: [],
            trends: []
        };
        // Calculate trends
        const recentDurations = durations.slice(-10); // Last 10 executions
        analysis.trends.push(this.regressionDetector.calculateTrend(recentDurations));
        // Generate recommendations
        analysis.recommendations = this.generateOptimizationRecommendations(analysis);
        return analysis;
    }
    /**
     * Aggregate bottlenecks from multiple traces
     */
    aggregateBottlenecks(traces) {
        const bottleneckMap = new Map();
        traces.forEach(trace => {
            trace.bottlenecks.forEach(bottleneck => {
                const key = `${bottleneck.type}_${bottleneck.stepId}`;
                const existing = bottleneckMap.get(key);
                if (existing) {
                    existing.impact = Math.max(existing.impact, bottleneck.impact);
                    if (bottleneck.severity === 'critical' ||
                        (bottleneck.severity === 'high' && existing.severity !== 'critical')) {
                        existing.severity = bottleneck.severity;
                    }
                }
                else {
                    bottleneckMap.set(key, { ...bottleneck });
                }
            });
        });
        return Array.from(bottleneckMap.values())
            .sort((a, b) => b.impact - a.impact)
            .slice(0, 10); // Top 10 bottlenecks
    }
    /**
     * Generate optimization recommendations
     */
    generateOptimizationRecommendations(analysis) {
        const recommendations = [];
        // High duration recommendation
        if (analysis.p95Duration > this.config.performanceThresholds.maxExecutionTime) {
            recommendations.push(`Flow execution time (P95: ${analysis.p95Duration}ms) exceeds threshold. Consider parallel execution or step optimization.`);
        }
        // Bottleneck-based recommendations
        analysis.bottlenecks.forEach(bottleneck => {
            if (bottleneck.severity === 'critical' || bottleneck.severity === 'high') {
                recommendations.push(bottleneck.recommendation);
            }
        });
        // Trend-based recommendations
        analysis.trends.forEach(trend => {
            if (trend.direction === 'degrading' && trend.confidence > 0.7) {
                recommendations.push(`Performance is degrading for ${trend.metric} (${trend.changePercent.toFixed(1)}% worse). Investigation recommended.`);
            }
        });
        return recommendations.slice(0, 5); // Top 5 recommendations
    }
    /**
     * Get current memory usage (mock implementation)
     */
    getCurrentMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        return 0;
    }
    /**
     * Get current CPU usage (mock implementation)
     */
    getCurrentCpuUsage() {
        // In a real implementation, this would use system monitoring
        return Math.random() * 100;
    }
    /**
     * Get optimization recommendations for a specific flow
     */
    getOptimizationRecommendations(flowId) {
        const analysis = this.getFlowAnalysis(flowId);
        const recommendations = [];
        // Caching recommendations
        const validationBottlenecks = analysis.bottlenecks.filter(b => b.type === 'validation');
        if (validationBottlenecks.length > 0) {
            recommendations.push({
                type: 'caching',
                priority: 'high',
                description: 'Implement validation result caching to reduce validation overhead',
                expectedImprovement: 0.3,
                implementationComplexity: 'medium',
                steps: [
                    'Implement validation cache with TTL',
                    'Add cache invalidation on policy changes',
                    'Monitor cache hit rates'
                ]
            });
        }
        // Parallelization recommendations
        if (analysis.averageDuration > this.config.performanceThresholds.maxExecutionTime) {
            recommendations.push({
                type: 'parallelization',
                priority: 'high',
                description: 'Parallelize independent steps to reduce execution time',
                expectedImprovement: 0.4,
                implementationComplexity: 'high',
                steps: [
                    'Analyze step dependencies',
                    'Identify parallelizable steps',
                    'Implement parallel execution engine',
                    'Add synchronization points'
                ]
            });
        }
        return recommendations;
    }
    /**
     * Export performance data for external analysis
     */
    exportPerformanceData(flowId) {
        const traces = flowId
            ? this.traceHistory.filter(t => t.flowId === flowId)
            : this.traceHistory;
        return {
            traces,
            baselines: flowId
                ? this.performanceBaselines.get(flowId)
                : Object.fromEntries(this.performanceBaselines),
            exportedAt: Date.now(),
            config: this.config
        };
    }
    /**
     * Clear performance history
     */
    clearHistory(flowId) {
        if (flowId) {
            this.traceHistory = this.traceHistory.filter(t => t.flowId !== flowId);
            this.performanceBaselines.delete(flowId);
        }
        else {
            this.traceHistory = [];
            this.performanceBaselines.clear();
        }
    }
}
//# sourceMappingURL=PerformanceProfiler.js.map