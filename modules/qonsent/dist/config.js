"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('3003'),
    HOST: zod_1.z.string().default('0.0.0.0'),
    // Database
    MONGODB_URI: zod_1.z.string().default('mongodb://localhost:27017/qonsent'),
    // External services
    SQUID_API_URL: zod_1.z.string().default('http://localhost:3001'),
    QERBEROS_API_URL: zod_1.z.string().default('http://localhost:3006'),
    QLOCK_API_URL: zod_1.z.string().default('http://localhost:3002'),
    QINDEX_API_URL: zod_1.z.string().default('http://localhost:3004'),
    // Event bus
    EVENT_BUS_URL: zod_1.z.string().default('redis://localhost:6379'),
    EVENT_BUS_TYPE: zod_1.z.enum(['redis', 'nats', 'mock']).default('redis'),
    // Cache
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    CACHE_TTL: zod_1.z.string().default('300'), // 5 minutes
    // Security
    JWT_SECRET: zod_1.z.string().default('your-secret-key-change-in-production'),
    ENCRYPTION_KEY: zod_1.z.string().default('your-encryption-key-32-chars-long'),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    // CORS
    CORS_ORIGIN: zod_1.z.string().default('*'),
    // Rate limiting
    RATE_LIMIT_MAX: zod_1.z.string().default('100'),
    RATE_LIMIT_WINDOW: zod_1.z.string().default('60000'), // 1 minute
    // Feature flags
    ENABLE_UCAN_POLICIES: zod_1.z.string().default('true'),
    ENABLE_DELEGATION: zod_1.z.string().default('true'),
    ENABLE_AUDIT_LOGGING: zod_1.z.string().default('true'),
    ENABLE_REAL_TIME_REVOCATION: zod_1.z.string().default('true'),
});
const env = envSchema.parse(process.env);
exports.config = {
    env: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    host: env.HOST,
    // Database
    database: {
        uri: env.MONGODB_URI,
        options: {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        },
    },
    // External services
    services: {
        squid: {
            baseUrl: env.SQUID_API_URL,
            timeout: 5000,
        },
        qerberos: {
            baseUrl: env.QERBEROS_API_URL,
            timeout: 5000,
        },
        qlock: {
            baseUrl: env.QLOCK_API_URL,
            timeout: 5000,
        },
        qindex: {
            baseUrl: env.QINDEX_API_URL,
            timeout: 5000,
        },
    },
    // Event bus
    eventBus: {
        url: env.EVENT_BUS_URL,
        type: env.EVENT_BUS_TYPE,
        options: {
            retryAttempts: 3,
            retryDelay: 1000,
        },
    },
    // Cache
    cache: {
        url: env.REDIS_URL,
        ttl: parseInt(env.CACHE_TTL, 10),
        options: {
            retryAttempts: 3,
            retryDelay: 1000,
        },
    },
    // Security
    security: {
        jwtSecret: env.JWT_SECRET,
        encryptionKey: env.ENCRYPTION_KEY,
        denyByDefault: true,
        requireSignatures: env.NODE_ENV === 'production',
    },
    // Logging
    logging: {
        level: env.LOG_LEVEL,
        format: env.NODE_ENV === 'production' ? 'json' : 'pretty',
    },
    // CORS
    cors: {
        origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map(o => o.trim()),
    },
    // Rate limiting
    rateLimit: {
        max: parseInt(env.RATE_LIMIT_MAX, 10),
        window: parseInt(env.RATE_LIMIT_WINDOW, 10),
    },
    // Feature flags
    features: {
        ucanPolicies: env.ENABLE_UCAN_POLICIES === 'true',
        delegation: env.ENABLE_DELEGATION === 'true',
        auditLogging: env.ENABLE_AUDIT_LOGGING === 'true',
        realTimeRevocation: env.ENABLE_REAL_TIME_REVOCATION === 'true',
    },
    // Environment checks
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
};
//# sourceMappingURL=config.js.map