"use strict";
/**
 * Identity HTTP Handlers
 * Express route handlers for identity operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityHandlers = void 0;
const uuid_1 = require("uuid");
class IdentityHandlers {
    constructor(identityService) {
        this.identityService = identityService;
        /**
         * Create new root identity
         */
        this.createIdentity = async (req, res) => {
            try {
                const request = req.body;
                const context = this.createRequestContext(req);
                const identity = await this.identityService.createIdentity(request, context);
                const response = {
                    status: 'ok',
                    code: 'IDENTITY_CREATED',
                    message: 'Identity created successfully',
                    data: identity,
                    timestamp: new Date(),
                    requestId: context.requestId
                };
                res.status(201).json(response);
            }
            catch (error) {
                this.handleError(res, error, 'IDENTITY_CREATION_FAILED');
            }
        };
        /**
         * Get identity information
         */
        this.getIdentity = async (req, res) => {
            try {
                const { identityId } = req.params;
                const context = this.createRequestContext(req);
                const identity = await this.identityService.getIdentity(identityId);
                if (!identity) {
                    const response = {
                        status: 'error',
                        code: 'IDENTITY_NOT_FOUND',
                        message: 'Identity not found',
                        timestamp: new Date(),
                        requestId: context.requestId,
                        retryable: false
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    status: 'ok',
                    code: 'IDENTITY_RETRIEVED',
                    message: 'Identity retrieved successfully',
                    data: identity,
                    timestamp: new Date(),
                    requestId: context.requestId
                };
                res.status(200).json(response);
            }
            catch (error) {
                this.handleError(res, error, 'IDENTITY_RETRIEVAL_FAILED');
            }
        };
        /**
         * Create subidentity
         */
        this.createSubidentity = async (req, res) => {
            try {
                const { identityId } = req.params;
                const request = req.body;
                const context = this.createRequestContext(req);
                const subidentity = await this.identityService.createSubidentity(identityId, request, context);
                const response = {
                    status: 'ok',
                    code: 'SUBIDENTITY_CREATED',
                    message: 'Subidentity created successfully',
                    data: subidentity,
                    timestamp: new Date(),
                    requestId: context.requestId
                };
                res.status(201).json(response);
            }
            catch (error) {
                this.handleError(res, error, 'SUBIDENTITY_CREATION_FAILED');
            }
        };
        /**
         * Submit identity verification
         */
        this.submitVerification = async (req, res) => {
            try {
                const { identityId } = req.params;
                const request = req.body;
                const context = this.createRequestContext(req);
                const identity = await this.identityService.submitVerification(identityId, request, context);
                const response = {
                    status: 'ok',
                    code: 'VERIFICATION_SUBMITTED',
                    message: 'Verification submitted successfully',
                    data: identity,
                    timestamp: new Date(),
                    requestId: context.requestId
                };
                res.status(200).json(response);
            }
            catch (error) {
                this.handleError(res, error, 'VERIFICATION_SUBMISSION_FAILED');
            }
        };
        /**
         * Get identity reputation
         */
        this.getReputation = async (req, res) => {
            try {
                const { identityId } = req.params;
                const context = this.createRequestContext(req);
                const reputation = await this.identityService.getReputation(identityId);
                const response = {
                    status: 'ok',
                    code: 'REPUTATION_RETRIEVED',
                    message: 'Reputation retrieved successfully',
                    data: {
                        identityId,
                        ...reputation
                    },
                    timestamp: new Date(),
                    requestId: context.requestId
                };
                res.status(200).json(response);
            }
            catch (error) {
                this.handleError(res, error, 'REPUTATION_RETRIEVAL_FAILED');
            }
        };
        /**
         * Update identity
         */
        this.updateIdentity = async (req, res) => {
            try {
                const { identityId } = req.params;
                const updates = req.body;
                const context = this.createRequestContext(req);
                const identity = await this.identityService.updateIdentity(identityId, updates, context);
                const response = {
                    status: 'ok',
                    code: 'IDENTITY_UPDATED',
                    message: 'Identity updated successfully',
                    data: identity,
                    timestamp: new Date(),
                    requestId: context.requestId
                };
                res.status(200).json(response);
            }
            catch (error) {
                this.handleError(res, error, 'IDENTITY_UPDATE_FAILED');
            }
        };
        /**
         * Delete identity
         */
        this.deleteIdentity = async (req, res) => {
            try {
                const { identityId } = req.params;
                const context = this.createRequestContext(req);
                await this.identityService.deleteIdentity(identityId, context);
                const response = {
                    status: 'ok',
                    code: 'IDENTITY_DELETED',
                    message: 'Identity deleted successfully',
                    timestamp: new Date(),
                    requestId: context.requestId
                };
                res.status(200).json(response);
            }
            catch (error) {
                this.handleError(res, error, 'IDENTITY_DELETION_FAILED');
            }
        };
    }
    createRequestContext(req) {
        return {
            requestId: (0, uuid_1.v4)(),
            timestamp: new Date(),
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent'),
            sessionId: req.get('x-session-id'),
            identityId: req.get('x-squid-id'),
            deviceFingerprint: req.get('x-device-fingerprint')
        };
    }
    handleError(res, error, code) {
        console.error(`[sQuid Handler] ${code}:`, error);
        let statusCode = 500;
        let message = 'Internal server error';
        let retryable = true;
        // Map specific errors to appropriate HTTP status codes
        if (error.message.includes('not found')) {
            statusCode = 404;
            message = error.message;
            retryable = false;
        }
        else if (error.message.includes('Invalid') || error.message.includes('required')) {
            statusCode = 400;
            message = error.message;
            retryable = false;
        }
        else if (error.message.includes('permission') || error.message.includes('authorized')) {
            statusCode = 403;
            message = error.message;
            retryable = false;
        }
        else if (error.message.includes('already exists') || error.message.includes('already submitted')) {
            statusCode = 409;
            message = error.message;
            retryable = false;
        }
        const response = {
            status: 'error',
            code,
            message,
            details: {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            timestamp: new Date(),
            requestId: (0, uuid_1.v4)(),
            retryable
        };
        res.status(statusCode).json(response);
    }
}
exports.IdentityHandlers = IdentityHandlers;
//# sourceMappingURL=identityHandlers.js.map