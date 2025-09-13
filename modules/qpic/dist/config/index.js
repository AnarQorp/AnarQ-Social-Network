"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isDevelopment = exports.isProduction = exports.allowedFormatsArray = exports.config = void 0;
const zod_1 = require("zod");
const configSchema = zod_1.z.object({
    // Server configuration
    port: zod_1.z.number().default(3008),
    nodeEnv: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // Database configuration
    mongoUri: zod_1.z.string().default('mongodb://localhost:27017/qpic'),
    redisUrl: zod_1.z.string().default('redis://localhost:6379'),
    // Storage configuration
    ipfsUrl: zod_1.z.string().default('http://localhost:5001'),
    storagePath: zod_1.z.string().default('/tmp/qpic-storage'),
    maxFileSize: zod_1.z.number().default(100 * 1024 * 1024), // 100MB
    allowedFormats: zod_1.z.string().default('jpg,jpeg,png,webp,avif,mp4,webm,mp3,aac,flac,pdf'),
    // External services
    squidUrl: zod_1.z.string().default('http://localhost:3001'),
    qonsentUrl: zod_1.z.string().default('http://localhost:3003'),
    qmaskUrl: zod_1.z.string().default('http://localhost:3007'),
    qerberosUrl: zod_1.z.string().default('http://localhost:3006'),
    qindexUrl: zod_1.z.string().default('http://localhost:3004'),
    qmarketUrl: zod_1.z.string().default('http://localhost:3009'),
    // Media processing configuration
    ffmpegPath: zod_1.z.string().default('/usr/bin/ffmpeg'),
    imagemagickPath: zod_1.z.string().default('/usr/bin/convert'),
    transcodingWorkers: zod_1.z.number().default(4),
    transcodingTimeout: zod_1.z.number().default(300),
    // CDN configuration
    cdnEnabled: zod_1.z.boolean().default(false),
    cdnUrl: zod_1.z.string().optional(),
    cacheTtl: zod_1.z.number().default(3600),
    // Security configuration
    jwtSecret: zod_1.z.string().default('qpic-dev-secret'),
    encryptionKey: zod_1.z.string().default('qpic-dev-encryption-key'),
    // Rate limiting
    rateLimitMax: zod_1.z.number().default(100),
    rateLimitWindow: zod_1.z.number().default(60000), // 1 minute
});
const rawConfig = {
    port: parseInt(process.env.PORT || '3008'),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/qpic',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ipfsUrl: process.env.IPFS_URL || 'http://localhost:5001',
    storagePath: process.env.STORAGE_PATH || '/tmp/qpic-storage',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE?.replace(/[^\d]/g, '') || '104857600'), // 100MB
    allowedFormats: process.env.ALLOWED_FORMATS || 'jpg,jpeg,png,webp,avif,mp4,webm,mp3,aac,flac,pdf',
    squidUrl: process.env.SQUID_URL || 'http://localhost:3001',
    qonsentUrl: process.env.QONSENT_URL || 'http://localhost:3003',
    qmaskUrl: process.env.QMASK_URL || 'http://localhost:3007',
    qerberosUrl: process.env.QERBEROS_URL || 'http://localhost:3006',
    qindexUrl: process.env.QINDEX_URL || 'http://localhost:3004',
    qmarketUrl: process.env.QMARKET_URL || 'http://localhost:3009',
    ffmpegPath: process.env.FFMPEG_PATH || '/usr/bin/ffmpeg',
    imagemagickPath: process.env.IMAGEMAGICK_PATH || '/usr/bin/convert',
    transcodingWorkers: parseInt(process.env.TRANSCODING_WORKERS || '4'),
    transcodingTimeout: parseInt(process.env.TRANSCODING_TIMEOUT || '300'),
    cdnEnabled: process.env.CDN_ENABLED === 'true',
    cdnUrl: process.env.CDN_URL,
    cacheTtl: parseInt(process.env.CACHE_TTL || '3600'),
    jwtSecret: process.env.JWT_SECRET || 'qpic-dev-secret',
    encryptionKey: process.env.ENCRYPTION_KEY || 'qpic-dev-encryption-key',
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
};
exports.config = configSchema.parse(rawConfig);
// Derived configuration
exports.allowedFormatsArray = exports.config.allowedFormats.split(',').map(f => f.trim().toLowerCase());
exports.isProduction = exports.config.nodeEnv === 'production';
exports.isDevelopment = exports.config.nodeEnv === 'development';
exports.isTest = exports.config.nodeEnv === 'test';
//# sourceMappingURL=index.js.map