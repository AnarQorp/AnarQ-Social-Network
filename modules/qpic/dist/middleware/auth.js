"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const logger_1 = require("../utils/logger");
const SquidService_1 = require("../services/SquidService");
async function authMiddleware(fastify) {
    const squidService = new SquidService_1.SquidService();
    fastify.decorateRequest('user', null);
    fastify.addHook('preHandler', async (request, reply) => {
        // Skip auth for health checks and mock endpoints
        if (request.url.startsWith('/api/v1/health') ||
            request.url.startsWith('/mock/') ||
            request.url.startsWith('/docs')) {
            return;
        }
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.code(401).send({
                    status: 'error',
                    code: 'UNAUTHORIZED',
                    message: 'Missing or invalid authorization header',
                    timestamp: new Date().toISOString()
                });
            }
            const token = authHeader.substring(7);
            // Verify token with sQuid service
            const identity = await squidService.verifyIdentity(token);
            if (!identity) {
                return reply.code(401).send({
                    status: 'error',
                    code: 'SQUID_IDENTITY_INVALID',
                    message: 'Invalid identity token',
                    timestamp: new Date().toISOString()
                });
            }
            // Extract identity information from headers
            const squidId = request.headers['x-squid-id'] || identity.squidId;
            const subId = request.headers['x-subid'];
            const daoId = request.headers['x-dao-id'];
            request.user = {
                squidId,
                subId,
                daoId,
                permissions: identity.permissions || []
            };
            logger_1.logger.debug('User authenticated', { squidId, subId, daoId });
        }
        catch (error) {
            logger_1.logger.error('Authentication error:', error);
            return reply.code(401).send({
                status: 'error',
                code: 'AUTHENTICATION_FAILED',
                message: 'Authentication failed',
                timestamp: new Date().toISOString()
            });
        }
    });
}
exports.default = (0, fastify_plugin_1.default)(authMiddleware, {
    name: 'auth-middleware'
});
//# sourceMappingURL=auth.js.map