"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SquidClient = void 0;
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class SquidClient {
    constructor() {
        this.baseUrl = config_1.config.services.squid.baseUrl;
        this.timeout = config_1.config.services.squid.timeout;
    }
    /**
     * Verify a JWT token with the sQuid service
     */
    async verifyToken(token) {
        try {
            logger_1.logger.debug('Verifying token with sQuid service', {
                baseUrl: this.baseUrl,
                tokenPrefix: token.substring(0, 10) + '...'
            });
            // In development mode with mock services, return a mock response
            if (config_1.config.isDevelopment && this.baseUrl.includes('mock')) {
                return this.getMockTokenVerification(token);
            }
            const response = await fetch(`${this.baseUrl}/api/v1/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                signal: AbortSignal.timeout(this.timeout),
            });
            if (!response.ok) {
                if (response.status === 401) {
                    return { valid: false, identity: { squidId: '' } };
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                valid: data.valid,
                identity: {
                    squidId: data.identity.squidId,
                    subId: data.identity.subId,
                    daoId: data.identity.daoId,
                },
                expiresAt: data.expiresAt,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to verify token with sQuid service', { error, baseUrl: this.baseUrl });
            if (error instanceof Error && error.name === 'TimeoutError') {
                throw new errors_1.QonsentError(errors_1.ErrorCodes.TIMEOUT_ERROR, 'sQuid service timeout', { service: 'squid', operation: 'verifyToken' }, true);
            }
            throw new errors_1.QonsentError(errors_1.ErrorCodes.SQUID_SERVICE_ERROR, 'Failed to verify token', { service: 'squid', operation: 'verifyToken' }, true);
        }
    }
    /**
     * Verify a signature with the sQuid service
     */
    async verifySignature(params) {
        try {
            logger_1.logger.debug('Verifying signature with sQuid service', {
                squidId: params.squidId,
                timestamp: params.timestamp
            });
            // In development mode with mock services, return a mock response
            if (config_1.config.isDevelopment && this.baseUrl.includes('mock')) {
                return this.getMockSignatureVerification(params);
            }
            const response = await fetch(`${this.baseUrl}/api/v1/auth/verify-signature`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
                signal: AbortSignal.timeout(this.timeout),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return data.valid;
        }
        catch (error) {
            logger_1.logger.error('Failed to verify signature with sQuid service', { error, squidId: params.squidId });
            if (error instanceof Error && error.name === 'TimeoutError') {
                throw new errors_1.QonsentError(errors_1.ErrorCodes.TIMEOUT_ERROR, 'sQuid service timeout', { service: 'squid', operation: 'verifySignature' }, true);
            }
            throw new errors_1.QonsentError(errors_1.ErrorCodes.SQUID_SERVICE_ERROR, 'Failed to verify signature', { service: 'squid', operation: 'verifySignature' }, true);
        }
    }
    /**
     * Verify that an identity exists
     */
    async verifyIdentity(squidId) {
        try {
            logger_1.logger.debug('Verifying identity with sQuid service', { squidId });
            // In development mode with mock services, return a mock response
            if (config_1.config.isDevelopment && this.baseUrl.includes('mock')) {
                return this.getMockIdentityVerification(squidId);
            }
            const response = await fetch(`${this.baseUrl}/api/v1/identity/${squidId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.timeout),
            });
            return response.ok;
        }
        catch (error) {
            logger_1.logger.error('Failed to verify identity with sQuid service', { error, squidId });
            if (error instanceof Error && error.name === 'TimeoutError') {
                throw new errors_1.QonsentError(errors_1.ErrorCodes.TIMEOUT_ERROR, 'sQuid service timeout', { service: 'squid', operation: 'verifyIdentity' }, true);
            }
            throw new errors_1.QonsentError(errors_1.ErrorCodes.SQUID_SERVICE_ERROR, 'Failed to verify identity', { service: 'squid', operation: 'verifyIdentity' }, true);
        }
    }
    /**
     * Mock token verification for development
     */
    getMockTokenVerification(token) {
        // Simple mock logic - in real implementation this would be more sophisticated
        if (token === 'invalid-token') {
            return { valid: false, identity: { squidId: '' } };
        }
        return {
            valid: true,
            identity: {
                squidId: 'did:squid:test-user',
                subId: 'did:squid:test-user:work',
                daoId: 'dao:test-dao',
            },
            expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        };
    }
    /**
     * Mock signature verification for development
     */
    getMockSignatureVerification(params) {
        // Simple mock logic - accept any signature that's not 'invalid'
        return params.signature !== 'invalid-signature';
    }
    /**
     * Mock identity verification for development
     */
    getMockIdentityVerification(squidId) {
        // Simple mock logic - accept any identity that doesn't contain 'invalid'
        return !squidId.includes('invalid');
    }
}
exports.SquidClient = SquidClient;
//# sourceMappingURL=SquidClient.js.map