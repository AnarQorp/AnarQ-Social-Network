/**
 * Resource Pool Manager
 *
 * Manages pools of reusable resources including WASM runtimes,
 * database connections, and other expensive-to-create resources.
 */
import { EventEmitter } from 'events';
export class ResourcePool extends EventEmitter {
    config;
    factory;
    available;
    inUse;
    health;
    stats;
    acquisitionQueue;
    healthCheckTimer;
    creationPromises;
    constructor(factory, config) {
        super();
        this.factory = factory;
        this.config = config;
        this.available = [];
        this.inUse = new Set();
        this.health = new Map();
        this.acquisitionQueue = [];
        this.creationPromises = new Map();
        this.stats = {
            totalResources: 0,
            availableResources: 0,
            inUseResources: 0,
            createdCount: 0,
            destroyedCount: 0,
            acquisitionCount: 0,
            releaseCount: 0,
            healthCheckCount: 0,
            averageAcquisitionTime: 0,
            averageCreationTime: 0
        };
        this.initialize();
    }
    /**
     * Acquire a resource from the pool
     */
    async acquire() {
        const startTime = Date.now();
        this.stats.acquisitionCount++;
        try {
            // Try to get an available healthy resource
            const resource = await this.getAvailableResource();
            if (resource) {
                this.moveToInUse(resource);
                this.updateAcquisitionTime(Date.now() - startTime);
                return resource;
            }
            // Create new resource if under limit
            if (this.getTotalResourceCount() < this.config.maxSize) {
                const newResource = await this.createResource();
                this.moveToInUse(newResource);
                this.updateAcquisitionTime(Date.now() - startTime);
                return newResource;
            }
            // Wait for a resource to become available
            return this.waitForResource(startTime);
        }
        catch (error) {
            this.emit('acquisition_failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Release a resource back to the pool
     */
    async release(resource) {
        if (!this.inUse.has(resource)) {
            this.emit('invalid_release', { resource });
            return;
        }
        this.stats.releaseCount++;
        try {
            // Reset resource if factory supports it
            if (this.factory.reset) {
                await this.factory.reset(resource);
            }
            // Validate resource health
            const isHealthy = await this.factory.validate(resource);
            if (isHealthy) {
                this.moveToAvailable(resource);
                this.processAcquisitionQueue();
            }
            else {
                await this.destroyResource(resource);
            }
            this.emit('resource_released', {
                healthy: isHealthy,
                availableCount: this.available.length
            });
        }
        catch (error) {
            this.emit('release_failed', { error: error.message });
            await this.destroyResource(resource);
        }
    }
    /**
     * Get pool statistics
     */
    getStats() {
        this.updateStats();
        return { ...this.stats };
    }
    /**
     * Perform health check on all resources
     */
    async performHealthCheck() {
        const allResources = [...this.available, ...this.inUse];
        const healthPromises = allResources.map(resource => this.checkResourceHealth(resource));
        await Promise.allSettled(healthPromises);
        this.stats.healthCheckCount++;
        this.emit('health_check_completed', {
            totalChecked: allResources.length,
            healthyCount: Array.from(this.health.values()).filter(h => h.isHealthy).length
        });
    }
    /**
     * Warm up the pool by creating minimum resources
     */
    async warmUp() {
        const targetSize = Math.min(this.config.minSize, this.config.maxSize);
        const createPromises = [];
        for (let i = 0; i < targetSize; i++) {
            createPromises.push(this.createResource());
        }
        try {
            const resources = await Promise.all(createPromises);
            this.available.push(...resources);
            this.emit('pool_warmed', {
                createdCount: resources.length,
                totalResources: this.getTotalResourceCount()
            });
        }
        catch (error) {
            this.emit('warmup_failed', { error: error.message });
        }
    }
    /**
     * Drain the pool by destroying all resources
     */
    async drain() {
        // Wait for all in-use resources to be released (with timeout)
        const drainTimeout = 30000; // 30 seconds
        const startTime = Date.now();
        while (this.inUse.size > 0 && (Date.now() - startTime) < drainTimeout) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Force destroy remaining in-use resources
        const allResources = [...this.available, ...this.inUse];
        const destroyPromises = allResources.map(resource => this.destroyResource(resource));
        await Promise.allSettled(destroyPromises);
        // Clear all collections
        this.available = [];
        this.inUse.clear();
        this.health.clear();
        // Reject any pending acquisitions
        for (const pending of this.acquisitionQueue) {
            pending.reject(new Error('Pool is being drained'));
        }
        this.acquisitionQueue = [];
        this.emit('pool_drained', {
            destroyedCount: allResources.length
        });
    }
    /**
     * Resize the pool
     */
    async resize(newMinSize, newMaxSize) {
        this.config.minSize = newMinSize;
        this.config.maxSize = newMaxSize;
        const currentSize = this.getTotalResourceCount();
        if (currentSize < newMinSize) {
            // Need to create more resources
            const createCount = newMinSize - currentSize;
            const createPromises = [];
            for (let i = 0; i < createCount; i++) {
                createPromises.push(this.createResource());
            }
            const newResources = await Promise.allSettled(createPromises);
            const successful = newResources
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
            this.available.push(...successful);
        }
        else if (currentSize > newMaxSize) {
            // Need to destroy excess resources
            const destroyCount = currentSize - newMaxSize;
            const toDestroy = this.available.splice(0, Math.min(destroyCount, this.available.length));
            const destroyPromises = toDestroy.map(resource => this.destroyResource(resource));
            await Promise.allSettled(destroyPromises);
        }
        this.emit('pool_resized', {
            oldMinSize: this.config.minSize,
            oldMaxSize: this.config.maxSize,
            newMinSize,
            newMaxSize,
            currentSize: this.getTotalResourceCount()
        });
    }
    // Private methods
    async initialize() {
        // Start health check timer
        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck().catch(error => {
                this.emit('health_check_error', { error: error.message });
            });
        }, this.config.healthCheckInterval);
        // Warm up the pool
        await this.warmUp();
        this.emit('pool_initialized', {
            minSize: this.config.minSize,
            maxSize: this.config.maxSize,
            initialSize: this.getTotalResourceCount()
        });
    }
    async getAvailableResource() {
        while (this.available.length > 0) {
            const resource = this.available.pop();
            // Check if resource is healthy
            const health = this.health.get(resource);
            if (health && health.isHealthy) {
                return resource;
            }
            else {
                // Resource is unhealthy, destroy it
                await this.destroyResource(resource);
            }
        }
        return null;
    }
    async createResource() {
        const creationId = `creation_${Date.now()}_${Math.random()}`;
        // Check if already creating
        if (this.creationPromises.has(creationId)) {
            return this.creationPromises.get(creationId);
        }
        const startTime = Date.now();
        const creationPromise = Promise.race([
            this.factory.create(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Resource creation timeout')), this.config.creationTimeout))
        ]);
        this.creationPromises.set(creationId, creationPromise);
        try {
            const resource = await creationPromise;
            // Initialize health tracking
            this.health.set(resource, {
                isHealthy: true,
                lastCheck: Date.now(),
                errorCount: 0
            });
            this.stats.createdCount++;
            this.updateCreationTime(Date.now() - startTime);
            this.emit('resource_created', {
                creationTime: Date.now() - startTime,
                totalResources: this.getTotalResourceCount() + 1
            });
            return resource;
        }
        catch (error) {
            this.emit('creation_failed', { error: error.message });
            throw error;
        }
        finally {
            this.creationPromises.delete(creationId);
        }
    }
    async destroyResource(resource) {
        try {
            // Remove from all collections
            const availableIndex = this.available.indexOf(resource);
            if (availableIndex >= 0) {
                this.available.splice(availableIndex, 1);
            }
            this.inUse.delete(resource);
            this.health.delete(resource);
            // Destroy the resource
            await this.factory.destroy(resource);
            this.stats.destroyedCount++;
            this.emit('resource_destroyed', {
                totalResources: this.getTotalResourceCount()
            });
        }
        catch (error) {
            this.emit('destruction_failed', { error: error.message });
        }
    }
    async waitForResource(startTime) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                // Remove from queue
                const index = this.acquisitionQueue.findIndex(item => item.resolve === resolve);
                if (index >= 0) {
                    this.acquisitionQueue.splice(index, 1);
                }
                reject(new Error('Resource acquisition timeout'));
            }, this.config.acquisitionTimeout);
            this.acquisitionQueue.push({
                resolve: (resource) => {
                    clearTimeout(timeout);
                    this.updateAcquisitionTime(Date.now() - startTime);
                    resolve(resource);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                },
                timestamp: Date.now()
            });
        });
    }
    processAcquisitionQueue() {
        while (this.acquisitionQueue.length > 0 && this.available.length > 0) {
            const pending = this.acquisitionQueue.shift();
            const resource = this.available.pop();
            this.moveToInUse(resource);
            pending.resolve(resource);
        }
    }
    moveToInUse(resource) {
        const index = this.available.indexOf(resource);
        if (index >= 0) {
            this.available.splice(index, 1);
        }
        this.inUse.add(resource);
    }
    moveToAvailable(resource) {
        this.inUse.delete(resource);
        this.available.push(resource);
    }
    async checkResourceHealth(resource) {
        const health = this.health.get(resource);
        if (!health)
            return;
        try {
            const isHealthy = await this.factory.validate(resource);
            health.isHealthy = isHealthy;
            health.lastCheck = Date.now();
            if (!isHealthy) {
                health.errorCount++;
                // Destroy unhealthy resources
                if (health.errorCount >= 3) {
                    await this.destroyResource(resource);
                }
            }
            else {
                health.errorCount = 0;
            }
        }
        catch (error) {
            health.isHealthy = false;
            health.errorCount++;
            health.lastError = error.message;
            if (health.errorCount >= 3) {
                await this.destroyResource(resource);
            }
        }
    }
    getTotalResourceCount() {
        return this.available.length + this.inUse.size;
    }
    updateStats() {
        this.stats.totalResources = this.getTotalResourceCount();
        this.stats.availableResources = this.available.length;
        this.stats.inUseResources = this.inUse.size;
    }
    updateAcquisitionTime(time) {
        const count = this.stats.acquisitionCount;
        this.stats.averageAcquisitionTime =
            ((this.stats.averageAcquisitionTime * (count - 1)) + time) / count;
    }
    updateCreationTime(time) {
        const count = this.stats.createdCount;
        this.stats.averageCreationTime =
            ((this.stats.averageCreationTime * (count - 1)) + time) / count;
    }
    cleanup() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
    }
}
/**
 * Resource Pool Manager
 *
 * Manages multiple resource pools and provides a unified interface
 */
