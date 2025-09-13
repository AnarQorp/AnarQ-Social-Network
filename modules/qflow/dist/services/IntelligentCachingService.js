/**
 * Intelligent Caching Service for Qflow
 * Provides advanced caching with invalidation strategies and predictive caching
 */
import { EventEmitter } from 'events';
/**
 * Intelligent Caching Service with predictive capabilities
 */
export class IntelligentCachingService extends EventEmitter {
    flowCache = new Map();
    validationCache = new Map();
    genericCache = new Map();
    stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalRequests: 0
    };
    usagePatterns = new Map();
    cleanupTimer = null;
    predictionTimer = null;
    config;
    constructor(config = {}) {
        super();
        this.config = {
            maxSize: 100 * 1024 * 1024, // 100MB
            maxEntries: 10000,
            defaultTTL: 30 * 60 * 1000, // 30 minutes
            cleanupInterval: 5 * 60 * 1000, // 5 minutes
            enablePredictive: true,
            enableCompression: false,
            ...config
        };
        this.startCleanupTimer();
        if (this.config.enablePredictive) {
            this.startPredictionTimer();
        }
    }
    /**
     * Cache flow definitions with intelligent invalidation
     */
    async cacheFlow(flowId, flow, ttl) {
        const key = `flow:${flowId}`;
        const entry = {
            key,
            value: flow,
            timestamp: Date.now(),
            ttl: ttl || this.config.defaultTTL,
            accessCount: 0,
            lastAccessed: Date.now(),
            size: this.calculateSize(flow),
            tags: ['flow', flow.metadata.category, `owner:${flow.owner}`]
        };
        // Check cache limits
        await this.ensureCacheSpace(entry.size);
        this.flowCache.set(key, entry);
        this.updateUsagePattern(key);
        this.emit('flow_cached', { flowId, size: entry.size });
    }
    /**
     * Get cached flow definition
     */
    async getFlow(flowId) {
        const key = `flow:${flowId}`;
        const entry = this.flowCache.get(key);
        this.stats.totalRequests++;
        if (!entry || this.isExpired(entry)) {
            this.stats.misses++;
            if (entry) {
                this.flowCache.delete(key);
                this.emit('cache_expired', { key, type: 'flow' });
            }
            return null;
        }
        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        this.updateUsagePattern(key);
        this.emit('cache_hit', { key, type: 'flow' });
        return entry.value;
    }
    /**
     * Cache validation results with performance optimization
     */
    async cacheValidationResult(operationHash, result, ttl) {
        const key = `validation:${operationHash}`;
        const entry = {
            key,
            value: result,
            timestamp: Date.now(),
            ttl: ttl || (this.config.defaultTTL / 2), // Shorter TTL for validation results
            accessCount: 0,
            lastAccessed: Date.now(),
            size: this.calculateSize(result),
            tags: ['validation', result.layer, `valid:${result.valid}`]
        };
        await this.ensureCacheSpace(entry.size);
        this.validationCache.set(key, entry);
        this.updateUsagePattern(key);
        this.emit('validation_cached', { operationHash, layer: result.layer, size: entry.size });
    }
    /**
     * Get cached validation result
     */
    async getValidationResult(operationHash) {
        const key = `validation:${operationHash}`;
        const entry = this.validationCache.get(key);
        this.stats.totalRequests++;
        if (!entry || this.isExpired(entry)) {
            this.stats.misses++;
            if (entry) {
                this.validationCache.delete(key);
                this.emit('cache_expired', { key, type: 'validation' });
            }
            return null;
        }
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        this.updateUsagePattern(key);
        this.emit('cache_hit', { key, type: 'validation' });
        return entry.value;
    }
    /**
     * Generic cache for any data type
     */
    async cache(key, value, ttl, tags = []) {
        const entry = {
            key,
            value,
            timestamp: Date.now(),
            ttl: ttl || this.config.defaultTTL,
            accessCount: 0,
            lastAccessed: Date.now(),
            size: this.calculateSize(value),
            tags: ['generic', ...tags]
        };
        await this.ensureCacheSpace(entry.size);
        this.genericCache.set(key, entry);
        this.updateUsagePattern(key);
        this.emit('generic_cached', { key, size: entry.size, tags });
    }
    /**
     * Get cached value
     */
    async get(key) {
        const entry = this.genericCache.get(key);
        this.stats.totalRequests++;
        if (!entry || this.isExpired(entry)) {
            this.stats.misses++;
            if (entry) {
                this.genericCache.delete(key);
                this.emit('cache_expired', { key, type: 'generic' });
            }
            return null;
        }
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        this.stats.hits++;
        this.updateUsagePattern(key);
        this.emit('cache_hit', { key, type: 'generic' });
        return entry.value;
    }
    /**
     * Invalidate cache entries by tags
     */
    async invalidateByTags(tags) {
        let invalidated = 0;
        // Invalidate flow cache
        for (const [key, entry] of this.flowCache) {
            if (tags.some(tag => entry.tags.includes(tag))) {
                this.flowCache.delete(key);
                invalidated++;
                this.emit('cache_invalidated', { key, type: 'flow', tags });
            }
        }
        // Invalidate validation cache
        for (const [key, entry] of this.validationCache) {
            if (tags.some(tag => entry.tags.includes(tag))) {
                this.validationCache.delete(key);
                invalidated++;
                this.emit('cache_invalidated', { key, type: 'validation', tags });
            }
        }
        // Invalidate generic cache
        for (const [key, entry] of this.genericCache) {
            if (tags.some(tag => entry.tags.includes(tag))) {
                this.genericCache.delete(key);
                invalidated++;
                this.emit('cache_invalidated', { key, type: 'generic', tags });
            }
        }
        return invalidated;
    }
    /**
     * Invalidate specific cache entry
     */
    async invalidate(key) {
        const flowKey = `flow:${key}`;
        const validationKey = `validation:${key}`;
        let invalidated = false;
        if (this.flowCache.delete(flowKey)) {
            invalidated = true;
            this.emit('cache_invalidated', { key: flowKey, type: 'flow' });
        }
        if (this.validationCache.delete(validationKey)) {
            invalidated = true;
            this.emit('cache_invalidated', { key: validationKey, type: 'validation' });
        }
        if (this.genericCache.delete(key)) {
            invalidated = true;
            this.emit('cache_invalidated', { key, type: 'generic' });
        }
        return invalidated;
    }
    /**
     * Predictive caching based on usage patterns
     */
    async performPredictiveCaching() {
        if (!this.config.enablePredictive)
            return;
        const now = Date.now();
        const predictions = [];
        for (const [key, pattern] of this.usagePatterns) {
            if (pattern.predictedNextAccess <= now + (5 * 60 * 1000)) { // Within 5 minutes
                predictions.push(key);
            }
        }
        if (predictions.length > 0) {
            this.emit('predictive_cache_triggered', { predictions });
            // This would trigger pre-loading of predicted cache entries
            // Implementation would depend on the specific data sources
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const totalEntries = this.flowCache.size + this.validationCache.size + this.genericCache.size;
        const totalSize = this.calculateTotalSize();
        return {
            totalEntries,
            totalSize,
            hitRate: this.stats.totalRequests > 0 ? this.stats.hits / this.stats.totalRequests : 0,
            missRate: this.stats.totalRequests > 0 ? this.stats.misses / this.stats.totalRequests : 0,
            evictionCount: this.stats.evictions,
            memoryUsage: totalSize / this.config.maxSize
        };
    }
    /**
     * Get usage patterns for analysis
     */
    getUsagePatterns() {
        return Array.from(this.usagePatterns.values());
    }
    /**
     * Clear all caches
     */
    async clearAll() {
        const totalEntries = this.flowCache.size + this.validationCache.size + this.genericCache.size;
        this.flowCache.clear();
        this.validationCache.clear();
        this.genericCache.clear();
        this.usagePatterns.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalRequests: 0
        };
        this.emit('cache_cleared', { entriesCleared: totalEntries });
    }
    /**
     * Shutdown the caching service
     */
    async shutdown() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        if (this.predictionTimer) {
            clearInterval(this.predictionTimer);
            this.predictionTimer = null;
        }
        await this.clearAll();
        this.emit('service_shutdown');
    }
    /**
     * Private helper methods
     */
    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }
    calculateSize(value) {
        // Simple size calculation - in production would use more sophisticated method
        return JSON.stringify(value).length * 2; // Rough estimate for UTF-16
    }
    calculateTotalSize() {
        let totalSize = 0;
        for (const entry of this.flowCache.values()) {
            totalSize += entry.size;
        }
        for (const entry of this.validationCache.values()) {
            totalSize += entry.size;
        }
        for (const entry of this.genericCache.values()) {
            totalSize += entry.size;
        }
        return totalSize;
    }
    async ensureCacheSpace(requiredSize) {
        const currentSize = this.calculateTotalSize();
        const currentEntries = this.flowCache.size + this.validationCache.size + this.genericCache.size;
        // Check size limit
        if (currentSize + requiredSize > this.config.maxSize) {
            await this.evictLRU(requiredSize);
        }
        // Check entry limit
        if (currentEntries >= this.config.maxEntries) {
            await this.evictLRU(0);
        }
    }
    async evictLRU(requiredSize) {
        const allEntries = [];
        // Collect all entries
        for (const [key, entry] of this.flowCache) {
            allEntries.push({ key, entry, cache: this.flowCache });
        }
        for (const [key, entry] of this.validationCache) {
            allEntries.push({ key, entry, cache: this.validationCache });
        }
        for (const [key, entry] of this.genericCache) {
            allEntries.push({ key, entry, cache: this.genericCache });
        }
        // Sort by last accessed (LRU)
        allEntries.sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);
        let freedSize = 0;
        let evicted = 0;
        for (const { key, entry, cache } of allEntries) {
            cache.delete(key);
            freedSize += entry.size;
            evicted++;
            this.stats.evictions++;
            this.emit('cache_evicted', { key, size: entry.size, reason: 'LRU' });
            if (freedSize >= requiredSize && evicted >= 1) {
                break;
            }
        }
    }
    updateUsagePattern(key) {
        const now = Date.now();
        let pattern = this.usagePatterns.get(key);
        if (!pattern) {
            pattern = {
                key,
                frequency: 1,
                lastAccess: now,
                accessTimes: [now],
                predictedNextAccess: now + this.config.defaultTTL
            };
        }
        else {
            pattern.frequency++;
            pattern.lastAccess = now;
            pattern.accessTimes.push(now);
            // Keep only recent access times (last 10)
            if (pattern.accessTimes.length > 10) {
                pattern.accessTimes = pattern.accessTimes.slice(-10);
            }
            // Calculate predicted next access based on frequency
            if (pattern.accessTimes.length >= 2) {
                const intervals = [];
                for (let i = 1; i < pattern.accessTimes.length; i++) {
                    intervals.push(pattern.accessTimes[i] - pattern.accessTimes[i - 1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                pattern.predictedNextAccess = now + avgInterval;
            }
        }
        this.usagePatterns.set(key, pattern);
    }
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    }
    startPredictionTimer() {
        this.predictionTimer = setInterval(() => {
            this.performPredictiveCaching();
        }, 2 * 60 * 1000); // Every 2 minutes
    }
    performCleanup() {
        let cleaned = 0;
        // Clean expired flow cache entries
        for (const [key, entry] of this.flowCache) {
            if (this.isExpired(entry)) {
                this.flowCache.delete(key);
                cleaned++;
                this.emit('cache_expired', { key, type: 'flow' });
            }
        }
        // Clean expired validation cache entries
        for (const [key, entry] of this.validationCache) {
            if (this.isExpired(entry)) {
                this.validationCache.delete(key);
                cleaned++;
                this.emit('cache_expired', { key, type: 'validation' });
            }
        }
        // Clean expired generic cache entries
        for (const [key, entry] of this.genericCache) {
            if (this.isExpired(entry)) {
                this.genericCache.delete(key);
                cleaned++;
                this.emit('cache_expired', { key, type: 'generic' });
            }
        }
        if (cleaned > 0) {
            this.emit('cleanup_completed', { entriesRemoved: cleaned });
        }
    }
}
export default IntelligentCachingService;
//# sourceMappingURL=IntelligentCachingService.js.map