export declare class CacheService {
    private static instance;
    private redisClient;
    private connected;
    private memoryCache;
    private constructor();
    static getInstance(): CacheService;
    connect(): Promise<void>;
    private connectRedis;
    disconnect(): Promise<void>;
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    clear(): Promise<void>;
    ping(): Promise<void>;
    mget<T = any>(keys: string[]): Promise<(T | null)[]>;
    mset(keyValuePairs: Array<{
        key: string;
        value: any;
        ttl?: number;
    }>): Promise<void>;
    deletePattern(pattern: string): Promise<void>;
    getStats(): {
        connected: boolean;
        type: 'redis' | 'memory';
        size?: number;
    };
    getStatus(): {
        connected: boolean;
        type: string;
        url?: string;
    };
    private cleanupMemoryCache;
    startCleanup(): void;
}
//# sourceMappingURL=cache.d.ts.map