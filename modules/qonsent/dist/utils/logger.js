"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerHelpers = exports.logger = void 0;
exports.createRequestLogger = createRequestLogger;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("../config");
const loggerConfig = {
    level: config_1.config.logging.level,
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers["x-api-key"]',
            'password',
            'token',
            'secret',
            'key',
        ],
        censor: '[REDACTED]',
    },
};
// Add pretty printing for development
if (config_1.config.isDevelopment) {
    loggerConfig.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
            singleLine: false,
        },
    };
}
exports.logger = (0, pino_1.default)(loggerConfig);
// Add request context to logger
function createRequestLogger(requestId, traceId) {
    return exports.logger.child({
        requestId,
        traceId,
    });
}
// Structured logging helpers
exports.loggerHelpers = {
    logPermissionCheck: (params) => {
        exports.logger.info({
            event: 'permission_check',
            ...params,
        }, `Permission check: ${params.result}`);
    },
    logPermissionGrant: (params) => {
        exports.logger.info({
            event: 'permission_grant',
            ...params,
        }, `Permission granted: ${params.permissions.join(', ')}`);
    },
    logPermissionRevocation: (params) => {
        exports.logger.info({
            event: 'permission_revocation',
            ...params,
        }, `Permission revoked: ${params.revokedPermissions.join(', ')}`);
    },
    logPolicyOperation: (params) => {
        exports.logger.info({
            event: 'policy_operation',
            ...params,
        }, `Policy ${params.operation.toLowerCase()}: ${params.policyName}`);
    },
    logSecurityEvent: (params) => {
        exports.logger.warn({
            event: 'security_event',
            ...params,
        }, `Security event: ${params.eventType}`);
    },
    logServiceHealth: (params) => {
        const logLevel = params.status === 'UP' ? 'debug' : 'warn';
        exports.logger[logLevel]({
            event: 'service_health',
            ...params,
        }, `Service ${params.service}: ${params.status}`);
    },
    logPerformanceMetric: (params) => {
        exports.logger.debug({
            event: 'performance_metric',
            ...params,
        }, `Operation ${params.operation}: ${params.duration}ms`);
    },
};
//# sourceMappingURL=logger.js.map