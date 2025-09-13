/**
 * Lazy Loading Manager
 *
 * Manages lazy loading of flow components, templates, and modules
 * to optimize memory usage and startup time.
 */
import { EventEmitter } from 'events';
export interface LazyLoadConfig {
    maxCacheSize: number;
    preloadThreshold: number;
    compressionEnabled: boolean;
    persistentCache: boolean;
    loadTimeout: number;
}
export interface ComponentMetadata {
    id: string;
    type: 'step' | 'template' | 'module' | 'validator';
    size: number;
    dependencies: string[];
    priority: number;
    lastAccessed: number;
    accessCount: number;
    loadTime: number;
}
export interface LoadingStrategy {
    name: string;
    shouldPreload: (metadata: ComponentMetadata) => boolean;
    loadPriority: (metadata: ComponentMetadata) => number;
}
export interface CacheEntry<T> {
    data: T;
    metadata: ComponentMetadata;
    compressed: boolean;
    timestamp: number;
    accessCount: number;
}
export declare class LazyLoadingManager extends EventEmitter {
    private config;
    private cache;
    private loaders;
    private loadingPromises;
    private metadata;
    private strategies;
    private currentCacheSize;
    constructor(config: LazyLoadConfig);
    /**
     * Register a component for lazy loading
     */
    registerComponent<T>(id: string, loader: () => Promise<T>, metadata: Partial<ComponentMetadata>): void;
    /**
     * Load a component with lazy loading
     */
    loadComponent<T>(id: string): Promise<T>;
    /**
     * Preload components based on strategies
     */
    preloadComponents(context?: any): Promise<void>;
    /**
     * Load dependencies for a component
     */
    loadDependencies(id: string): Promise<void>;
    /**
     * Register a loading strategy
     */
    registerStrategy(strategy: LoadingStrategy): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): any;
    /**
     * Clear cache entries
     */
    clearCache(filter?: (entry: CacheEntry<any>) => boolean): void;
    /**
     * Get component metadata
     */
    getComponentMetadata(id: string): ComponentMetadata | undefined;
    /**
     * Update component priority
     */
    updateComponentPriority(id: string, priority: number): void;
    /**
     * Get loading recommendations
     */
    getLoadingRecommendations(): string[];
    private performLoad;
    private cacheComponent;
    private evictLeastUsed;
    private updateAccessMetrics;
    private shouldPreload;
    private getLoadPriority;
    private calculateHitRate;
    private initializeDefaultStrategies;
    private startCacheCleanup;
}
//# sourceMappingURL=LazyLoadingManager.d.ts.map