"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const SquidClient_1 = require("../clients/SquidClient");
const authMiddleware = async (fastify) => {
    const squidClient = new SquidClient_1.SquidClient();
    // Register authentication hook
    fastify.addHook('preHandler', async (request, reply) => {
        // Skip authentication for health checks and documentation
        const skipAuthPaths = ['/health', '/docs', '/documentation'];
        if (skipAuthPaths.some(path => request.url.startsWith(path))) {
            return;
        }
        try {
            const headers = request.headers;
            const authHeader = headers.authorization;
            const squidId = headers['x-squid-id'];
            const subId = headers['x-subid'];
            const signature = headers['x-sig'];
            const timestamp = headers['x-ts'];
            const apiVersion = headers['x-api-version'];
            // Check for required headers
            if (!authHeader && !squidId) {
                throw new errors_1.QonsentError(errors_1.ErrorCodes.INVALID_TOKEN, 'Missing authentication token or sQuid ID');
            }
            // Verify API version
            if (apiVersion && !['v1', 'v2'].includes(apiVersion)) {
                throw new errors_1.QonsentError(errors_1.ErrorCodes.VALIDATION_ERROR, 'Unsupported API version');
            }
            let identity = {};
            // Bearer token authentication
            if (authHeader) {
                const token = authHeader.replace('Bearer ', '');
                if (!token) {
                    throw new errors_1.QonsentError(errors_1.ErrorCodes.INVALID_TOKEN, 'Invalid authorization header format');
                }
                try {
                    // Verify token with sQuid service
                    const verificationResult = await squidClient.verifyToken(token);
                    if (!verificationResult.valid) {
                        throw new errors_1.QonsentError(errors_1.ErrorCodes.INVALID_TOKEN, 'Invalid or expired token');
                    }
                    identity = {
                        squidId: verificationResult.identity.squidId,
                        subId: verificationResult.identity.subId,
                        daoId: verificationResult.identity.daoId,
                        verified: true,
                    };
                }
                catch (error) {
                    logger_1.logger.error('Token verification failed', { error, token: token.substring(0, 10) + '...' });
                    throw new errors_1.QonsentError(errors_1.ErrorCodes.SQUID_SERVICE_ERROR, 'Failed to verify authentication token');
                }
            }
            // Header-based authentication (for MCP and internal services)
            else if (squidId) {
                // Verify signature if provided
                if (signature && timestamp) {
                    try {
                        const isValidSignature = await squidClient.verifySignature({
                            squidId,
                            signature,
                            timestamp,
                            payload: JSON.stringify(request.body || {}),
                        });
                        if (!isValidSignature) {
                            throw new errors_1.QonsentError(errors_1.ErrorCodes.INVALID_TOKEN, 'Invalid signature');
                        }
                    }
                    catch (error) {
                        logger_1.logger.error('Signature verification failed', { error, squidId });
                        throw new errors_1.QonsentError(errors_1.ErrorCodes.SQUID_SERVICE_ERROR, 'Failed to verify signature');
                    }
                }
                // Verify identity exists
                try {
                    const identityExists = await squidClient.verifyIdentity(squidId);
                    if (!identityExists) {
                        throw new errors_1.QonsentError(errors_1.ErrorCodes.IDENTITY_NOT_FOUND, 'Identity not found');
                    }
                    identity = {
                        squidId,
                        subId,
                        verified: !!signature, // Only consider verified if signature was provided
                    };
                }
                catch (error) {
                    logger_1.logger.error('Identity verification failed', { error, squidId });
                    throw new errors_1.QonsentError(errors_1.ErrorCodes.SQUID_SERVICE_ERROR, 'Failed to verify identity');
                }
            }
            // Attach identity to request
            request.identity = identity;
            // Log authentication success
            logger_1.logger.debug('Authentication successful', {
                squidId: identity.squidId,
                subId: identity.subId,
                verified: identity.verified,
                method: request.method,
                url: request.url,
            });
        }
        catch (error) {
            logger_1.logger.warn('Authentication failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                method: request.method,
                url: request.url,
                headers: {
                    'x-squid-id': request.headers['x-squid-id'],
                    'user-agent': request.headers['user-agent'],
                },
            });
            if (error instanceof errors_1.QonsentError) {
                throw error;
            }
            throw new errors_1.QonsentError(errors_1.ErrorCodes.INTERNAL_SERVER_ERROR, 'Authentication processing failed');
        }
    });
    // Helper function to check if user has admin permissions
    fastify.decorate('requireAdmin', async (request, reply) => {
        if (!request.identity?.verified) {
            throw new errors_1.QonsentError(errors_1.ErrorCodes.INSUFFICIENT_PERMISSIONS, 'Admin access requires verified identity');
        }
        // Additional admin checks could be added here
        // For now, we assume verified identities can perform admin actions
    });
    // Helper function to get current identity
    fastify.decorate('getCurrentIdentity', (request) => {
        return request.identity;
    });
};
exports.authMiddleware = authMiddleware;
exports.default = (0, fastify_plugin_1.default)(authMiddleware, {
    name: 'auth-middleware',
});
//# sourceMappingURL=auth.js.map