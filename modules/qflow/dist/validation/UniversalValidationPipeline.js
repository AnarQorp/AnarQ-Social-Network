/**
 * Qflow Universal Validation Pipeline
 *
 * Decoupled validation component for ecosystem-wide use.
 * Orchestrates validation layers with caching and performance optimization.
 */
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { qflowEventEmitter } from '../events/EventEmitter.js';
import { SignedValidationCache } from './SignedValidationCache.js';
import { intelligentCachingService } from '../index.js';
/**
 * Universal Validation Pipeline
 * Provides decoupled validation orchestration for the entire ecosystem
 */
export class UniversalValidationPipeline extends EventEmitter {
    layers = new Map();
    validators = new Map();
    cache = new Map(); // Legacy cache - will be deprecated
    signedCache;
    policy;
    isInitialized = false;
    stats = {
        totalRequests: 0,
        totalCacheHits: 0,
        totalCacheMisses: 0,
        totalValidations: 0,
        averageLatency: 0
    };
    constructor() {
        super();
        // Initialize signed validation cache
        this.signedCache = new SignedValidationCache({
            maxEntries: 10000,
            defaultTtl: 300000, // 5 minutes
            evictionStrategy: 'hybrid',
            cleanupInterval: 60000
        });
        // Initialize default policy
        this.policy = {
            version: '1.0.0',
            layers: [],
            caching: {
                enabled: true,
                defaultTtl: 300000, // 5 minutes
                maxEntries: 10000
            },
            execution: {
                shortCircuitOnFailure: true,
                parallelExecution: false,
                maxConcurrency: 5
            },
            signature: ''
        };
    }
    /**
     * Initialize the validation pipeline
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        console.log('[UniversalValidationPipeline] 🔍 Initializing Universal Validation Pipeline...');
        try {
            // Initialize signed validation cache
            await this.signedCache.initialize();
            // Register default validation layers
            await this.registerDefaultLayers();
            // Start cache cleanup interval
            this.startCacheCleanup();
            this.isInitialized = true;
            console.log('[UniversalValidationPipeline] ✅ Universal Validation Pipeline initialized');
            // Emit initialization event
            qflowEventEmitter.emit('q.qflow.validation.pipeline.initialized.v1', {
                pipelineId: 'universal-validation-pipeline',
                layersCount: this.layers.size,
                policyVersion: this.policy.version,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('[UniversalValidationPipeline] ❌ Failed to initialize:', error);
            throw new Error(`Universal Validation Pipeline initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Register a validation layer
     */
    registerLayer(layer, validator) {
        this.layers.set(layer.layerId, layer);
        this.validators.set(layer.layerId, validator);
        console.log(`[UniversalValidationPipeline] ➕ Registered validation layer: ${layer.name} (${layer.layerId})`);
        // Update policy
        this.updatePolicy();
    }
    /**
     * Unregister a validation layer
     */
    unregisterLayer(layerId) {
        const removed = this.layers.delete(layerId) && this.validators.delete(layerId);
        if (removed) {
            console.log(`[UniversalValidationPipeline] ➖ Unregistered validation layer: ${layerId}`);
            this.updatePolicy();
        }
        return removed;
    }
    /**
     * Execute validation pipeline with streaming and signed cache
     */
    async validateStreaming(request) {
        if (!this.isInitialized) {
            throw new Error('Universal Validation Pipeline not initialized');
        }
        const startTime = Date.now();
        this.stats.totalRequests++;
        console.log(`[UniversalValidationPipeline] 🔄 Starting streaming validation: ${request.context.requestId}`);
        try {
            // Get layers to execute (sorted by priority)
            const layersToExecute = this.getLayersToExecute(request.layers);
            const layerIds = layersToExecute.map(layer => layer.layerId);
            // Configure streaming options
            const streamingOptions = {
                shortCircuitOnFailure: this.policy.execution.shortCircuitOnFailure,
                parallelValidation: this.policy.execution.parallelExecution,
                maxConcurrency: this.policy.execution.maxConcurrency,
                timeoutPerLayer: 10000, // 10 seconds default
                retryFailedLayers: false,
                retryAttempts: 1
            };
            // Check intelligent cache first if not skipped
            let streamingResult;
            const operationHash = this.generateOperationHash(request.data, layerIds);
            if (!request.skipCache) {
                const cachedResult = await intelligentCachingService.getValidationResult(operationHash);
                if (cachedResult) {
                    console.log(`[UniversalValidationPipeline] 📋 Using cached validation result: ${operationHash}`);
                    streamingResult = {
                        results: [cachedResult],
                        cacheHits: 1,
                        cacheMisses: 0,
                        totalDuration: 0
                    };
                }
            }
            // Execute streaming validation with signed cache if not cached
            if (!streamingResult) {
                streamingResult = await this.signedCache.streamingValidation(layerIds, request.data, this.policy.version, this.validators, request.context, streamingOptions);
                // Cache the validation result
                if (streamingResult.results.length > 0) {
                    const mainResult = streamingResult.results[0];
                    try {
                        await intelligentCachingService.cacheValidationResult(operationHash, mainResult);
                    }
                    catch (error) {
                        console.warn(`[UniversalValidationPipeline] Failed to cache validation result: ${error}`);
                    }
                }
            }
            // Determine overall status
            const overallStatus = this.determineOverallStatus(streamingResult.results);
            const totalDuration = Date.now() - startTime;
            // Update statistics
            this.stats.totalCacheHits += streamingResult.cacheHits;
            this.stats.totalCacheMisses += streamingResult.cacheMisses;
            this.updateStatistics(totalDuration);
            const pipelineResult = {
                requestId: request.context.requestId,
                overallStatus,
                results: streamingResult.results,
                totalDuration,
                cacheHits: streamingResult.cacheHits,
                cacheMisses: streamingResult.cacheMisses,
                timestamp: new Date().toISOString(),
                metadata: {
                    layersExecuted: streamingResult.results.filter(r => r.status !== 'skipped').length,
                    layersSkipped: streamingResult.results.filter(r => r.status === 'skipped').length,
                    layersFailed: streamingResult.results.filter(r => r.status === 'failed').length,
                    shortCircuited: streamingResult.shortCircuited
                }
            };
            console.log(`[UniversalValidationPipeline] ✅ Streaming validation complete: ${request.context.requestId} (${overallStatus.toUpperCase()}, ${totalDuration}ms, ${streamingResult.cacheHits} hits)`);
            // Emit validation complete event
            qflowEventEmitter.emit('q.qflow.validation.pipeline.executed.v1', {
                requestId: request.context.requestId,
                status: overallStatus,
                duration: totalDuration,
                layersExecuted: pipelineResult.metadata.layersExecuted,
                cacheHits: streamingResult.cacheHits,
                streaming: true,
                timestamp: pipelineResult.timestamp
            });
            return pipelineResult;
        }
        catch (error) {
            console.error(`[UniversalValidationPipeline] ❌ Streaming validation pipeline error: ${request.context.requestId}:`, error);
            const errorResult = {
                requestId: request.context.requestId,
                overallStatus: 'failed',
                results: [{
                        layerId: 'pipeline',
                        status: 'failed',
                        message: `Pipeline execution error: ${error instanceof Error ? error.message : String(error)}`,
                        duration: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    }],
                totalDuration: Date.now() - startTime,
                cacheHits: 0,
                cacheMisses: 0,
                timestamp: new Date().toISOString(),
                metadata: {
                    layersExecuted: 0,
                    layersSkipped: 0,
                    layersFailed: 1,
                    shortCircuited: true
                }
            };
            return errorResult;
        }
    }
    /**
     * Execute validation pipeline (legacy method - uses old cache)
     */
    async validate(request) {
        if (!this.isInitialized) {
            throw new Error('Universal Validation Pipeline not initialized');
        }
        const startTime = Date.now();
        this.stats.totalRequests++;
        console.log(`[UniversalValidationPipeline] 🔍 Starting validation: ${request.context.requestId}`);
        const results = [];
        let cacheHits = 0;
        let cacheMisses = 0;
        let layersExecuted = 0;
        let layersSkipped = 0;
        let layersFailed = 0;
        let shortCircuited = false;
        try {
            // Get layers to execute (sorted by priority)
            const layersToExecute = this.getLayersToExecute(request.layers);
            // Execute validation layers
            for (const layer of layersToExecute) {
                try {
                    const result = await this.executeLayer(layer, request.data, request.context, request.skipCache);
                    results.push(result);
                    if (result.cached) {
                        cacheHits++;
                    }
                    else {
                        cacheMisses++;
                    }
                    if (result.status === 'failed') {
                        layersFailed++;
                        // Short circuit on failure if enabled
                        if (this.policy.execution.shortCircuitOnFailure && layer.required) {
                            console.log(`[UniversalValidationPipeline] ⚡ Short-circuiting on required layer failure: ${layer.layerId}`);
                            shortCircuited = true;
                            break;
                        }
                    }
                    else if (result.status === 'skipped') {
                        layersSkipped++;
                    }
                    else {
                        layersExecuted++;
                    }
                }
                catch (error) {
                    const errorResult = {
                        layerId: layer.layerId,
                        status: 'failed',
                        message: `Layer execution error: ${error instanceof Error ? error.message : String(error)}`,
                        duration: 0,
                        timestamp: new Date().toISOString()
                    };
                    results.push(errorResult);
                    layersFailed++;
                    if (layer.required && this.policy.execution.shortCircuitOnFailure) {
                        shortCircuited = true;
                        break;
                    }
                }
            }
            // Determine overall status
            const overallStatus = this.determineOverallStatus(results);
            const totalDuration = Date.now() - startTime;
            // Update statistics
            this.updateStatistics(totalDuration);
            const pipelineResult = {
                requestId: request.context.requestId,
                overallStatus,
                results,
                totalDuration,
                cacheHits,
                cacheMisses,
                timestamp: new Date().toISOString(),
                metadata: {
                    layersExecuted,
                    layersSkipped,
                    layersFailed,
                    shortCircuited
                }
            };
            console.log(`[UniversalValidationPipeline] ✅ Validation complete: ${request.context.requestId} (${overallStatus.toUpperCase()}, ${totalDuration}ms)`);
            // Emit validation complete event
            qflowEventEmitter.emit('q.qflow.validation.pipeline.executed.v1', {
                requestId: request.context.requestId,
                status: overallStatus,
                duration: totalDuration,
                layersExecuted,
                cacheHits,
                timestamp: pipelineResult.timestamp
            });
            return pipelineResult;
        }
        catch (error) {
            console.error(`[UniversalValidationPipeline] ❌ Validation pipeline error: ${request.context.requestId}:`, error);
            const errorResult = {
                requestId: request.context.requestId,
                overallStatus: 'failed',
                results: [{
                        layerId: 'pipeline',
                        status: 'failed',
                        message: `Pipeline execution error: ${error instanceof Error ? error.message : String(error)}`,
                        duration: Date.now() - startTime,
                        timestamp: new Date().toISOString()
                    }],
                totalDuration: Date.now() - startTime,
                cacheHits: 0,
                cacheMisses: 0,
                timestamp: new Date().toISOString(),
                metadata: {
                    layersExecuted: 0,
                    layersSkipped: 0,
                    layersFailed: 1,
                    shortCircuited: true
                }
            };
            return errorResult;
        }
    }
    /**
     * Execute a single validation layer
     */
    async executeLayer(layer, data, context, skipCache) {
        const startTime = Date.now();
        // Check cache first (if enabled and not skipped)
        if (this.policy.caching.enabled && !skipCache) {
            const cacheKey = this.generateCacheKey(layer.layerId, data, this.policy.version);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult) {
                console.log(`[UniversalValidationPipeline] 💾 Cache hit for layer: ${layer.layerId}`);
                this.stats.totalCacheHits++;
                return {
                    ...cachedResult.result,
                    cached: true,
                    timestamp: new Date().toISOString()
                };
            }
        }
        // Execute validator
        const validator = this.validators.get(layer.layerId);
        if (!validator) {
            return {
                layerId: layer.layerId,
                status: 'failed',
                message: `No validator found for layer: ${layer.layerId}`,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
        }
        try {
            // Execute with timeout
            const result = await this.executeWithTimeout(validator(data, context), layer.timeout);
            result.duration = Date.now() - startTime;
            result.timestamp = new Date().toISOString();
            // Cache the result (if enabled and successful)
            if (this.policy.caching.enabled && result.status !== 'failed') {
                const cacheKey = this.generateCacheKey(layer.layerId, data, this.policy.version);
                this.addToCache(cacheKey, result);
            }
            this.stats.totalCacheMisses++;
            this.stats.totalValidations++;
            return result;
        }
        catch (error) {
            return {
                layerId: layer.layerId,
                status: 'failed',
                message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
        }
    }
    /**
     * Execute function with timeout
     */
    async executeWithTimeout(promise, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Validation timeout after ${timeout}ms`));
            }, timeout);
            promise
                .then(resolve)
                .catch(reject)
                .finally(() => clearTimeout(timer));
        });
    }
    /**
     * Get layers to execute in priority order
     */
    getLayersToExecute(layerIds) {
        const layers = [];
        for (const layerId of layerIds) {
            const layer = this.layers.get(layerId);
            if (layer) {
                layers.push(layer);
            }
            else {
                console.warn(`[UniversalValidationPipeline] ⚠️ Unknown layer requested: ${layerId}`);
            }
        }
        // Sort by priority (lower number = higher priority)
        return layers.sort((a, b) => a.priority - b.priority);
    }
    /**
     * Determine overall validation status
     */
    determineOverallStatus(results) {
        const hasFailures = results.some(r => r.status === 'failed');
        const hasWarnings = results.some(r => r.status === 'warning');
        if (hasFailures) {
            return 'failed';
        }
        else if (hasWarnings) {
            return 'warning';
        }
        else {
            return 'passed';
        }
    }
    /**
     * Generate cache key
     */
    generateCacheKey(layerId, data, policyVersion) {
        const dataHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
        return `${layerId}:${dataHash}:${policyVersion}`;
    }
    /**
     * Get result from cache
     */
    getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check TTL
        if (Date.now() > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry;
    }
    /**
     * Add result to cache
     */
    addToCache(key, result) {
        // Check cache size limit
        if (this.cache.size >= this.policy.caching.maxEntries) {
            // Remove oldest entries (simple LRU)
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        const entry = {
            key,
            result: { ...result },
            ttl: Date.now() + this.policy.caching.defaultTtl,
            policyVersion: this.policy.version,
            signature: this.signCacheEntry(key, result),
            timestamp: new Date().toISOString()
        };
        this.cache.set(key, entry);
    }
    /**
     * Sign cache entry (mock implementation)
     */
    signCacheEntry(key, result) {
        const signatureInput = `${key}:${JSON.stringify(result)}:${this.policy.version}`;
        return createHash('sha256').update(signatureInput).digest('hex').substring(0, 32);
    }
    /**
     * Update policy and regenerate signature
     */
    updatePolicy() {
        this.policy.layers = Array.from(this.layers.values());
        this.policy.signature = this.signPolicy();
        console.log(`[UniversalValidationPipeline] 📋 Policy updated: ${this.policy.layers.length} layers`);
    }
    /**
     * Sign policy (mock implementation)
     */
    signPolicy() {
        const policyData = {
            version: this.policy.version,
            layers: this.policy.layers,
            caching: this.policy.caching,
            execution: this.policy.execution
        };
        return createHash('sha256').update(JSON.stringify(policyData)).digest('hex').substring(0, 32);
    }
    /**
     * Start cache cleanup interval
     */
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            let cleaned = 0;
            for (const [key, entry] of this.cache) {
                if (now > entry.ttl) {
                    this.cache.delete(key);
                    cleaned++;
                }
            }
            if (cleaned > 0) {
                console.log(`[UniversalValidationPipeline] 🧹 Cleaned ${cleaned} expired cache entries`);
            }
        }, 60000); // Clean every minute
    }
    /**
     * Update statistics
     */
    updateStatistics(duration) {
        this.stats.averageLatency = (this.stats.averageLatency * (this.stats.totalRequests - 1) + duration) / this.stats.totalRequests;
    }
    /**
     * Register default validation layers
     */
    async registerDefaultLayers() {
        // Schema validation layer
        this.registerLayer({
            layerId: 'schema-validation',
            name: 'Schema Validation',
            description: 'Validates data against JSON schema',
            priority: 1,
            required: true,
            timeout: 5000
        }, async (data, context) => {
            // Mock schema validation
            if (typeof data !== 'object' || data === null) {
                return {
                    layerId: 'schema-validation',
                    status: 'failed',
                    message: 'Data must be an object',
                    duration: 0,
                    timestamp: new Date().toISOString()
                };
            }
            return {
                layerId: 'schema-validation',
                status: 'passed',
                message: 'Schema validation passed',
                duration: 0,
                timestamp: new Date().toISOString()
            };
        });
        // Business rules validation layer
        this.registerLayer({
            layerId: 'business-rules',
            name: 'Business Rules Validation',
            description: 'Validates business logic constraints',
            priority: 2,
            required: false,
            timeout: 10000
        }, async (data, context) => {
            // Mock business rules validation
            return {
                layerId: 'business-rules',
                status: 'passed',
                message: 'Business rules validation passed',
                duration: 0,
                timestamp: new Date().toISOString()
            };
        });
        // Security validation layer
        this.registerLayer({
            layerId: 'security-validation',
            name: 'Security Validation',
            description: 'Validates security constraints and permissions',
            priority: 0, // Highest priority
            required: true,
            timeout: 15000
        }, async (data, context) => {
            // Mock security validation
            return {
                layerId: 'security-validation',
                status: 'passed',
                message: 'Security validation passed',
                duration: 0,
                timestamp: new Date().toISOString()
            };
        });
        // Register Qlock encryption validation layer
        try {
            const { qlockValidationLayer } = await import('./QlockValidationLayer.js');
            const qlockLayer = qlockValidationLayer.getValidationLayer();
            const qlockValidator = qlockValidationLayer.getValidator();
            this.registerLayer(qlockLayer, qlockValidator);
        }
        catch (error) {
            console.warn('[UniversalValidationPipeline] ⚠️ Failed to register Qlock validation layer:', error);
        }
        // Register Qonsent permission validation layer
        try {
            const { qonsentValidationLayer } = await import('./QonsentValidationLayer.js');
            const qonsentLayer = qonsentValidationLayer.getValidationLayer();
            const qonsentValidator = qonsentValidationLayer.getValidator();
            this.registerLayer(qonsentLayer, qonsentValidator);
        }
        catch (error) {
            console.warn('[UniversalValidationPipeline] ⚠️ Failed to register Qonsent validation layer:', error);
        }
        // Register Qindex metadata validation layer
        try {
            const { qindexValidationLayer } = await import('./QindexValidationLayer.js');
            const qindexLayer = qindexValidationLayer.getValidationLayer();
            const qindexValidator = qindexValidationLayer.getValidator();
            this.registerLayer(qindexLayer, qindexValidator);
        }
        catch (error) {
            console.warn('[UniversalValidationPipeline] ⚠️ Failed to register Qindex validation layer:', error);
        }
        // Register Qerberos security validation layer
        try {
            const { qerberosValidationLayer } = await import('./QerberosValidationLayer.js');
            const qerberosLayer = qerberosValidationLayer.getValidationLayer();
            const qerberosValidator = qerberosValidationLayer.getValidator();
            this.registerLayer(qerberosLayer, qerberosValidator);
        }
        catch (error) {
            console.warn('[UniversalValidationPipeline] ⚠️ Failed to register Qerberos validation layer:', error);
        }
    }
    /**
     * Get pipeline statistics
     */
    getStatistics() {
        const signedCacheStats = this.signedCache ? this.signedCache.getStatistics() : undefined;
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            layersCount: this.layers.size,
            signedCacheStats
        };
    }
    /**
     * Get signed cache statistics
     */
    getSignedCacheStatistics() {
        return this.signedCache ? this.signedCache.getStatistics() : null;
    }
    /**
     * Update signed cache eviction policy
     */
    updateSignedCachePolicy(updates) {
        if (this.signedCache) {
            this.signedCache.updateEvictionPolicy(updates);
        }
    }
    /**
     * Get current policy
     */
    getPolicy() {
        return { ...this.policy };
    }
    /**
     * Update pipeline policy
     */
    updatePipelinePolicy(updates) {
        this.policy = { ...this.policy, ...updates };
        this.updatePolicy();
        console.log('[UniversalValidationPipeline] 📋 Pipeline policy updated');
    }
    /**
     * Clear validation cache
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        console.log(`[UniversalValidationPipeline] 🧹 Cleared ${size} legacy cache entries`);
    }
    /**
     * Clear signed validation cache
     */
    async clearSignedCache() {
        if (this.signedCache) {
            await this.signedCache.clear();
        }
    }
    /**
     * Clear all caches
     */
    async clearAllCaches() {
        this.clearCache();
        await this.clearSignedCache();
    }
    /**
     * Get registered layers
     */
    getLayers() {
        return Array.from(this.layers.values());
    }
    /**
     * Shutdown the validation pipeline
     */
    async shutdown() {
        // Shutdown signed cache
        if (this.signedCache) {
            await this.signedCache.shutdown();
        }
        this.clearCache();
        this.layers.clear();
        this.validators.clear();
        this.isInitialized = false;
        console.log('[UniversalValidationPipeline] 🛑 Universal Validation Pipeline shutdown complete');
    }
    /**
     * Check if pipeline is ready
     */
    isReady() {
        return this.isInitialized;
    }
    /**
     * Generate operation hash for caching
     */
    generateOperationHash(data, layerIds) {
        const hashInput = JSON.stringify({
            data: data,
            layers: layerIds.sort(),
            policyVersion: this.policy.version
        });
        return createHash('sha256').update(hashInput).digest('hex');
    }
}
// Export singleton instance
export const universalValidationPipeline = new UniversalValidationPipeline();
//# sourceMappingURL=UniversalValidationPipeline.js.map