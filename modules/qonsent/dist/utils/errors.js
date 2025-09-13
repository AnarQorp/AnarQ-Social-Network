"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QonsentError = exports.ErrorCodes = void 0;
exports.isRetryableError = isRetryableError;
exports.getErrorSuggestedActions = getErrorSuggestedActions;
var ErrorCodes;
(function (ErrorCodes) {
    // Authentication & Authorization
    ErrorCodes["INVALID_TOKEN"] = "INVALID_TOKEN";
    ErrorCodes["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCodes["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCodes["IDENTITY_NOT_FOUND"] = "IDENTITY_NOT_FOUND";
    // Permission Management
    ErrorCodes["PERMISSION_CHECK_FAILED"] = "PERMISSION_CHECK_FAILED";
    ErrorCodes["PERMISSION_GRANT_FAILED"] = "PERMISSION_GRANT_FAILED";
    ErrorCodes["PERMISSION_REVOKE_FAILED"] = "PERMISSION_REVOKE_FAILED";
    ErrorCodes["PERMISSION_LIST_FAILED"] = "PERMISSION_LIST_FAILED";
    ErrorCodes["INVALID_PERMISSIONS"] = "INVALID_PERMISSIONS";
    ErrorCodes["GRANT_NOT_FOUND"] = "GRANT_NOT_FOUND";
    // Policy Management
    ErrorCodes["POLICY_CREATION_FAILED"] = "POLICY_CREATION_FAILED";
    ErrorCodes["POLICY_UPDATE_FAILED"] = "POLICY_UPDATE_FAILED";
    ErrorCodes["POLICY_DELETE_FAILED"] = "POLICY_DELETE_FAILED";
    ErrorCodes["POLICY_NOT_FOUND"] = "POLICY_NOT_FOUND";
    ErrorCodes["POLICY_EVALUATION_FAILED"] = "POLICY_EVALUATION_FAILED";
    ErrorCodes["INVALID_POLICY_FORMAT"] = "INVALID_POLICY_FORMAT";
    // Validation
    ErrorCodes["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCodes["INVALID_RESOURCE_FORMAT"] = "INVALID_RESOURCE_FORMAT";
    ErrorCodes["INVALID_IDENTITY_FORMAT"] = "INVALID_IDENTITY_FORMAT";
    ErrorCodes["INVALID_ACTION"] = "INVALID_ACTION";
    // External Services
    ErrorCodes["SQUID_SERVICE_ERROR"] = "SQUID_SERVICE_ERROR";
    ErrorCodes["QERBEROS_SERVICE_ERROR"] = "QERBEROS_SERVICE_ERROR";
    ErrorCodes["QLOCK_SERVICE_ERROR"] = "QLOCK_SERVICE_ERROR";
    ErrorCodes["QINDEX_SERVICE_ERROR"] = "QINDEX_SERVICE_ERROR";
    // Database
    ErrorCodes["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCodes["DATABASE_CONNECTION_ERROR"] = "DATABASE_CONNECTION_ERROR";
    // Cache
    ErrorCodes["CACHE_ERROR"] = "CACHE_ERROR";
    ErrorCodes["CACHE_CONNECTION_ERROR"] = "CACHE_CONNECTION_ERROR";
    // Event Bus
    ErrorCodes["EVENT_PUBLISH_FAILED"] = "EVENT_PUBLISH_FAILED";
    ErrorCodes["EVENT_BUS_CONNECTION_ERROR"] = "EVENT_BUS_CONNECTION_ERROR";
    // Rate Limiting
    ErrorCodes["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    // General
    ErrorCodes["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCodes["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCodes["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ErrorCodes["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
})(ErrorCodes || (exports.ErrorCodes = ErrorCodes = {}));
class QonsentError extends Error {
    constructor(code, message, details, retryable = false) {
        super(message);
        this.name = 'QonsentError';
        this.code = code;
        this.details = details;
        this.retryable = retryable;
        this.statusCode = this.getStatusCode(code);
        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, QonsentError);
        }
    }
    getStatusCode(code) {
        switch (code) {
            case ErrorCodes.INVALID_TOKEN:
            case ErrorCodes.TOKEN_EXPIRED:
                return 401;
            case ErrorCodes.INSUFFICIENT_PERMISSIONS:
                return 403;
            case ErrorCodes.GRANT_NOT_FOUND:
            case ErrorCodes.POLICY_NOT_FOUND:
            case ErrorCodes.IDENTITY_NOT_FOUND:
                return 404;
            case ErrorCodes.VALIDATION_ERROR:
            case ErrorCodes.INVALID_PERMISSIONS:
            case ErrorCodes.INVALID_RESOURCE_FORMAT:
            case ErrorCodes.INVALID_IDENTITY_FORMAT:
            case ErrorCodes.INVALID_ACTION:
            case ErrorCodes.INVALID_POLICY_FORMAT:
                return 400;
            case ErrorCodes.RATE_LIMIT_EXCEEDED:
                return 429;
            case ErrorCodes.SERVICE_UNAVAILABLE:
            case ErrorCodes.DATABASE_CONNECTION_ERROR:
            case ErrorCodes.CACHE_CONNECTION_ERROR:
            case ErrorCodes.EVENT_BUS_CONNECTION_ERROR:
                return 503;
            case ErrorCodes.TIMEOUT_ERROR:
                return 504;
            default:
                return 500;
        }
    }
    toJSON() {
        return {
            status: 'error',
            code: this.code,
            message: this.message,
            details: this.details,
            retryable: this.retryable,
            timestamp: new Date().toISOString(),
        };
    }
    static fromError(error, code = ErrorCodes.INTERNAL_SERVER_ERROR) {
        if (error instanceof QonsentError) {
            return error;
        }
        return new QonsentError(code, error.message, { originalError: error.name, stack: error.stack });
    }
}
exports.QonsentError = QonsentError;
function isRetryableError(error) {
    if (error instanceof QonsentError) {
        return error.retryable;
    }
    // Consider network errors and timeouts as retryable
    const retryablePatterns = [
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ENOTFOUND/,
        /socket hang up/,
    ];
    return retryablePatterns.some(pattern => pattern.test(error.message));
}
function getErrorSuggestedActions(code) {
    switch (code) {
        case ErrorCodes.INVALID_TOKEN:
            return ['Obtain a new authentication token', 'Check token format'];
        case ErrorCodes.TOKEN_EXPIRED:
            return ['Refresh the authentication token', 'Re-authenticate'];
        case ErrorCodes.INSUFFICIENT_PERMISSIONS:
            return ['Request additional permissions', 'Contact resource owner'];
        case ErrorCodes.RATE_LIMIT_EXCEEDED:
            return ['Wait before retrying', 'Reduce request frequency'];
        case ErrorCodes.SERVICE_UNAVAILABLE:
            return ['Retry after a delay', 'Check service status'];
        case ErrorCodes.VALIDATION_ERROR:
            return ['Check request format', 'Validate input parameters'];
        default:
            return ['Contact support if the issue persists'];
    }
}
//# sourceMappingURL=errors.js.map