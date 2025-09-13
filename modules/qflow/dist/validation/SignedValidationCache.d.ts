/**
 * Signed Validation Cache for Qflow Universal Validation Pipeline
 *
 * Implements signed+TTL'd cache keyed by (layer, inputHash, policyVersion)
 * with cache eviction policies and integrity verification.
 * Provides streaming validation pipeline with short-circuit on failure.
 */
import { EventEmitter } from 'events';
import { ValidationResult, ValidationContext } from './UniversalValidationPipeline.js';
export interface CacheKey {
    layer: string;
    inputHash: string;
    policyVersion: string;
}
export interface SignedCacheEntry {
    key: CacheKey;
    result: ValidationResult;
    ttl: number;
    signature: string;
    timestamp: string;
    accessCount: number;
    lastAccessed: string;
    policyVersion: string;
    integrity: {
        checksum: string;
        algorithm: string;
        verified: boolean;
    };
}
export interface CacheEvictionPolicy {
    maxEntries: number;
    defaultTtl: number;
    maxTtl: number;
    evictionStrategy: 'lru' | 'lfu' | 'ttl' | 'hybrid';
    cleanupInterval: number;
    compressionThreshold: number;
}
export interface CacheStatistics {
    totalEntries: number;
    totalHits: number;
    totalMisses: number;
    totalEvictions: number;
    totalIntegrityFailures: number;
    hitRate: number;
    averageAccessTime: number;
    cacheSize: number;
    oldestEntry: string | null;
    newestEntry: string | null;
}
export interface StreamingValidationOptions {
    shortCircuitOnFailure: boolean;
    parallelValidation: boolean;
    maxConcurrency: number;
    timeoutPerLayer: number;
    retryFailedLayers: boolean;
    retryAttempts: number;
}
/**
 * Signed Validation Cache
 * Provides high-performance, integrity-verified caching for validation results
 */
export declare class SignedValidationCache extends EventEmitter {
    private cache;
    private accessOrder;
    private accessFrequency;
    private evictionPolicy;
    private statistics;
    private cleanupTimer;
    private signingKey;
    private isInitialized;
    constructor(evictionPolicy?: Partial<CacheEvictionPolicy>, signingKey?: string);
    /**
     * Initialize the cache
     */
    initialize(): Promise<void>;
    /**
     * Get cached validation result
     */
    get(layer: string, inputData: any, policyVersion: string): Promise<ValidationResult | null>;
    /**
     * Store validation result in cache
     */
    set(layer: string, inputData: any, policyVersion: string, result: ValidationResult, customTtl?: number): Promise<void>;
    /**
     * Streaming validation with cache integration
     */
    streamingValidation(layers: string[], inputData: any, policyVersion: string, validators: Map<string, (data: any, context: ValidationContext) => Promise<ValidationResult>>, context: ValidationContext, options: StreamingValidationOptions): Promise<{
        results: ValidationResult[];
        cacheHits: number;
        cacheMisses: number;
        shortCircuited: boolean;
        totalDuration: number;
    }>;
    /**
     * Clear cache
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStatistics(): CacheStatistics;
    /**
     * Update eviction policy
     */
    updateEvictionPolicy(updates: Partial<CacheEvictionPolicy>): void;
    /**
     * Check if cache is ready
     */
    isReady(): boolean;
    /**
     * Shutdown cache
     */
    shutdown(): Promise<void>;
    /**
     * Hash input data for cache key
     */
    private hashInput;
    /**
     * Generate cache key string
     */
    private generateCacheKeyString;
    /**
     * Create signed cache entry
     */
    private createSignedEntry;
    /**
     * Verify entry integrity
     */
    private verifyEntryIntegrity;
    /**
     * Update access tracking
     */
    private updateAccessTracking;
    /**
     * Update access order for LRU
     */
    private updateAccessOrder;
    /**
     * Remove from access order
     */
    private removeFromAccessOrder;
    /**
     * Enforce eviction policy
     */
    private enforceEvictionPolicy;
    /**
     * Evict least recently used entries
     */
    private evictLRU;
    /**
     * Evict least frequently used entries
     */
    private evictLFU;
    /**
     * Evict entries by TTL (shortest remaining time first)
     */
    private evictByTTL;
    /**
     * Hybrid eviction strategy
     */
    private evictHybrid;
    /**
     * Execute function with timeout
     */
    private executeWithTimeout;
    /**
     * Start cleanup timer
     */
    private startCleanupTimer;
    /**
     * Cleanup expired entries
     */
    private cleanup;
    /**
     * Update statistics
     */
    private updateStatistics;
}
export declare const signedValidationCache: SignedValidationCache;
//# sourceMappingURL=SignedValidationCache.d.ts.map