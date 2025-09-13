/**
 * Resource Limiting and Monitoring System
 *
 * Implements CPU, memory, and execution time limits for WASM sandbox execution
 * with real-time resource usage monitoring and automatic termination
 */
import { EventEmitter } from 'events';
export interface ResourceLimits {
    maxMemoryMB: number;
    maxCpuTimeMs: number;
    maxExecutionTimeMs: number;
    maxFileDescriptors?: number;
    maxNetworkConnections?: number;
    maxDiskUsageMB?: number;
}
export interface ResourceUsage {
    memoryUsageMB: number;
    cpuTimeMs: number;
    executionTimeMs: number;
    fileDescriptors: number;
    networkConnections: number;
    diskUsageMB: number;
    timestamp: string;
}
export interface ResourceViolation {
    violationId: string;
    type: 'memory' | 'cpu' | 'execution_time' | 'file_descriptors' | 'network' | 'disk';
    limit: number;
    actual: number;
    timestamp: string;
    severity: 'warning' | 'critical';
    action: 'throttle' | 'terminate' | 'alert';
}
export interface ResourceMonitorConfig {
    monitoringIntervalMs: number;
    warningThresholdPercent: number;
    criticalThresholdPercent: number;
    enableAutoTermination: boolean;
    enableThrottling: boolean;
    alertingEnabled: boolean;
}
/**
 * Resource Limiter for WASM sandbox execution
 */
export declare class ResourceLimiter extends EventEmitter {
    private limits;
    private config;
    private currentUsage;
    private violations;
    private monitoringInterval;
    private startTime;
    private terminated;
    private throttled;
    private executionId;
    private memoryUsage;
    private cpuStartTime;
    private fileDescriptorCount;
    private networkConnectionCount;
    private diskUsage;
    constructor(executionId: string, limits: ResourceLimits, config?: Partial<ResourceMonitorConfig>);
    /**
     * Set resource limits
     */
    setLimits(limits: ResourceLimits): void;
    /**
     * Get current resource usage
     */
    monitorUsage(): ResourceUsage;
    /**
     * Start resource monitoring
     */
    startMonitoring(): void;
    /**
     * Stop resource monitoring
     */
    stopMonitoring(): void;
    /**
     * Enforce execution timeout
     */
    enforceTimeout(timeoutMs: number): Promise<void>;
    /**
     * Check if execution should be terminated
     */
    shouldTerminate(): boolean;
    /**
     * Check if execution should be throttled
     */
    shouldThrottle(): boolean;
    /**
     * Get resource violations
     */
    getViolations(): ResourceViolation[];
    /**
     * Get resource utilization percentage
     */
    getUtilization(): Record<string, number>;
    /**
     * Simulate memory allocation (for testing)
     */
    allocateMemory(sizeMB: number): void;
    /**
     * Simulate file descriptor usage (for testing)
     */
    openFileDescriptor(): void;
    /**
     * Simulate network connection (for testing)
     */
    openNetworkConnection(): void;
    /**
     * Simulate disk usage (for testing)
     */
    writeToDisk(sizeMB: number): void;
    /**
     * Mark execution as completed
     */
    markCompleted(): void;
    private performMonitoringCycle;
    private updateCurrentUsage;
    private checkResourceLimits;
    private handleViolation;
    private generateViolationId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Resource Limiter Factory
 */
export declare class ResourceLimiterFactory {
    private static defaultLimits;
    private static defaultConfig;
    /**
     * Create resource limiter with default settings
     */
    static create(executionId: string, limits?: Partial<ResourceLimits>, config?: Partial<ResourceMonitorConfig>): ResourceLimiter;
    /**
     * Create resource limiter for DAO-specific limits
     */
    static createForDAO(executionId: string, daoSubnet: string, limits?: Partial<ResourceLimits>, config?: Partial<ResourceMonitorConfig>): ResourceLimiter;
    private static getDaoLimits;
}
//# sourceMappingURL=ResourceLimiter.d.ts.map