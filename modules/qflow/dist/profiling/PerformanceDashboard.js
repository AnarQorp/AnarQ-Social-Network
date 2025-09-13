/**
 * Performance Dashboard
 *
 * Real-time performance monitoring dashboard with WebSocket streaming,
 * interactive visualizations, and automated alerting for Qflow executions.
 */
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
export class PerformanceDashboard extends EventEmitter {
    config;
    profiler;
    regressionDetector;
    optimizationEngine;
    connectedClients;
    metricsHistory;
    alerts;
    updateTimer;
    constructor(config, profiler, regressionDetector, optimizationEngine) {
        super();
        this.config = config;
        this.profiler = profiler;
        this.regressionDetector = regressionDetector;
        this.optimizationEngine = optimizationEngine;
        this.connectedClients = new Set();
        this.metricsHistory = [];
        this.alerts = new Map();
        this.updateTimer = null;
        this.setupEventListeners();
    }
    /**
     * Start the dashboard
     */
    start() {
        if (this.config.enableRealTimeUpdates) {
            this.updateTimer = setInterval(() => {
                this.updateMetrics();
            }, this.config.updateInterval);
        }
        this.emit('dashboard_started', {
            timestamp: Date.now(),
            config: this.config
        });
    }
    /**
     * Stop the dashboard
     */
    stop() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        // Close all WebSocket connections
        this.connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.close();
            }
        });
        this.connectedClients.clear();
        this.emit('dashboard_stopped', {
            timestamp: Date.now()
        });
    }
    /**
     * Add WebSocket client
     */
    addClient(ws) {
        this.connectedClients.add(ws);
        // Send initial data
        this.sendToClient(ws, {
            type: 'initial_data',
            data: this.getCurrentMetrics()
        });
        // Handle client disconnect
        ws.on('close', () => {
            this.connectedClients.delete(ws);
        });
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                this.handleClientMessage(ws, data);
            }
            catch (error) {
                console.error('Error parsing client message:', error);
            }
        });
        this.emit('client_connected', {
            clientCount: this.connectedClients.size,
            timestamp: Date.now()
        });
    }
    /**
     * Handle client messages
     */
    handleClientMessage(ws, message) {
        switch (message.type) {
            case 'subscribe_flow':
                this.handleFlowSubscription(ws, message.flowId);
                break;
            case 'acknowledge_alert':
                this.acknowledgeAlert(message.alertId);
                break;
            case 'request_flow_analysis':
                this.sendFlowAnalysis(ws, message.flowId);
                break;
            case 'request_optimization_recommendations':
                this.sendOptimizationRecommendations(ws, message.flowId);
                break;
            default:
                console.warn('Unknown message type:', message.type);
        }
    }
    /**
     * Update metrics and broadcast to clients
     */
    updateMetrics() {
        const metrics = this.collectMetrics();
        // Store in history
        this.metricsHistory.push(metrics);
        if (this.metricsHistory.length > this.config.maxDataPoints) {
            this.metricsHistory.shift();
        }
        // Check for alerts
        this.checkAlerts(metrics);
        // Broadcast to clients
        this.broadcastToClients({
            type: 'metrics_update',
            data: metrics
        });
        this.emit('metrics_updated', metrics);
    }
    /**
     * Collect current metrics
     */
    collectMetrics() {
        const timestamp = Date.now();
        // Collect system metrics (mock implementation)
        const systemMetrics = {
            totalExecutions: this.getTotalExecutions(),
            activeExecutions: this.getActiveExecutions(),
            averageLatency: this.getAverageLatency(),
            p95Latency: this.getP95Latency(),
            p99Latency: this.getP99Latency(),
            throughput: this.getThroughput(),
            errorRate: this.getErrorRate(),
            memoryUsage: this.getMemoryUsage(),
            cpuUsage: this.getCpuUsage(),
            nodeCount: this.getNodeCount(),
            healthyNodes: this.getHealthyNodeCount()
        };
        // Collect flow metrics
        const flowMetrics = this.collectFlowMetrics();
        // Get current alerts
        const alerts = Array.from(this.alerts.values());
        // Calculate trends
        const trends = this.calculateTrends();
        return {
            timestamp,
            systemMetrics,
            flowMetrics,
            alerts,
            trends
        };
    }
    /**
     * Collect metrics for all flows
     */
    collectFlowMetrics() {
        const flowMetrics = new Map();
        // This would typically iterate through all known flows
        // For now, return empty map
        return flowMetrics;
    }
    /**
     * Calculate performance trends
     */
    calculateTrends() {
        const recentMetrics = this.metricsHistory.slice(-20); // Last 20 data points
        if (recentMetrics.length < 2) {
            return {
                latencyTrend: { direction: 'stable', changePercent: 0, dataPoints: [] },
                throughputTrend: { direction: 'stable', changePercent: 0, dataPoints: [] },
                errorRateTrend: { direction: 'stable', changePercent: 0, dataPoints: [] },
                memoryTrend: { direction: 'stable', changePercent: 0, dataPoints: [] }
            };
        }
        return {
            latencyTrend: this.calculateTrend(recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.systemMetrics.averageLatency }))),
            throughputTrend: this.calculateTrend(recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.systemMetrics.throughput }))),
            errorRateTrend: this.calculateTrend(recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.systemMetrics.errorRate }))),
            memoryTrend: this.calculateTrend(recentMetrics.map(m => ({ timestamp: m.timestamp, value: m.systemMetrics.memoryUsage })))
        };
    }
    /**
     * Calculate trend for a series of data points
     */
    calculateTrend(dataPoints) {
        if (dataPoints.length < 2) {
            return { direction: 'stable', changePercent: 0, dataPoints };
        }
        const first = dataPoints[0].value;
        const last = dataPoints[dataPoints.length - 1].value;
        const changePercent = first !== 0 ? ((last - first) / first) * 100 : 0;
        let direction = 'stable';
        if (Math.abs(changePercent) > 5) {
            direction = changePercent > 0 ? 'up' : 'down';
        }
        return {
            direction,
            changePercent: Math.abs(changePercent),
            dataPoints
        };
    }
    /**
     * Check for alerts based on current metrics
     */
    checkAlerts(metrics) {
        const { systemMetrics } = metrics;
        // Latency alerts
        if (systemMetrics.averageLatency > this.config.alertThresholds.criticalLatency) {
            this.createAlert('performance', 'critical', 'High Latency Detected', `Average latency (${systemMetrics.averageLatency}ms) exceeds critical threshold`);
        }
        else if (systemMetrics.averageLatency > this.config.alertThresholds.warningLatency) {
            this.createAlert('performance', 'warning', 'Elevated Latency', `Average latency (${systemMetrics.averageLatency}ms) exceeds warning threshold`);
        }
        // Memory alerts
        if (systemMetrics.memoryUsage > this.config.alertThresholds.criticalMemory) {
            this.createAlert('resource', 'critical', 'High Memory Usage', `Memory usage (${systemMetrics.memoryUsage}%) exceeds critical threshold`);
        }
        else if (systemMetrics.memoryUsage > this.config.alertThresholds.warningMemory) {
            this.createAlert('resource', 'warning', 'Elevated Memory Usage', `Memory usage (${systemMetrics.memoryUsage}%) exceeds warning threshold`);
        }
        // Error rate alerts
        if (systemMetrics.errorRate > this.config.alertThresholds.criticalErrorRate) {
            this.createAlert('error', 'critical', 'High Error Rate', `Error rate (${systemMetrics.errorRate}%) exceeds critical threshold`);
        }
        else if (systemMetrics.errorRate > this.config.alertThresholds.warningErrorRate) {
            this.createAlert('error', 'warning', 'Elevated Error Rate', `Error rate (${systemMetrics.errorRate}%) exceeds warning threshold`);
        }
        // Auto-resolve alerts if conditions improve
        this.autoResolveAlerts(metrics);
    }
    /**
     * Create a new alert
     */
    createAlert(type, severity, title, message, flowId) {
        const alertId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const alert = {
            id: alertId,
            type,
            severity,
            title,
            message,
            flowId,
            timestamp: Date.now(),
            acknowledged: false,
            autoResolved: false
        };
        this.alerts.set(alertId, alert);
        // Broadcast alert to clients
        this.broadcastToClients({
            type: 'new_alert',
            data: alert
        });
        this.emit('alert_created', alert);
    }
    /**
     * Auto-resolve alerts when conditions improve
     */
    autoResolveAlerts(metrics) {
        const { systemMetrics } = metrics;
        this.alerts.forEach((alert, alertId) => {
            if (alert.acknowledged || alert.autoResolved)
                return;
            let shouldResolve = false;
            switch (alert.type) {
                case 'performance':
                    shouldResolve = systemMetrics.averageLatency < this.config.alertThresholds.warningLatency;
                    break;
                case 'resource':
                    shouldResolve = systemMetrics.memoryUsage < this.config.alertThresholds.warningMemory;
                    break;
                case 'error':
                    shouldResolve = systemMetrics.errorRate < this.config.alertThresholds.warningErrorRate;
                    break;
            }
            if (shouldResolve) {
                alert.autoResolved = true;
                this.broadcastToClients({
                    type: 'alert_resolved',
                    data: { alertId, autoResolved: true }
                });
                this.emit('alert_resolved', { alert, autoResolved: true });
            }
        });
    }
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            this.broadcastToClients({
                type: 'alert_acknowledged',
                data: { alertId }
            });
            this.emit('alert_acknowledged', alert);
        }
    }
    /**
     * Send flow analysis to client
     */
    sendFlowAnalysis(ws, flowId) {
        const analysis = this.profiler.getFlowAnalysis(flowId);
        const regressionAlerts = this.regressionDetector.getRegressionAlerts(flowId);
        this.sendToClient(ws, {
            type: 'flow_analysis',
            data: {
                flowId,
                analysis,
                regressionAlerts,
                timestamp: Date.now()
            }
        });
    }
    /**
     * Send optimization recommendations to client
     */
    sendOptimizationRecommendations(ws, flowId) {
        const recommendations = this.optimizationEngine.getOptimizationRecommendations(flowId);
        const history = this.optimizationEngine.getOptimizationHistory(flowId);
        this.sendToClient(ws, {
            type: 'optimization_recommendations',
            data: {
                flowId,
                recommendations,
                history,
                timestamp: Date.now()
            }
        });
    }
    /**
     * Handle flow subscription
     */
    handleFlowSubscription(ws, flowId) {
        // Store subscription (in a real implementation)
        this.sendToClient(ws, {
            type: 'subscription_confirmed',
            data: { flowId }
        });
    }
    /**
     * Broadcast message to all connected clients
     */
    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageStr);
                }
                catch (error) {
                    console.error('Error sending message to client:', error);
                    this.connectedClients.delete(client);
                }
            }
        });
    }
    /**
     * Send message to specific client
     */
    sendToClient(ws, message) {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(message));
            }
            catch (error) {
                console.error('Error sending message to client:', error);
            }
        }
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for regression alerts
        this.regressionDetector.on('regression_detected', (alert) => {
            this.createAlert('regression', alert.severity, 'Performance Regression', `${alert.metric} regression detected: ${alert.regressionPercent.toFixed(1)}% degradation`, alert.flowId);
        });
        // Listen for profiling events
        this.profiler.on('performance_regression', (data) => {
            this.createAlert('regression', 'critical', 'Performance Regression', `Flow ${data.flowId} showing ${data.regressionPercent.toFixed(1)}% performance degradation`, data.flowId);
        });
    }
    /**
     * Get current metrics snapshot
     */
    getCurrentMetrics() {
        return this.collectMetrics();
    }
    /**
     * Get metrics history
     */
    getMetricsHistory(limit) {
        return limit ? this.metricsHistory.slice(-limit) : this.metricsHistory;
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => !alert.acknowledged && !alert.autoResolved);
    }
    /**
     * Export dashboard data
     */
    exportData() {
        return {
            metricsHistory: this.metricsHistory,
            alerts: Array.from(this.alerts.values()),
            config: this.config,
            exportedAt: Date.now()
        };
    }
    // Mock implementations for system metrics
    getTotalExecutions() { return Math.floor(Math.random() * 10000); }
    getActiveExecutions() { return Math.floor(Math.random() * 100); }
    getAverageLatency() { return Math.floor(Math.random() * 1000) + 100; }
    getP95Latency() { return this.getAverageLatency() * 1.5; }
    getP99Latency() { return this.getAverageLatency() * 2; }
    getThroughput() { return Math.floor(Math.random() * 1000) + 100; }
    getErrorRate() { return Math.random() * 5; }
    getMemoryUsage() { return Math.random() * 100; }
    getCpuUsage() { return Math.random() * 100; }
    getNodeCount() { return Math.floor(Math.random() * 10) + 5; }
    getHealthyNodeCount() { return this.getNodeCount() - Math.floor(Math.random() * 2); }
}
//# sourceMappingURL=PerformanceDashboard.js.map