export class ResourcePoolManager extends EventEmitter {
    pools;
    defaultConfigs;
    constructor() {
        super();
        this.pools = new Map();
        this.defaultConfigs = new Map();
        this.initializeDefaultConfigs();
    }
    /**
     * Create a new resource pool
     */
    createPool(name, factory, config) {
        const defaultConfig = this.defaultConfigs.get(name) || this.getDefaultConfig();
        const finalConfig = { ...defaultConfig, ...config };
        const pool = new ResourcePool(factory, finalConfig);
        // Forward pool events
        pool.on('resource_created', (data) => this.emit('pool_resource_created', { pool: name, ...data }));
        pool.on('resource_destroyed', (data) => this.emit('pool_resource_destroyed', { pool: name, ...data }));
        pool.on('acquisition_failed', (data) => this.emit('pool_acquisition_failed', { pool: name, ...data }));
        this.pools.set(name, pool);
        this.emit('pool_created', { name, config: finalConfig });
        return pool;
    }
    /**
     * Get an existing pool
     */
    getPool(name) {
        return this.pools.get(name);
    }
    /**
     * Get all pool statistics
     */
    getAllStats() {
        const stats = {};
        for (const [name, pool] of this.pools.entries()) {
            stats[name] = pool.getStats();
        }
        return stats;
    }
    /**
     * Cleanup all pools
     */
    async cleanup() {
        const drainPromises = Array.from(this.pools.values()).map(pool => pool.drain());
        await Promise.allSettled(drainPromises);
        // Cleanup timers
        for (const pool of this.pools.values()) {
            pool.cleanup();
        }
        this.pools.clear();
        this.emit('all_pools_cleaned');
    }
    initializeDefaultConfigs() {
        // WASM Runtime Pool Config
        this.defaultConfigs.set('wasm', {
            minSize: 2,
            maxSize: 10,
            maxIdleTime: 300000, // 5 minutes
            healthCheckInterval: 60000, // 1 minute
            creationTimeout: 30000, // 30 seconds
            acquisitionTimeout: 10000 // 10 seconds
        });
        // Database Connection Pool Config
        this.defaultConfigs.set('database', {
            minSize: 5,
            maxSize: 20,
            maxIdleTime: 600000, // 10 minutes
            healthCheckInterval: 30000, // 30 seconds
            creationTimeout: 15000, // 15 seconds
            acquisitionTimeout: 5000 // 5 seconds
        });
        // HTTP Connection Pool Config
        this.defaultConfigs.set('http', {
            minSize: 3,
            maxSize: 15,
            maxIdleTime: 300000, // 5 minutes
            healthCheckInterval: 45000, // 45 seconds
            creationTimeout: 10000, // 10 seconds
            acquisitionTimeout: 3000 // 3 seconds
        });
    }
    getDefaultConfig() {
        return {
            minSize: 1,
            maxSize: 5,
            maxIdleTime: 300000,
            healthCheckInterval: 60000,
            creationTimeout: 30000,
            acquisitionTimeout: 10000
        };
    }
}
//# sourceMappingURL=ResourcePoolManager.js.map