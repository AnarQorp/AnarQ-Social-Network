/**
 * Intelligent Caching Service for Qflow
 * Provides advanced caching with invalidation strategies and predictive caching
 */
import { EventEmitter } from 'events';
import { FlowDefinition } from '../models/FlowDefinition.js';
import { ValidationResult } from '../validation/UniversalValidationPipeline.js';
export interface CacheEntry<T> {
    key: string;
    value: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
    tags: string[];
}
export interface CacheStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
    memoryUsage: number;
}
export interface CacheConfig {
    maxSize: number;
    maxEntries: number;
    defaultTTL: number;
    cleanupInterval: number;
    enablePredictive: boolean;
    enableCompression: boolean;
}
export interface UsagePattern {
    key: string;
    frequency: number;
    lastAccess: number;
    accessTimes: number[];
    predictedNextAccess: number;
}
/**
 * Intelligent Caching Service with predictive capabilities
 */
export declare class IntelligentCachingService extends EventEmitter {
    private flowCache;
    private validationCache;
    private genericCache;
    private stats;
    private usagePatterns;
    private cleanupTimer;
    private predictionTimer;
    private config;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Cache flow definitions with intelligent invalidation
     */
    cacheFlow(flowId: string, flow: FlowDefinition, ttl?: number): Promise<void>;
    /**
     * Get cached flow definition
     */
    getFlow(flowId: string): Promise<FlowDefinition | null>;
    /**
     * Cache validation results with performance optimization
     */
    cacheValidationResult(operationHash: string, result: ValidationResult, ttl?: number): Promise<void>;
    /**
     * Get cached validation result
     */
    getValidationResult(operationHash: string): Promise<ValidationResult | null>;
    /**
     * Generic cache for any data type
     */
    cache<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void>;
    /**
     * Get cached value
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Invalidate cache entries by tags
     */
    invalidateByTags(tags: string[]): Promise<number>;
    /**
     * Invalidate specific cache entry
     */
    invalidate(key: string): Promise<boolean>;
    /**
     * Predictive caching based on usage patterns
     */
    performPredictiveCaching(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get usage patterns for analysis
     */
    getUsagePatterns(): UsagePattern[];
    /**
     * Clear all caches
     */
    clearAll(): Promise<void>;
    /**
     * Shutdown the caching service
     */
    shutdown(): Promise<void>;
    /**
     * Private helper methods
     */
    private isExpired;
    private calculateSize;
    private calculateTotalSize;
    private ensureCacheSpace;
    private evictLRU;
    private updateUsagePattern;
    private startCleanupTimer;
    private startPredictionTimer;
    private performCleanup;
}
export default IntelligentCachingService;
//# sourceMappingURL=IntelligentCachingService.d.ts.map