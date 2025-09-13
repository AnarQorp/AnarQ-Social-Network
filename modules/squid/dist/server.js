"use strict";
/**
 * sQuid Server
 * Main server entry point for the sQuid identity module
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const IdentityService_1 = require("./services/IdentityService");
const EventService_1 = require("./services/EventService");
const StorageService_1 = require("./services/StorageService");
const identityHandlers_1 = require("./handlers/identityHandlers");
const healthHandler_1 = require("./handlers/healthHandler");
const authMiddleware_1 = require("./middleware/authMiddleware");
const rateLimitMiddleware_1 = require("./middleware/rateLimitMiddleware");
const tools_1 = require("./mcp/tools");
class SquidServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.config = this.loadConfig();
        this.initializeServices();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    loadConfig() {
        return {
            port: parseInt(process.env.SQUID_PORT || '3001'),
            host: process.env.SQUID_HOST || 'localhost',
            mockMode: process.env.SQUID_MOCK_MODE === 'true',
            database: {
                url: process.env.SQUID_DB_URL || 'mongodb://localhost:27017/squid',
                name: process.env.SQUID_DB_NAME || 'squid'
            },
            eventBus: {
                url: process.env.EVENT_BUS_URL || 'redis://localhost:6379',
                topics: {
                    identityCreated: 'q.squid.created.v1',
                    subidentityCreated: 'q.squid.sub.created.v1',
                    reputationUpdated: 'q.squid.reputation.updated.v1',
                    identityVerified: 'q.squid.verified.v1'
                }
            },
            security: {
                maxSubidentities: parseInt(process.env.SQUID_MAX_SUBIDENTITIES || '10'),
                sessionTimeout: parseInt(process.env.SQUID_SESSION_TIMEOUT || '86400000'), // 24 hours
                rateLimits: {
                    identityCreation: 5,
                    verificationSubmission: 3,
                    reputationQueries: 100,
                    generalApi: 1000
                }
            },
            integrations: {
                qonsent: {
                    enabled: process.env.QONSENT_ENABLED !== 'false',
                    url: process.env.QONSENT_URL || 'http://localhost:3002'
                },
                qlock: {
                    enabled: process.env.QLOCK_ENABLED !== 'false',
                    url: process.env.QLOCK_URL || 'http://localhost:3003'
                },
                qindex: {
                    enabled: process.env.QINDEX_ENABLED !== 'false',
                    url: process.env.QINDEX_URL || 'http://localhost:3004'
                },
                qerberos: {
                    enabled: process.env.QERBEROS_ENABLED !== 'false',
                    url: process.env.QERBEROS_URL || 'http://localhost:3005'
                }
            }
        };
    }
    initializeServices() {
        // Initialize core services
        this.eventService = new EventService_1.EventService(this.config);
        this.storageService = new StorageService_1.StorageService(this.config);
        this.identityService = new IdentityService_1.IdentityService(this.storageService, this.eventService, this.config);
        // Initialize handlers
        this.identityHandlers = new identityHandlers_1.IdentityHandlers(this.identityService);
        this.healthHandler = new healthHandler_1.HealthHandler();
        // Initialize middleware
        this.authMiddleware = new authMiddleware_1.AuthMiddleware(this.identityService);
        this.rateLimitMiddleware = new rateLimitMiddleware_1.RateLimitMiddleware();
        // Initialize MCP tools
        this.mcpTools = new tools_1.SquidMCPTools(this.identityService);
        console.log(`[sQuid Server] Services initialized (Mock Mode: ${this.config.mockMode})`);
    }
    initializeMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        // CORS
        this.app.use((0, cors_1.default)({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'x-squid-id',
                'x-sig',
                'x-ts',
                'x-message',
                'x-session-id',
                'x-device-fingerprint',
                'x-api-version'
            ]
        }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                const isError = res.statusCode >= 400;
                console.log(`[sQuid Server] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
                this.healthHandler.recordRequest(duration, isError);
            });
            next();
        });
        console.log('[sQuid Server] Middleware initialized');
    }
    initializeRoutes() {
        // Health check endpoint (no auth required)
        this.app.get('/health', this.healthHandler.getHealth);
        // API routes with rate limiting
        const apiRouter = express_1.default.Router();
        // Identity creation (rate limited, no auth required)
        apiRouter.post('/identity', this.rateLimitMiddleware.identityCreation, this.identityHandlers.createIdentity);
        // Identity retrieval (rate limited, optional auth)
        apiRouter.get('/identity/:identityId', this.rateLimitMiddleware.generalApi, this.authMiddleware.optionalAuth, this.identityHandlers.getIdentity);
        // Identity update (auth required, ownership check)
        apiRouter.put('/identity/:identityId', this.rateLimitMiddleware.generalApi, this.authMiddleware.verifyIdentity, this.authMiddleware.requireIdentityOwnership, this.identityHandlers.updateIdentity);
        // Identity deletion (auth required, ownership check)
        apiRouter.delete('/identity/:identityId', this.rateLimitMiddleware.generalApi, this.authMiddleware.verifyIdentity, this.authMiddleware.requireIdentityOwnership, this.identityHandlers.deleteIdentity);
        // Subidentity creation (auth required, verified parent)
        apiRouter.post('/identity/:identityId/subidentity', this.rateLimitMiddleware.identityCreation, this.authMiddleware.verifyIdentity, this.authMiddleware.requireVerificationLevel('ENHANCED'), this.authMiddleware.requireIdentityOwnership, this.identityHandlers.createSubidentity);
        // Verification submission (auth required, rate limited)
        apiRouter.put('/identity/:identityId/verify', this.rateLimitMiddleware.verificationSubmission, this.authMiddleware.verifyIdentity, this.authMiddleware.requireIdentityOwnership, this.identityHandlers.submitVerification);
        // Reputation queries (rate limited, optional auth)
        apiRouter.get('/identity/:identityId/reputation', this.rateLimitMiddleware.reputationQueries, this.authMiddleware.optionalAuth, this.identityHandlers.getReputation);
        // MCP endpoints (for serverless/function calls)
        apiRouter.post('/mcp/squid.verifyIdentity', async (req, res) => {
            try {
                const result = await this.mcpTools.verifyIdentity(req.body);
                res.json({ status: 'ok', data: result });
            }
            catch (error) {
                res.status(500).json({
                    status: 'error',
                    message: error instanceof Error ? error.message : String(error),
                    timestamp: new Date()
                });
            }
        });
        apiRouter.post('/mcp/squid.activeContext', async (req, res) => {
            try {
                const result = await this.mcpTools.activeContext(req.body);
                res.json({ status: 'ok', data: result });
            }
            catch (error) {
                res.status(500).json({
                    status: 'error',
                    message: error instanceof Error ? error.message : String(error),
                    timestamp: new Date()
                });
            }
        });
        // Mount API routes
        this.app.use('/api/v1', apiRouter);
        this.app.use('/', apiRouter); // Also mount at root for backward compatibility
        console.log('[sQuid Server] Routes initialized');
    }
    initializeErrorHandling() {
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                status: 'error',
                code: 'NOT_FOUND',
                message: `Route ${req.method} ${req.originalUrl} not found`,
                timestamp: new Date(),
                retryable: false
            });
        });
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('[sQuid Server] Unhandled error:', error);
            res.status(500).json({
                status: 'error',
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
                details: process.env.NODE_ENV === 'development' ? {
                    error: error.message,
                    stack: error.stack
                } : undefined,
                timestamp: new Date(),
                retryable: true
            });
        });
        console.log('[sQuid Server] Error handling initialized');
    }
    async start() {
        try {
            // Initialize mock data if in mock mode
            if (this.config.mockMode) {
                await this.storageService.initializeMockData();
            }
            // Start the server
            this.app.listen(this.config.port, this.config.host, () => {
                console.log(`[sQuid Server] Server running on http://${this.config.host}:${this.config.port}`);
                console.log(`[sQuid Server] Mock Mode: ${this.config.mockMode}`);
                console.log(`[sQuid Server] Health Check: http://${this.config.host}:${this.config.port}/health`);
                console.log(`[sQuid Server] OpenAPI Spec: http://${this.config.host}:${this.config.port}/openapi.yaml`);
            });
        }
        catch (error) {
            console.error('[sQuid Server] Failed to start server:', error);
            process.exit(1);
        }
    }
    async stop() {
        console.log('[sQuid Server] Shutting down...');
        // Cleanup resources
        this.rateLimitMiddleware.destroy();
        // In a real implementation, we would also:
        // - Close database connections
        // - Close event bus connections
        // - Cancel any pending operations
        console.log('[sQuid Server] Shutdown complete');
    }
}
// Start the server if this file is run directly
if (require.main === module) {
    const server = new SquidServer();
    // Graceful shutdown handling
    process.on('SIGTERM', async () => {
        await server.stop();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        await server.stop();
        process.exit(0);
    });
    server.start().catch(error => {
        console.error('[sQuid Server] Failed to start:', error);
        process.exit(1);
    });
}
exports.default = SquidServer;
//# sourceMappingURL=server.js.map