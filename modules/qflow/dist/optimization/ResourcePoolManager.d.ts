/**
 * Resource Pool Manager
 *
 * Manages pools of reusable resources including WASM runtimes,
 * database connections, and other expensive-to-create resources.
 */
import { EventEmitter } from 'events';
export interface PoolConfig {
    minSize: number;
    maxSize: number;
    maxIdleTime: number;
    healthCheckInterval: number;
    creationTimeout: number;
    acquisitionTimeout: number;
}
export interface ResourceHealth {
    isHealthy: boolean;
    lastCheck: number;
    errorCount: number;
    lastError?: string;
}
export interface PoolStats {
    totalResources: number;
    availableResources: number;
    inUseResources: number;
    createdCount: number;
    destroyedCount: number;
    acquisitionCount: number;
    releaseCount: number;
    healthCheckCount: number;
    averageAcquisitionTime: number;
    averageCreationTime: number;
}
export interface ResourceFactory<T> {
    create(): Promise<T>;
    destroy(resource: T): Promise<void>;
    validate(resource: T): Promise<boolean>;
    reset?(resource: T): Promise<void>;
}
export declare class ResourcePool<T> extends EventEmitter {
    private config;
    private factory;
    private available;
    private inUse;
    private health;
    private stats;
    private acquisitionQueue;
    private healthCheckTimer?;
    private creationPromises;
    constructor(factory: ResourceFactory<T>, config: PoolConfig);
    /**
     * Acquire a resource from the pool
     */
    acquire(): Promise<T>;
    /**
     * Release a resource back to the pool
     */
    release(resource: T): Promise<void>;
    /**
     * Get pool statistics
     */
    getStats(): PoolStats;
    /**
     * Perform health check on all resources
     */
    performHealthCheck(): Promise<void>;
    /**
     * Warm up the pool by creating minimum resources
     */
    warmUp(): Promise<void>;
    /**
     * Drain the pool by destroying all resources
     */
    drain(): Promise<void>;
    /**
     * Resize the pool
     */
    resize(newMinSize: number, newMaxSize: number): Promise<void>;
    private initialize;
    private getAvailableResource;
    private createResource;
    private destroyResource;
    private waitForResource;
    private processAcquisitionQueue;
    private moveToInUse;
    private moveToAvailable;
    private checkResourceHealth;
    private getTotalResourceCount;
    private updateStats;
    private updateAcquisitionTime;
    private updateCreationTime;
    cleanup(): void;
}
/**
 * Resource Pool Manager
 *
 * Manages multiple resource pools and provides a unified interface
 */
export declare class ResourcePoolManager extends EventEmitter {
    private pools;
    private defaultConfigs;
    constructor();
    /**
     * Create a new resource pool
     */
    createPool<T>(name: string, factory: ResourceFactory<T>, config?: Partial<PoolConfig>): ResourcePool<T>;
    /**
     * Get an existing pool
     */
    getPool<T>(name: string): ResourcePool<T> | undefined;
    /**
     * Get all pool statistics
     */
    getAllStats(): Record<string, PoolStats>;
    /**
     * Cleanup all pools
     */
    cleanup(): Promise<void>;
    private initializeDefaultConfigs;
    private getDefaultConfig;
}
//# sourceMappingURL=ResourcePoolManager.d.ts.map