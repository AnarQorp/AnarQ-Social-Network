/**
 * Sandbox Security and Isolation Manager
 *
 * Implements network access restrictions, file system isolation,
 * access controls, and sandbox escape detection and prevention
 */
import { EventEmitter } from 'events';
import { qflowEventEmitter } from '../events/EventEmitter.js';
/**
 * Sandbox Security Manager
 */
export class SandboxSecurityManager extends EventEmitter {
    sandboxes = new Map();
    violations = new Map(); // sandboxId -> violations
    metrics = new Map();
    escapeAttempts = [];
    monitoringIntervals = new Map();
    isRunning = false;
    // Default security policies
    DEFAULT_POLICIES = {
        strict: {
            network: {
                allowOutbound: false,
                allowInbound: false,
                allowedHosts: [],
                blockedHosts: ['*'],
                allowedPorts: [],
                blockedPorts: [22, 23, 25, 53, 80, 443, 993, 995],
                maxConnections: 0,
                connectionTimeout: 5000,
                enableDNS: false,
                enableTLS: false
            },
            filesystem: {
                allowRead: false,
                allowWrite: false,
                allowedPaths: ['/tmp/sandbox'],
                blockedPaths: ['/', '/etc', '/usr', '/var', '/home'],
                maxFileSize: 1024 * 1024, // 1MB
                maxTotalSize: 10 * 1024 * 1024, // 10MB
                allowTempFiles: true,
                tempDirectory: '/tmp/sandbox',
                readOnlyMode: true
            },
            system: {
                allowSystemCalls: ['read', 'write', 'open', 'close', 'mmap', 'munmap'],
                blockedSystemCalls: ['exec', 'fork', 'clone', 'socket', 'bind', 'connect'],
                allowProcessCreation: false,
                allowEnvironmentAccess: false,
                allowClockAccess: true,
                allowRandomAccess: true,
                maxProcesses: 1
            }
        }
    };
    constructor() {
        super();
        this.setupSecurityMonitoring();
    }
    /**
     * Start security manager
     */
    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        console.log('[SandboxSecurityManager] Started sandbox security management');
        // Emit started event
        await qflowEventEmitter.emit('q.qflow.sandbox.security.started.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-sandbox-security',
            actor: 'system',
            data: {
                activeSandboxes: this.sandboxes.size
            }
        });
    }
    /**
     * Stop security manager
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        // Stop all monitoring
        for (const interval of this.monitoringIntervals.values()) {
            clearInterval(interval);
        }
        this.monitoringIntervals.clear();
        console.log('[SandboxSecurityManager] Stopped sandbox security management');
    }
    /**
     * Create secure sandbox
     */
    async createSandbox(executionId, isolationLevel = 'strict', customPolicies) {
        const sandboxId = this.generateSandboxId();
        // Create sandbox configuration
        const config = {
            sandboxId,
            executionId,
            isolationLevel,
            networkPolicy: { ...this.DEFAULT_POLICIES.strict.network },
            filesystemPolicy: { ...this.DEFAULT_POLICIES.strict.filesystem },
            systemPolicy: { ...this.DEFAULT_POLICIES.strict.system },
            monitoringConfig: {
                enableSyscallMonitoring: true,
                enableNetworkMonitoring: true,
                enableFileMonitoring: true,
                enableProcessMonitoring: true,
                alertThresholds: {
                    suspiciousActivity: 10,
                    resourceUsage: 80,
                    networkActivity: 5,
                    fileActivity: 20
                }
            },
            ...customPolicies
        };
        // Store sandbox configuration
        this.sandboxes.set(sandboxId, config);
        this.violations.set(sandboxId, []);
        // Initialize metrics
        this.metrics.set(sandboxId, {
            sandboxId,
            uptime: 0,
            networkConnections: 0,
            filesAccessed: 0,
            systemCalls: 0,
            processesCreated: 0,
            violations: 0,
            lastActivity: new Date().toISOString()
        });
        // Start monitoring
        await this.startSandboxMonitoring(sandboxId);
        console.log(`[SandboxSecurityManager] Created sandbox: ${sandboxId} (isolation: ${isolationLevel})`);
        // Emit sandbox created event
        await qflowEventEmitter.emit('q.qflow.sandbox.created.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-sandbox-security',
            actor: 'system',
            data: {
                sandboxId,
                executionId,
                isolationLevel
            }
        });
        return sandboxId;
    }
    /**
     * Destroy sandbox
     */
    async destroySandbox(sandboxId) {
        const config = this.sandboxes.get(sandboxId);
        if (!config) {
            return;
        }
        // Stop monitoring
        const interval = this.monitoringIntervals.get(sandboxId);
        if (interval) {
            clearInterval(interval);
            this.monitoringIntervals.delete(sandboxId);
        }
        // Cleanup resources
        await this.cleanupSandboxResources(sandboxId);
        // Remove from maps
        this.sandboxes.delete(sandboxId);
        this.violations.delete(sandboxId);
        this.metrics.delete(sandboxId);
        console.log(`[SandboxSecurityManager] Destroyed sandbox: ${sandboxId}`);
        // Emit sandbox destroyed event
        await qflowEventEmitter.emit('q.qflow.sandbox.destroyed.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-sandbox-security',
            actor: 'system',
            data: {
                sandboxId,
                executionId: config.executionId
            }
        });
    }
    /**
     * Check network access permission
     */
    async checkNetworkAccess(sandboxId, host, port, direction) {
        const config = this.sandboxes.get(sandboxId);
        if (!config) {
            return false;
        }
        const policy = config.networkPolicy;
        // Check direction
        if (direction === 'outbound' && !policy.allowOutbound) {
            await this.recordViolation(sandboxId, {
                type: 'network',
                severity: 'medium',
                description: `Outbound network access denied to ${host}:${port}`,
                details: { host, port, direction },
                action: 'block'
            });
            return false;
        }
        if (direction === 'inbound' && !policy.allowInbound) {
            await this.recordViolation(sandboxId, {
                type: 'network',
                severity: 'medium',
                description: `Inbound network access denied from ${host}:${port}`,
                details: { host, port, direction },
                action: 'block'
            });
            return false;
        }
        // Check blocked hosts
        if (policy.blockedHosts.includes(host) || policy.blockedHosts.includes('*')) {
            await this.recordViolation(sandboxId, {
                type: 'network',
                severity: 'high',
                description: `Access to blocked host: ${host}`,
                details: { host, port, direction },
                action: 'block'
            });
            return false;
        }
        // Check blocked ports
        if (policy.blockedPorts.includes(port)) {
            await this.recordViolation(sandboxId, {
                type: 'network',
                severity: 'high',
                description: `Access to blocked port: ${port}`,
                details: { host, port, direction },
                action: 'block'
            });
            return false;
        }
        // Check allowed hosts (if specified)
        if (policy.allowedHosts.length > 0 && !policy.allowedHosts.includes(host)) {
            await this.recordViolation(sandboxId, {
                type: 'network',
                severity: 'medium',
                description: `Access to non-whitelisted host: ${host}`,
                details: { host, port, direction },
                action: 'block'
            });
            return false;
        }
        // Check allowed ports (if specified)
        if (policy.allowedPorts.length > 0 && !policy.allowedPorts.includes(port)) {
            await this.recordViolation(sandboxId, {
                type: 'network',
                severity: 'medium',
                description: `Access to non-whitelisted port: ${port}`,
                details: { host, port, direction },
                action: 'block'
            });
            return false;
        }
        // Check connection limits
        const metrics = this.metrics.get(sandboxId);
        if (metrics && metrics.networkConnections >= policy.maxConnections) {
            await this.recordViolation(sandboxId, {
                type: 'network',
                severity: 'medium',
                description: `Network connection limit exceeded: ${metrics.networkConnections}/${policy.maxConnections}`,
                details: { host, port, direction, currentConnections: metrics.networkConnections },
                action: 'block'
            });
            return false;
        }
        // Update metrics
        if (metrics) {
            metrics.networkConnections++;
            metrics.lastActivity = new Date().toISOString();
        }
        return true;
    }
    /**
     * Check filesystem access permission
     */
    async checkFilesystemAccess(sandboxId, path, operation) {
        const config = this.sandboxes.get(sandboxId);
        if (!config) {
            return false;
        }
        const policy = config.filesystemPolicy;
        // Check operation permissions
        if (operation === 'read' && !policy.allowRead) {
            await this.recordViolation(sandboxId, {
                type: 'filesystem',
                severity: 'medium',
                description: `File read access denied: ${path}`,
                details: { path, operation },
                action: 'block'
            });
            return false;
        }
        if ((operation === 'write' || operation === 'delete') && !policy.allowWrite) {
            await this.recordViolation(sandboxId, {
                type: 'filesystem',
                severity: 'high',
                description: `File write/delete access denied: ${path}`,
                details: { path, operation },
                action: 'block'
            });
            return false;
        }
        // Check blocked paths
        for (const blockedPath of policy.blockedPaths) {
            if (path.startsWith(blockedPath)) {
                await this.recordViolation(sandboxId, {
                    type: 'filesystem',
                    severity: 'critical',
                    description: `Access to blocked path: ${path}`,
                    details: { path, operation, blockedPath },
                    action: 'block'
                });
                return false;
            }
        }
        // Check allowed paths (if specified)
        if (policy.allowedPaths.length > 0) {
            const isAllowed = policy.allowedPaths.some(allowedPath => path.startsWith(allowedPath));
            if (!isAllowed) {
                await this.recordViolation(sandboxId, {
                    type: 'filesystem',
                    severity: 'high',
                    description: `Access to non-whitelisted path: ${path}`,
                    details: { path, operation },
                    action: 'block'
                });
                return false;
            }
        }
        // Update metrics
        const metrics = this.metrics.get(sandboxId);
        if (metrics) {
            metrics.filesAccessed++;
            metrics.lastActivity = new Date().toISOString();
        }
        return true;
    }
    /**
     * Check system call permission
     */
    async checkSystemCall(sandboxId, syscall, args) {
        const config = this.sandboxes.get(sandboxId);
        if (!config) {
            return false;
        }
        const policy = config.systemPolicy;
        // Check blocked system calls
        if (policy.blockedSystemCalls.includes(syscall)) {
            await this.recordViolation(sandboxId, {
                type: 'system',
                severity: 'critical',
                description: `Blocked system call attempted: ${syscall}`,
                details: { syscall, args },
                action: 'block'
            });
            return false;
        }
        // Check allowed system calls (if specified)
        if (policy.allowSystemCalls.length > 0 && !policy.allowSystemCalls.includes(syscall)) {
            await this.recordViolation(sandboxId, {
                type: 'system',
                severity: 'high',
                description: `Non-whitelisted system call attempted: ${syscall}`,
                details: { syscall, args },
                action: 'block'
            });
            return false;
        }
        // Check for suspicious patterns
        await this.detectSuspiciousSystemCalls(sandboxId, syscall, args);
        // Update metrics
        const metrics = this.metrics.get(sandboxId);
        if (metrics) {
            metrics.systemCalls++;
            metrics.lastActivity = new Date().toISOString();
        }
        return true;
    }
    /**
     * Detect sandbox escape attempts
     */
    async detectEscapeAttempt(sandboxId, method, evidence) {
        const attemptId = this.generateAttemptId();
        const escapeAttempt = {
            attemptId,
            sandboxId,
            method,
            detected: true,
            blocked: true, // Assume blocked for now
            evidence,
            timestamp: new Date().toISOString(),
            severity: this.getEscapeAttemptSeverity(method)
        };
        this.escapeAttempts.push(escapeAttempt);
        console.warn(`[SandboxSecurityManager] Escape attempt detected: ${sandboxId} (${method})`);
        // Record as critical violation
        await this.recordViolation(sandboxId, {
            type: 'escape-attempt',
            severity: 'critical',
            description: `Sandbox escape attempt detected: ${method}`,
            details: { method, evidence, attemptId },
            action: 'terminate'
        });
        // Emit escape attempt event
        await qflowEventEmitter.emit('q.qflow.sandbox.escape.detected.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-sandbox-security',
            actor: 'system',
            data: {
                sandboxId,
                attemptId,
                method,
                severity: escapeAttempt.severity,
                blocked: escapeAttempt.blocked
            }
        });
        // Take immediate action
        await this.handleEscapeAttempt(sandboxId, escapeAttempt);
    }
    /**
     * Get sandbox violations
     */
    getSandboxViolations(sandboxId) {
        return this.violations.get(sandboxId) || [];
    }
    /**
     * Get sandbox metrics
     */
    getSandboxMetrics(sandboxId) {
        return this.metrics.get(sandboxId);
    }
    /**
     * Get all escape attempts
     */
    getEscapeAttempts() {
        return [...this.escapeAttempts];
    }
    /**
     * Get security summary
     */
    getSecuritySummary() {
        let totalViolations = 0;
        let criticalViolations = 0;
        for (const violations of this.violations.values()) {
            totalViolations += violations.length;
            criticalViolations += violations.filter(v => v.severity === 'critical').length;
        }
        return {
            activeSandboxes: this.sandboxes.size,
            totalViolations,
            escapeAttempts: this.escapeAttempts.length,
            criticalViolations
        };
    }
    // Private methods
    setupSecurityMonitoring() {
        // Set up global security monitoring
        setInterval(() => {
            this.performSecurityAudit();
        }, 60000); // Every minute
    }
    async startSandboxMonitoring(sandboxId) {
        const interval = setInterval(async () => {
            await this.monitorSandbox(sandboxId);
        }, 5000); // Every 5 seconds
        this.monitoringIntervals.set(sandboxId, interval);
    }
    async monitorSandbox(sandboxId) {
        const config = this.sandboxes.get(sandboxId);
        const metrics = this.metrics.get(sandboxId);
        if (!config || !metrics) {
            return;
        }
        // Update uptime
        metrics.uptime += 5000; // 5 seconds
        // Check for suspicious activity patterns
        await this.detectSuspiciousActivity(sandboxId);
        // Emit monitoring event
        await qflowEventEmitter.emit('q.qflow.sandbox.monitored.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-sandbox-security',
            actor: 'system',
            data: {
                sandboxId,
                metrics: { ...metrics }
            }
        });
    }
    async detectSuspiciousActivity(sandboxId) {
        const violations = this.violations.get(sandboxId) || [];
        const metrics = this.metrics.get(sandboxId);
        const config = this.sandboxes.get(sandboxId);
        if (!metrics || !config) {
            return;
        }
        const thresholds = config.monitoringConfig.alertThresholds;
        // Check for rapid violation accumulation
        const recentViolations = violations.filter(v => {
            const violationTime = new Date(v.timestamp).getTime();
            const now = Date.now();
            return (now - violationTime) < 60000; // Last minute
        });
        if (recentViolations.length >= thresholds.suspiciousActivity) {
            await this.recordViolation(sandboxId, {
                type: 'system',
                severity: 'high',
                description: `Suspicious activity detected: ${recentViolations.length} violations in last minute`,
                details: { recentViolations: recentViolations.length, threshold: thresholds.suspiciousActivity },
                action: 'log'
            });
        }
        // Check for excessive network activity
        if (metrics.networkConnections >= thresholds.networkActivity) {
            await this.recordViolation(sandboxId, {
                type: 'network',
                severity: 'medium',
                description: `Excessive network activity: ${metrics.networkConnections} connections`,
                details: { connections: metrics.networkConnections, threshold: thresholds.networkActivity },
                action: 'log'
            });
        }
        // Check for excessive file activity
        if (metrics.filesAccessed >= thresholds.fileActivity) {
            await this.recordViolation(sandboxId, {
                type: 'filesystem',
                severity: 'medium',
                description: `Excessive file activity: ${metrics.filesAccessed} files accessed`,
                details: { filesAccessed: metrics.filesAccessed, threshold: thresholds.fileActivity },
                action: 'log'
            });
        }
    }
    async detectSuspiciousSystemCalls(sandboxId, syscall, args) {
        // Detect patterns that might indicate escape attempts
        const suspiciousPatterns = [
            { syscall: 'mmap', pattern: 'executable-memory' },
            { syscall: 'mprotect', pattern: 'permission-change' },
            { syscall: 'ptrace', pattern: 'process-debugging' },
            { syscall: 'prctl', pattern: 'privilege-manipulation' }
        ];
        for (const pattern of suspiciousPatterns) {
            if (syscall === pattern.syscall) {
                await this.recordViolation(sandboxId, {
                    type: 'system',
                    severity: 'high',
                    description: `Suspicious system call pattern: ${pattern.pattern}`,
                    details: { syscall, args, pattern: pattern.pattern },
                    action: 'log'
                });
                // Check if this might be an escape attempt
                if (pattern.pattern === 'executable-memory' || pattern.pattern === 'privilege-manipulation') {
                    await this.detectEscapeAttempt(sandboxId, 'privilege-escalation', {
                        syscall,
                        args,
                        pattern: pattern.pattern
                    });
                }
            }
        }
    }
    async recordViolation(sandboxId, violationData) {
        const violation = {
            violationId: this.generateViolationId(),
            sandboxId,
            timestamp: new Date().toISOString(),
            blocked: violationData.action === 'block' || violationData.action === 'terminate',
            ...violationData
        };
        // Store violation
        const violations = this.violations.get(sandboxId) || [];
        violations.push(violation);
        this.violations.set(sandboxId, violations);
        // Update metrics
        const metrics = this.metrics.get(sandboxId);
        if (metrics) {
            metrics.violations++;
        }
        console.warn(`[SandboxSecurityManager] Security violation: ${sandboxId} - ${violation.description}`);
        // Emit violation event
        await qflowEventEmitter.emit('q.qflow.sandbox.violation.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-sandbox-security',
            actor: 'system',
            data: {
                sandboxId,
                violationId: violation.violationId,
                type: violation.type,
                severity: violation.severity,
                description: violation.description,
                blocked: violation.blocked
            }
        });
        // Take action based on violation
        await this.handleViolation(sandboxId, violation);
    }
    async handleViolation(sandboxId, violation) {
        switch (violation.action) {
            case 'terminate':
                console.error(`[SandboxSecurityManager] Terminating sandbox due to critical violation: ${sandboxId}`);
                await this.destroySandbox(sandboxId);
                break;
            case 'quarantine':
                console.warn(`[SandboxSecurityManager] Quarantining sandbox: ${sandboxId}`);
                // In real implementation, would isolate sandbox further
                break;
            case 'block':
                // Already handled by returning false from permission checks
                break;
            case 'log':
                // Already logged
                break;
        }
    }
    async handleEscapeAttempt(sandboxId, escapeAttempt) {
        switch (escapeAttempt.severity) {
            case 'critical':
                console.error(`[SandboxSecurityManager] Critical escape attempt - terminating sandbox: ${sandboxId}`);
                await this.destroySandbox(sandboxId);
                break;
            case 'high':
                console.warn(`[SandboxSecurityManager] High severity escape attempt - quarantining sandbox: ${sandboxId}`);
                // Quarantine sandbox
                break;
            case 'medium':
            case 'low':
                console.warn(`[SandboxSecurityManager] Escape attempt detected - monitoring increased: ${sandboxId}`);
                // Increase monitoring frequency
                break;
        }
    }
    getEscapeAttemptSeverity(method) {
        switch (method) {
            case 'buffer-overflow':
            case 'memory-corruption':
                return 'critical';
            case 'privilege-escalation':
            case 'syscall-injection':
                return 'high';
            case 'unknown':
                return 'medium';
            default:
                return 'low';
        }
    }
    async cleanupSandboxResources(sandboxId) {
        // In real implementation, would cleanup:
        // - Temporary files
        // - Network connections
        // - Process handles
        // - Memory allocations
        console.log(`[SandboxSecurityManager] Cleaning up resources for sandbox: ${sandboxId}`);
    }
    performSecurityAudit() {
        // Perform periodic security audit
        const summary = this.getSecuritySummary();
        if (summary.criticalViolations > 0) {
            console.warn(`[SandboxSecurityManager] Security audit: ${summary.criticalViolations} critical violations detected`);
        }
        // Emit audit event
        qflowEventEmitter.emit('q.qflow.sandbox.security.audit.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-sandbox-security',
            actor: 'system',
            data: summary
        });
    }
    generateSandboxId() {
        return `sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateViolationId() {
        return `violation_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateAttemptId() {
        return `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        this.sandboxes.clear();
        this.violations.clear();
        this.metrics.clear();
        this.escapeAttempts.length = 0;
        this.removeAllListeners();
    }
}
// Export singleton instance
export const sandboxSecurityManager = new SandboxSecurityManager();
//# sourceMappingURL=SandboxSecurityManager.js.map