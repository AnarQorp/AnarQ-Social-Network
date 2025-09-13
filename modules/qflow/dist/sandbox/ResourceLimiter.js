/**
 * Resource Limiting and Monitoring System
 *
 * Implements CPU, memory, and execution time limits for WASM sandbox execution
 * with real-time resource usage monitoring and automatic termination
 */
import { EventEmitter } from 'events';
import { qflowEventEmitter } from '../events/EventEmitter.js';
/**
 * Resource Limiter for WASM sandbox execution
 */
export class ResourceLimiter extends EventEmitter {
    limits;
    config;
    currentUsage;
    violations = [];
    monitoringInterval = null;
    startTime = 0;
    terminated = false;
    throttled = false;
    executionId;
    // Process monitoring (simplified for demo - would use actual process monitoring in production)
    memoryUsage = 0;
    cpuStartTime = 0;
    fileDescriptorCount = 0;
    networkConnectionCount = 0;
    diskUsage = 0;
    constructor(executionId, limits, config = {}) {
        super();
        this.executionId = executionId;
        this.limits = limits;
        this.config = {
            monitoringIntervalMs: 1000, // Monitor every second
            warningThresholdPercent: 80,
            criticalThresholdPercent: 95,
            enableAutoTermination: true,
            enableThrottling: true,
            alertingEnabled: true,
            ...config
        };
        this.currentUsage = {
            memoryUsageMB: 0,
            cpuTimeMs: 0,
            executionTimeMs: 0,
            fileDescriptors: 0,
            networkConnections: 0,
            diskUsageMB: 0,
            timestamp: new Date().toISOString()
        };
        this.startTime = Date.now();
        this.cpuStartTime = process.cpuUsage().user;
    }
    /**
     * Set resource limits
     */
    setLimits(limits) {
        this.limits = { ...this.limits, ...limits };
        console.log(`[ResourceLimiter] Updated limits for execution ${this.executionId}:`, this.limits);
        // Emit limits updated event
        qflowEventEmitter.emit('q.qflow.resource.limits.updated.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-resource-limiter',
            actor: this.executionId,
            data: {
                executionId: this.executionId,
                limits: this.limits
            }
        });
    }
    /**
     * Get current resource usage
     */
    monitorUsage() {
        this.updateCurrentUsage();
        return { ...this.currentUsage };
    }
    /**
     * Start resource monitoring
     */
    startMonitoring() {
        if (this.monitoringInterval) {
            return; // Already monitoring
        }
        this.monitoringInterval = setInterval(() => {
            this.performMonitoringCycle();
        }, this.config.monitoringIntervalMs);
        console.log(`[ResourceLimiter] Started monitoring for execution ${this.executionId}`);
        // Emit monitoring started event
        qflowEventEmitter.emit('q.qflow.resource.monitoring.started.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-resource-limiter',
            actor: this.executionId,
            data: {
                executionId: this.executionId,
                config: this.config
            }
        });
    }
    /**
     * Stop resource monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        console.log(`[ResourceLimiter] Stopped monitoring for execution ${this.executionId}`);
        // Emit monitoring stopped event
        qflowEventEmitter.emit('q.qflow.resource.monitoring.stopped.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-resource-limiter',
            actor: this.executionId,
            data: {
                executionId: this.executionId,
                finalUsage: this.currentUsage,
                violations: this.violations.length
            }
        });
    }
    /**
     * Enforce execution timeout
     */
    async enforceTimeout(timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (!this.terminated) {
                    this.handleViolation({
                        violationId: this.generateViolationId(),
                        type: 'execution_time',
                        limit: timeoutMs,
                        actual: Date.now() - this.startTime,
                        timestamp: new Date().toISOString(),
                        severity: 'critical',
                        action: 'terminate'
                    });
                    reject(new Error(`Execution timeout: ${timeoutMs}ms exceeded`));
                }
            }, timeoutMs);
            // Clear timeout if execution completes normally
            this.once('execution:completed', () => {
                clearTimeout(timeoutId);
                resolve();
            });
        });
    }
    /**
     * Check if execution should be terminated
     */
    shouldTerminate() {
        return this.terminated;
    }
    /**
     * Check if execution should be throttled
     */
    shouldThrottle() {
        return this.throttled;
    }
    /**
     * Get resource violations
     */
    getViolations() {
        return [...this.violations];
    }
    /**
     * Get resource utilization percentage
     */
    getUtilization() {
        return {
            memory: (this.currentUsage.memoryUsageMB / this.limits.maxMemoryMB) * 100,
            cpu: (this.currentUsage.cpuTimeMs / this.limits.maxCpuTimeMs) * 100,
            executionTime: (this.currentUsage.executionTimeMs / this.limits.maxExecutionTimeMs) * 100,
            fileDescriptors: this.limits.maxFileDescriptors
                ? (this.currentUsage.fileDescriptors / this.limits.maxFileDescriptors) * 100
                : 0,
            networkConnections: this.limits.maxNetworkConnections
                ? (this.currentUsage.networkConnections / this.limits.maxNetworkConnections) * 100
                : 0,
            diskUsage: this.limits.maxDiskUsageMB
                ? (this.currentUsage.diskUsageMB / this.limits.maxDiskUsageMB) * 100
                : 0
        };
    }
    /**
     * Simulate memory allocation (for testing)
     */
    allocateMemory(sizeMB) {
        this.memoryUsage += sizeMB;
    }
    /**
     * Simulate file descriptor usage (for testing)
     */
    openFileDescriptor() {
        this.fileDescriptorCount++;
    }
    /**
     * Simulate network connection (for testing)
     */
    openNetworkConnection() {
        this.networkConnectionCount++;
    }
    /**
     * Simulate disk usage (for testing)
     */
    writeToDisk(sizeMB) {
        this.diskUsage += sizeMB;
    }
    /**
     * Mark execution as completed
     */
    markCompleted() {
        this.emit('execution:completed');
        this.stopMonitoring();
    }
    // Private methods
    performMonitoringCycle() {
        try {
            this.updateCurrentUsage();
            this.checkResourceLimits();
            // Emit usage metrics
            qflowEventEmitter.emit('q.qflow.resource.usage.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-resource-limiter',
                actor: this.executionId,
                data: {
                    executionId: this.executionId,
                    usage: this.currentUsage,
                    utilization: this.getUtilization()
                }
            });
        }
        catch (error) {
            console.error(`[ResourceLimiter] Monitoring cycle failed: ${error}`);
        }
    }
    updateCurrentUsage() {
        const now = Date.now();
        const cpuUsage = process.cpuUsage();
        this.currentUsage = {
            memoryUsageMB: this.memoryUsage,
            cpuTimeMs: (cpuUsage.user - this.cpuStartTime) / 1000, // Convert microseconds to milliseconds
            executionTimeMs: now - this.startTime,
            fileDescriptors: this.fileDescriptorCount,
            networkConnections: this.networkConnectionCount,
            diskUsageMB: this.diskUsage,
            timestamp: new Date().toISOString()
        };
    }
    checkResourceLimits() {
        const utilization = this.getUtilization();
        // Check memory limit
        if (this.currentUsage.memoryUsageMB > this.limits.maxMemoryMB) {
            this.handleViolation({
                violationId: this.generateViolationId(),
                type: 'memory',
                limit: this.limits.maxMemoryMB,
                actual: this.currentUsage.memoryUsageMB,
                timestamp: new Date().toISOString(),
                severity: 'critical',
                action: 'terminate'
            });
        }
        else if (utilization.memory > this.config.warningThresholdPercent) {
            this.handleViolation({
                violationId: this.generateViolationId(),
                type: 'memory',
                limit: this.limits.maxMemoryMB,
                actual: this.currentUsage.memoryUsageMB,
                timestamp: new Date().toISOString(),
                severity: 'warning',
                action: utilization.memory > this.config.criticalThresholdPercent ? 'throttle' : 'alert'
            });
        }
        // Check CPU time limit
        if (this.currentUsage.cpuTimeMs > this.limits.maxCpuTimeMs) {
            this.handleViolation({
                violationId: this.generateViolationId(),
                type: 'cpu',
                limit: this.limits.maxCpuTimeMs,
                actual: this.currentUsage.cpuTimeMs,
                timestamp: new Date().toISOString(),
                severity: 'critical',
                action: 'terminate'
            });
        }
        // Check execution time limit
        if (this.currentUsage.executionTimeMs > this.limits.maxExecutionTimeMs) {
            this.handleViolation({
                violationId: this.generateViolationId(),
                type: 'execution_time',
                limit: this.limits.maxExecutionTimeMs,
                actual: this.currentUsage.executionTimeMs,
                timestamp: new Date().toISOString(),
                severity: 'critical',
                action: 'terminate'
            });
        }
        // Check file descriptor limit
        if (this.limits.maxFileDescriptors && this.currentUsage.fileDescriptors > this.limits.maxFileDescriptors) {
            this.handleViolation({
                violationId: this.generateViolationId(),
                type: 'file_descriptors',
                limit: this.limits.maxFileDescriptors,
                actual: this.currentUsage.fileDescriptors,
                timestamp: new Date().toISOString(),
                severity: 'critical',
                action: 'terminate'
            });
        }
        // Check network connection limit
        if (this.limits.maxNetworkConnections && this.currentUsage.networkConnections > this.limits.maxNetworkConnections) {
            this.handleViolation({
                violationId: this.generateViolationId(),
                type: 'network',
                limit: this.limits.maxNetworkConnections,
                actual: this.currentUsage.networkConnections,
                timestamp: new Date().toISOString(),
                severity: 'critical',
                action: 'terminate'
            });
        }
        // Check disk usage limit
        if (this.limits.maxDiskUsageMB && this.currentUsage.diskUsageMB > this.limits.maxDiskUsageMB) {
            this.handleViolation({
                violationId: this.generateViolationId(),
                type: 'disk',
                limit: this.limits.maxDiskUsageMB,
                actual: this.currentUsage.diskUsageMB,
                timestamp: new Date().toISOString(),
                severity: 'critical',
                action: 'terminate'
            });
        }
    }
    handleViolation(violation) {
        this.violations.push(violation);
        console.warn(`[ResourceLimiter] Resource violation detected:`, violation);
        // Emit violation event
        qflowEventEmitter.emit('q.qflow.resource.violation.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-resource-limiter',
            actor: this.executionId,
            data: {
                executionId: this.executionId,
                violation
            }
        });
        // Take action based on violation
        switch (violation.action) {
            case 'terminate':
                if (this.config.enableAutoTermination) {
                    this.terminated = true;
                    this.emit('resource:violation:terminate', violation);
                }
                break;
            case 'throttle':
                if (this.config.enableThrottling) {
                    this.throttled = true;
                    this.emit('resource:violation:throttle', violation);
                }
                break;
            case 'alert':
                if (this.config.alertingEnabled) {
                    this.emit('resource:violation:alert', violation);
                }
                break;
        }
    }
    generateViolationId() {
        return `violation_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopMonitoring();
        this.removeAllListeners();
        this.violations.length = 0;
    }
}
/**
 * Resource Limiter Factory
 */
export class ResourceLimiterFactory {
    static defaultLimits = {
        maxMemoryMB: 128,
        maxCpuTimeMs: 30000,
        maxExecutionTimeMs: 60000,
        maxFileDescriptors: 100,
        maxNetworkConnections: 10,
        maxDiskUsageMB: 50
    };
    static defaultConfig = {
        monitoringIntervalMs: 1000,
        warningThresholdPercent: 80,
        criticalThresholdPercent: 95,
        enableAutoTermination: true,
        enableThrottling: true,
        alertingEnabled: true
    };
    /**
     * Create resource limiter with default settings
     */
    static create(executionId, limits, config) {
        const finalLimits = { ...this.defaultLimits, ...limits };
        const finalConfig = { ...this.defaultConfig, ...config };
        return new ResourceLimiter(executionId, finalLimits, finalConfig);
    }
    /**
     * Create resource limiter for DAO-specific limits
     */
    static createForDAO(executionId, daoSubnet, limits, config) {
        // In real implementation, would fetch DAO-specific limits from governance
        const daoLimits = this.getDaoLimits(daoSubnet);
        const finalLimits = { ...this.defaultLimits, ...daoLimits, ...limits };
        const finalConfig = { ...this.defaultConfig, ...config };
        return new ResourceLimiter(executionId, finalLimits, finalConfig);
    }
    static getDaoLimits(daoSubnet) {
        // Mock DAO-specific limits - in real implementation would fetch from governance
        const daoLimitsMap = {
            'enterprise': {
                maxMemoryMB: 512,
                maxCpuTimeMs: 120000,
                maxExecutionTimeMs: 300000,
                maxFileDescriptors: 500,
                maxNetworkConnections: 50,
                maxDiskUsageMB: 200
            },
            'community': {
                maxMemoryMB: 64,
                maxCpuTimeMs: 15000,
                maxExecutionTimeMs: 30000,
                maxFileDescriptors: 50,
                maxNetworkConnections: 5,
                maxDiskUsageMB: 25
            },
            'developer': {
                maxMemoryMB: 256,
                maxCpuTimeMs: 60000,
                maxExecutionTimeMs: 120000,
                maxFileDescriptors: 200,
                maxNetworkConnections: 20,
                maxDiskUsageMB: 100
            }
        };
        return daoLimitsMap[daoSubnet] || {};
    }
}
//# sourceMappingURL=ResourceLimiter.js.map