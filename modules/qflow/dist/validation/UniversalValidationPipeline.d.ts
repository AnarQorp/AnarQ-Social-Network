/**
 * Qflow Universal Validation Pipeline
 *
 * Decoupled validation component for ecosystem-wide use.
 * Orchestrates validation layers with caching and performance optimization.
 */
import { EventEmitter } from 'events';
export interface ValidationContext {
    requestId: string;
    timestamp: string;
    source: string;
    metadata: Record<string, any>;
}
export interface ValidationLayer {
    layerId: string;
    name: string;
    description: string;
    priority: number;
    required: boolean;
    timeout: number;
}
export interface ValidationRequest {
    context: ValidationContext;
    data: any;
    layers: string[];
    skipCache?: boolean;
    customRules?: Record<string, any>;
}
export interface ValidationResult {
    layerId: string;
    status: 'passed' | 'failed' | 'warning' | 'skipped';
    message: string;
    details?: any;
    duration: number;
    timestamp: string;
    cached?: boolean;
}
export interface PipelineResult {
    requestId: string;
    overallStatus: 'passed' | 'failed' | 'warning';
    results: ValidationResult[];
    totalDuration: number;
    cacheHits: number;
    cacheMisses: number;
    timestamp: string;
    metadata: {
        layersExecuted: number;
        layersSkipped: number;
        layersFailed: number;
        shortCircuited: boolean;
    };
}
export interface CacheEntry {
    key: string;
    result: ValidationResult;
    ttl: number;
    policyVersion: string;
    signature: string;
    timestamp: string;
}
export interface ValidationPolicy {
    version: string;
    layers: ValidationLayer[];
    caching: {
        enabled: boolean;
        defaultTtl: number;
        maxEntries: number;
    };
    execution: {
        shortCircuitOnFailure: boolean;
        parallelExecution: boolean;
        maxConcurrency: number;
    };
    signature: string;
}
/**
 * Universal Validation Pipeline
 * Provides decoupled validation orchestration for the entire ecosystem
 */
export declare class UniversalValidationPipeline extends EventEmitter {
    private layers;
    private validators;
    private cache;
    private signedCache;
    private policy;
    private isInitialized;
    private stats;
    constructor();
    /**
     * Initialize the validation pipeline
     */
    initialize(): Promise<void>;
    /**
     * Register a validation layer
     */
    registerLayer(layer: ValidationLayer, validator: (data: any, context: ValidationContext) => Promise<ValidationResult>): void;
    /**
     * Unregister a validation layer
     */
    unregisterLayer(layerId: string): boolean;
    /**
     * Execute validation pipeline with streaming and signed cache
     */
    validateStreaming(request: ValidationRequest): Promise<PipelineResult>;
    /**
     * Execute validation pipeline (legacy method - uses old cache)
     */
    validate(request: ValidationRequest): Promise<PipelineResult>;
    /**
     * Execute a single validation layer
     */
    private executeLayer;
    /**
     * Execute function with timeout
     */
    private executeWithTimeout;
    /**
     * Get layers to execute in priority order
     */
    private getLayersToExecute;
    /**
     * Determine overall validation status
     */
    private determineOverallStatus;
    /**
     * Generate cache key
     */
    private generateCacheKey;
    /**
     * Get result from cache
     */
    private getFromCache;
    /**
     * Add result to cache
     */
    private addToCache;
    /**
     * Sign cache entry (mock implementation)
     */
    private signCacheEntry;
    /**
     * Update policy and regenerate signature
     */
    private updatePolicy;
    /**
     * Sign policy (mock implementation)
     */
    private signPolicy;
    /**
     * Start cache cleanup interval
     */
    private startCacheCleanup;
    /**
     * Update statistics
     */
    private updateStatistics;
    /**
     * Register default validation layers
     */
    private registerDefaultLayers;
    /**
     * Get pipeline statistics
     */
    getStatistics(): typeof this.stats & {
        cacheSize: number;
        layersCount: number;
        signedCacheStats?: any;
    };
    /**
     * Get signed cache statistics
     */
    getSignedCacheStatistics(): import("./SignedValidationCache.js").CacheStatistics | null;
    /**
     * Update signed cache eviction policy
     */
    updateSignedCachePolicy(updates: any): void;
    /**
     * Get current policy
     */
    getPolicy(): ValidationPolicy;
    /**
     * Update pipeline policy
     */
    updatePipelinePolicy(updates: Partial<ValidationPolicy>): void;
    /**
     * Clear validation cache
     */
    clearCache(): void;
    /**
     * Clear signed validation cache
     */
    clearSignedCache(): Promise<void>;
    /**
     * Clear all caches
     */
    clearAllCaches(): Promise<void>;
    /**
     * Get registered layers
     */
    getLayers(): ValidationLayer[];
    /**
     * Shutdown the validation pipeline
     */
    shutdown(): Promise<void>;
    /**
     * Check if pipeline is ready
     */
    isReady(): boolean;
    /**
     * Generate operation hash for caching
     */
    private generateOperationHash;
}
export declare const universalValidationPipeline: UniversalValidationPipeline;
//# sourceMappingURL=UniversalValidationPipeline.d.ts.map