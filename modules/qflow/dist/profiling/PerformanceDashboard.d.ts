/**
 * Performance Dashboard
 *
 * Real-time performance monitoring dashboard with WebSocket streaming,
 * interactive visualizations, and automated alerting for Qflow executions.
 */
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { PerformanceProfiler } from './PerformanceProfiler';
import { AdvancedRegressionDetector } from './RegressionDetector';
import { OptimizationEngine } from './OptimizationEngine';
export interface DashboardConfig {
    enableRealTimeUpdates: boolean;
    updateInterval: number;
    maxDataPoints: number;
    enableAlerts: boolean;
    alertThresholds: AlertThresholds;
}
export interface AlertThresholds {
    criticalLatency: number;
    warningLatency: number;
    criticalMemory: number;
    warningMemory: number;
    criticalErrorRate: number;
    warningErrorRate: number;
}
export interface DashboardMetrics {
    timestamp: number;
    systemMetrics: SystemMetrics;
    flowMetrics: Map<string, FlowMetrics>;
    alerts: DashboardAlert[];
    trends: PerformanceTrends;
}
export interface SystemMetrics {
    totalExecutions: number;
    activeExecutions: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    throughput: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
    nodeCount: number;
    healthyNodes: number;
}
export interface FlowMetrics {
    flowId: string;
    flowName: string;
    executionCount: number;
    averageLatency: number;
    lastExecution: number;
    status: 'healthy' | 'warning' | 'critical';
    errorRate: number;
    throughput: number;
    bottlenecks: string[];
}
export interface DashboardAlert {
    id: string;
    type: 'performance' | 'error' | 'resource' | 'regression';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    flowId?: string;
    timestamp: number;
    acknowledged: boolean;
    autoResolved: boolean;
}
export interface PerformanceTrends {
    latencyTrend: TrendData;
    throughputTrend: TrendData;
    errorRateTrend: TrendData;
    memoryTrend: TrendData;
}
export interface TrendData {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
    dataPoints: DataPoint[];
}
export interface DataPoint {
    timestamp: number;
    value: number;
}
export declare class PerformanceDashboard extends EventEmitter {
    private config;
    private profiler;
    private regressionDetector;
    private optimizationEngine;
    private connectedClients;
    private metricsHistory;
    private alerts;
    private updateTimer;
    constructor(config: DashboardConfig, profiler: PerformanceProfiler, regressionDetector: AdvancedRegressionDetector, optimizationEngine: OptimizationEngine);
    /**
     * Start the dashboard
     */
    start(): void;
    /**
     * Stop the dashboard
     */
    stop(): void;
    /**
     * Add WebSocket client
     */
    addClient(ws: WebSocket): void;
    /**
     * Handle client messages
     */
    private handleClientMessage;
    /**
     * Update metrics and broadcast to clients
     */
    private updateMetrics;
    /**
     * Collect current metrics
     */
    private collectMetrics;
    /**
     * Collect metrics for all flows
     */
    private collectFlowMetrics;
    /**
     * Calculate performance trends
     */
    private calculateTrends;
    /**
     * Calculate trend for a series of data points
     */
    private calculateTrend;
    /**
     * Check for alerts based on current metrics
     */
    private checkAlerts;
    /**
     * Create a new alert
     */
    private createAlert;
    /**
     * Auto-resolve alerts when conditions improve
     */
    private autoResolveAlerts;
    /**
     * Acknowledge an alert
     */
    private acknowledgeAlert;
    /**
     * Send flow analysis to client
     */
    private sendFlowAnalysis;
    /**
     * Send optimization recommendations to client
     */
    private sendOptimizationRecommendations;
    /**
     * Handle flow subscription
     */
    private handleFlowSubscription;
    /**
     * Broadcast message to all connected clients
     */
    private broadcastToClients;
    /**
     * Send message to specific client
     */
    private sendToClient;
    /**
     * Setup event listeners
     */
    private setupEventListeners;
    /**
     * Get current metrics snapshot
     */
    getCurrentMetrics(): DashboardMetrics;
    /**
     * Get metrics history
     */
    getMetricsHistory(limit?: number): DashboardMetrics[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): DashboardAlert[];
    /**
     * Export dashboard data
     */
    exportData(): any;
    private getTotalExecutions;
    private getActiveExecutions;
    private getAverageLatency;
    private getP95Latency;
    private getP99Latency;
    private getThroughput;
    private getErrorRate;
    private getMemoryUsage;
    private getCpuUsage;
    private getNodeCount;
    private getHealthyNodeCount;
}
//# sourceMappingURL=PerformanceDashboard.d.ts.map