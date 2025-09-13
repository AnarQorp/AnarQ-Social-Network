"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = buildApp;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = require("./middleware/auth");
const audit_1 = require("./middleware/audit");
const rateLimit_1 = require("./middleware/rateLimit");
// Route imports
const health_1 = require("./routes/health");
const qonsent_1 = require("./routes/qonsent");
const policies_1 = require("./routes/policies");
const mcp_1 = require("./routes/mcp");
async function buildApp() {
    const app = (0, fastify_1.default)({
        logger: config_1.config.isDevelopment,
        trustProxy: true,
        requestIdHeader: 'x-request-id',
        requestIdLogLabel: 'requestId',
    });
    // Register plugins
    await app.register(cors_1.default, {
        origin: config_1.config.cors.origin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-squid-id',
            'x-subid',
            'x-qonsent',
            'x-sig',
            'x-ts',
            'x-api-version',
            'x-request-id',
            'x-trace-id',
        ],
    });
    await app.register(helmet_1.default, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    });
    // Swagger documentation
    await app.register(swagger_1.default, {
        openapi: {
            openapi: '3.0.3',
            info: {
                title: 'Qonsent API',
                description: 'Policies & Permissions module for Q ecosystem with UCAN policy engine',
                version: '2.0.0',
                contact: {
                    name: 'Q Ecosystem',
                    url: 'https://github.com/anarq/qonsent',
                },
            },
            servers: [
                {
                    url: `http://localhost:${config_1.config.port}/api/v1`,
                    description: 'Development server',
                },
            ],
            components: {
                securitySchemes: {
                    squidAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        description: 'sQuid identity token',
                    },
                },
            },
            security: [{ squidAuth: [] }],
        },
    });
    await app.register(swagger_ui_1.default, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false,
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
    });
    // Register middleware
    app.setErrorHandler(errorHandler_1.errorHandler);
    await app.register(rateLimit_1.rateLimitMiddleware);
    await app.register(audit_1.auditMiddleware);
    await app.register(auth_1.authMiddleware);
    // Register routes
    await app.register(health_1.healthRoutes);
    await app.register(qonsent_1.qonsentRoutes, { prefix: '/api/v1/qonsent' });
    await app.register(policies_1.policyRoutes, { prefix: '/api/v1/qonsent/policies' });
    await app.register(mcp_1.mcpRoutes, { prefix: '/mcp/v1' });
    // Add hooks for request/response logging
    app.addHook('onRequest', async (request, reply) => {
        request.log.info({
            method: request.method,
            url: request.url,
            headers: {
                'user-agent': request.headers['user-agent'],
                'x-squid-id': request.headers['x-squid-id'],
                'x-api-version': request.headers['x-api-version'],
            },
        }, 'Incoming request');
    });
    app.addHook('onResponse', async (request, reply) => {
        request.log.info({
            method: request.method,
            url: request.url,
            statusCode: reply.statusCode,
            responseTime: reply.getResponseTime(),
        }, 'Request completed');
    });
    return app;
}
//# sourceMappingURL=app.js.map