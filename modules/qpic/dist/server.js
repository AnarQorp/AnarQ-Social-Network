"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const config_1 = require("./config");
// import { logger } from './utils/logger';
// Import middleware
const auth_1 = __importDefault(require("./middleware/auth"));
const errorHandler_1 = require("./middleware/errorHandler");
const rateLimit_1 = __importDefault(require("./middleware/rateLimit"));
// Import routes
const health_1 = require("./routes/health");
const media_1 = require("./routes/media");
const metadata_1 = require("./routes/metadata");
const transcoding_1 = require("./routes/transcoding");
const optimization_1 = require("./routes/optimization");
const licensing_1 = require("./routes/licensing");
const jobs_1 = require("./routes/jobs");
const search_1 = require("./routes/search");
const mcp_1 = require("./routes/mcp");
// Import mock routes for standalone mode
const mocks_1 = require("./routes/mocks");
async function createServer() {
    const server = (0, fastify_1.default)({
        logger: config_1.config.nodeEnv === 'test' ? false : true,
        bodyLimit: config_1.config.maxFileSize,
        requestTimeout: 60000
    });
    // Register plugins
    await server.register(cors_1.default, {
        origin: true,
        credentials: true
    });
    await server.register(helmet_1.default, {
        contentSecurityPolicy: false
    });
    await server.register(multipart_1.default, {
        limits: {
            fileSize: config_1.config.maxFileSize
        }
    });
    // Register Swagger documentation
    await server.register(swagger_1.default, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'QpiC API',
                description: 'Media Management module for Q ecosystem',
                version: '2.0.0'
            },
            servers: [
                {
                    url: `http://localhost:${config_1.config.port}/api/v1`,
                    description: 'Development server'
                }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        }
    });
    await server.register(swagger_ui_1.default, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: false
        }
    });
    // Register middleware
    await server.register(rateLimit_1.default);
    await server.register(auth_1.default);
    // Register error handler
    server.setErrorHandler(errorHandler_1.errorHandler);
    // Register routes
    await server.register(health_1.healthRoutes, { prefix: '/api/v1' });
    await server.register(media_1.mediaRoutes, { prefix: '/api/v1' });
    await server.register(metadata_1.metadataRoutes, { prefix: '/api/v1' });
    await server.register(transcoding_1.transcodingRoutes, { prefix: '/api/v1' });
    await server.register(optimization_1.optimizationRoutes, { prefix: '/api/v1' });
    await server.register(licensing_1.licensingRoutes, { prefix: '/api/v1' });
    await server.register(jobs_1.jobRoutes, { prefix: '/api/v1' });
    await server.register(search_1.searchRoutes, { prefix: '/api/v1' });
    await server.register(mcp_1.mcpRoutes, { prefix: '/mcp/v1' });
    // Register mock routes for standalone mode
    if (config_1.config.nodeEnv === 'development') {
        await server.register(mocks_1.mockRoutes, { prefix: '/mock' });
    }
    return server;
}
//# sourceMappingURL=server.js.map