"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
async function errorHandler(error, request, reply) {
    const timestamp = new Date().toISOString();
    const requestId = request.id;
    // Log the error
    logger_1.logger.error('Request error', {
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            stack: error.stack,
        },
        request: {
            method: request.method,
            url: request.url,
            headers: {
                'user-agent': request.headers['user-agent'],
                'x-squid-id': request.headers['x-squid-id'],
            },
            body: request.body,
        },
        requestId,
    });
    // Handle QonsentError
    if (error instanceof errors_1.QonsentError) {
        const errorResponse = {
            status: 'error',
            code: error.code,
            message: error.message,
            details: error.details,
            timestamp,
            requestId,
            retryable: error.retryable,
            suggestedActions: (0, errors_1.getErrorSuggestedActions)(error.code),
        };
        reply.code(error.statusCode).send(errorResponse);
        return;
    }
    // Handle Fastify validation errors
    if (error.validation) {
        const errorResponse = {
            status: 'error',
            code: errors_1.ErrorCodes.VALIDATION_ERROR,
            message: 'Request validation failed',
            details: {
                validation: error.validation,
                validationContext: error.validationContext,
            },
            timestamp,
            requestId,
            retryable: false,
            suggestedActions: ['Check request format', 'Validate input parameters'],
        };
        reply.code(400).send(errorResponse);
        return;
    }
    // Handle rate limiting errors
    if (error.statusCode === 429) {
        const errorResponse = {
            status: 'error',
            code: errors_1.ErrorCodes.RATE_LIMIT_EXCEEDED,
            message: 'Rate limit exceeded',
            details: {
                limit: error.message,
            },
            timestamp,
            requestId,
            retryable: true,
            suggestedActions: ['Wait before retrying', 'Reduce request frequency'],
        };
        reply.code(429).send(errorResponse);
        return;
    }
    // Handle authentication errors
    if (error.statusCode === 401) {
        const errorResponse = {
            status: 'error',
            code: errors_1.ErrorCodes.INVALID_TOKEN,
            message: error.message || 'Authentication required',
            timestamp,
            requestId,
            retryable: false,
            suggestedActions: ['Provide valid authentication token', 'Check token format'],
        };
        reply.code(401).send(errorResponse);
        return;
    }
    // Handle authorization errors
    if (error.statusCode === 403) {
        const errorResponse = {
            status: 'error',
            code: errors_1.ErrorCodes.INSUFFICIENT_PERMISSIONS,
            message: error.message || 'Insufficient permissions',
            timestamp,
            requestId,
            retryable: false,
            suggestedActions: ['Request additional permissions', 'Contact resource owner'],
        };
        reply.code(403).send(errorResponse);
        return;
    }
    // Handle not found errors
    if (error.statusCode === 404) {
        const errorResponse = {
            status: 'error',
            code: 'RESOURCE_NOT_FOUND',
            message: error.message || 'Resource not found',
            timestamp,
            requestId,
            retryable: false,
            suggestedActions: ['Check resource identifier', 'Verify resource exists'],
        };
        reply.code(404).send(errorResponse);
        return;
    }
    // Handle timeout errors
    if (error.code === 'TIMEOUT' || error.message.includes('timeout')) {
        const errorResponse = {
            status: 'error',
            code: errors_1.ErrorCodes.TIMEOUT_ERROR,
            message: 'Request timeout',
            details: {
                timeout: error.message,
            },
            timestamp,
            requestId,
            retryable: true,
            suggestedActions: ['Retry the request', 'Check network connectivity'],
        };
        reply.code(504).send(errorResponse);
        return;
    }
    // Handle database connection errors
    if (error.message.includes('MongoError') || error.message.includes('connection')) {
        const errorResponse = {
            status: 'error',
            code: errors_1.ErrorCodes.DATABASE_CONNECTION_ERROR,
            message: 'Database connection error',
            timestamp,
            requestId,
            retryable: true,
            suggestedActions: ['Retry after a delay', 'Check service status'],
        };
        reply.code(503).send(errorResponse);
        return;
    }
    // Handle generic HTTP errors
    if (error.statusCode && error.statusCode >= 400) {
        const errorResponse = {
            status: 'error',
            code: 'HTTP_ERROR',
            message: error.message || 'HTTP error',
            details: {
                statusCode: error.statusCode,
                code: error.code,
            },
            timestamp,
            requestId,
            retryable: error.statusCode >= 500,
            suggestedActions: error.statusCode >= 500
                ? ['Retry after a delay', 'Check service status']
                : ['Check request format', 'Validate input parameters'],
        };
        reply.code(error.statusCode).send(errorResponse);
        return;
    }
    // Handle unknown errors
    const errorResponse = {
        status: 'error',
        code: errors_1.ErrorCodes.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        details: {
            error: error.name,
            message: error.message,
        },
        timestamp,
        requestId,
        retryable: true,
        suggestedActions: ['Retry after a delay', 'Contact support if the issue persists'],
    };
    reply.code(500).send(errorResponse);
}
//# sourceMappingURL=errorHandler.js.map