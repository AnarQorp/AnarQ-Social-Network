/**
 * Sandbox Security and Isolation Manager
 *
 * Implements network access restrictions, file system isolation,
 * access controls, and sandbox escape detection and prevention
 */
import { EventEmitter } from 'events';
export interface SandboxConfig {
    sandboxId: string;
    executionId: string;
    isolationLevel: 'strict' | 'moderate' | 'permissive';
    networkPolicy: NetworkPolicy;
    filesystemPolicy: FilesystemPolicy;
    systemPolicy: SystemPolicy;
    monitoringConfig: MonitoringConfig;
}
export interface NetworkPolicy {
    allowOutbound: boolean;
    allowInbound: boolean;
    allowedHosts: string[];
    blockedHosts: string[];
    allowedPorts: number[];
    blockedPorts: number[];
    maxConnections: number;
    connectionTimeout: number;
    enableDNS: boolean;
    enableTLS: boolean;
}
export interface FilesystemPolicy {
    allowRead: boolean;
    allowWrite: boolean;
    allowedPaths: string[];
    blockedPaths: string[];
    maxFileSize: number;
    maxTotalSize: number;
    allowTempFiles: boolean;
    tempDirectory?: string;
    readOnlyMode: boolean;
}
export interface SystemPolicy {
    allowSystemCalls: string[];
    blockedSystemCalls: string[];
    allowProcessCreation: boolean;
    allowEnvironmentAccess: boolean;
    allowClockAccess: boolean;
    allowRandomAccess: boolean;
    maxProcesses: number;
}
export interface MonitoringConfig {
    enableSyscallMonitoring: boolean;
    enableNetworkMonitoring: boolean;
    enableFileMonitoring: boolean;
    enableProcessMonitoring: boolean;
    alertThresholds: {
        suspiciousActivity: number;
        resourceUsage: number;
        networkActivity: number;
        fileActivity: number;
    };
}
export interface SecurityViolation {
    violationId: string;
    sandboxId: string;
    type: 'network' | 'filesystem' | 'system' | 'process' | 'escape-attempt';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    details: any;
    timestamp: string;
    action: 'log' | 'block' | 'terminate' | 'quarantine';
    blocked: boolean;
}
export interface SandboxMetrics {
    sandboxId: string;
    uptime: number;
    networkConnections: number;
    filesAccessed: number;
    systemCalls: number;
    processesCreated: number;
    violations: number;
    lastActivity: string;
}
export interface EscapeAttempt {
    attemptId: string;
    sandboxId: string;
    method: 'buffer-overflow' | 'privilege-escalation' | 'syscall-injection' | 'memory-corruption' | 'unknown';
    detected: boolean;
    blocked: boolean;
    evidence: any;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Sandbox Security Manager
 */
export declare class SandboxSecurityManager extends EventEmitter {
    private sandboxes;
    private violations;
    private metrics;
    private escapeAttempts;
    private monitoringIntervals;
    private isRunning;
    private readonly DEFAULT_POLICIES;
    constructor();
    /**
     * Start security manager
     */
    start(): Promise<void>;
    /**
     * Stop security manager
     */
    stop(): Promise<void>;
    /**
     * Create secure sandbox
     */
    createSandbox(executionId: string, isolationLevel?: SandboxConfig['isolationLevel'], customPolicies?: Partial<SandboxConfig>): Promise<string>;
    /**
     * Destroy sandbox
     */
    destroySandbox(sandboxId: string): Promise<void>;
    /**
     * Check network access permission
     */
    checkNetworkAccess(sandboxId: string, host: string, port: number, direction: 'inbound' | 'outbound'): Promise<boolean>;
    /**
     * Check filesystem access permission
     */
    checkFilesystemAccess(sandboxId: string, path: string, operation: 'read' | 'write' | 'execute' | 'delete'): Promise<boolean>;
    /**
     * Check system call permission
     */
    checkSystemCall(sandboxId: string, syscall: string, args?: any[]): Promise<boolean>;
    /**
     * Detect sandbox escape attempts
     */
    detectEscapeAttempt(sandboxId: string, method: EscapeAttempt['method'], evidence: any): Promise<void>;
    /**
     * Get sandbox violations
     */
    getSandboxViolations(sandboxId: string): SecurityViolation[];
    /**
     * Get sandbox metrics
     */
    getSandboxMetrics(sandboxId: string): SandboxMetrics | undefined;
    /**
     * Get all escape attempts
     */
    getEscapeAttempts(): EscapeAttempt[];
    /**
     * Get security summary
     */
    getSecuritySummary(): {
        activeSandboxes: number;
        totalViolations: number;
        escapeAttempts: number;
        criticalViolations: number;
    };
    private setupSecurityMonitoring;
    private startSandboxMonitoring;
    private monitorSandbox;
    private detectSuspiciousActivity;
    private detectSuspiciousSystemCalls;
    private recordViolation;
    private handleViolation;
    private handleEscapeAttempt;
    private getEscapeAttemptSeverity;
    private cleanupSandboxResources;
    private performSecurityAudit;
    private generateSandboxId;
    private generateViolationId;
    private generateAttemptId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const sandboxSecurityManager: SandboxSecurityManager;
//# sourceMappingURL=SandboxSecurityManager.d.ts.map