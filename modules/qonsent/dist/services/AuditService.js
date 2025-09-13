"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const eventBus_1 = require("../utils/eventBus");
const config_1 = require("../config");
class AuditService {
    constructor() {
        this.eventBus = eventBus_1.EventBus.getInstance();
    }
    /**
     * Log a permission check event
     */
    async logPermissionCheck(params) {
        if (!config_1.config.features.auditLogging) {
            return;
        }
        try {
            const auditEvent = {
                eventId: (0, uuid_1.v4)(),
                timestamp: new Date(),
                eventType: 'PERMISSION_CHECK',
                severity: params.result === 'ERROR' ? 'ERROR' : 'INFO',
                actor: {
                    identity: params.identity,
                },
                resource: {
                    id: params.resource,
                    type: this.extractResourceType(params.resource),
                },
                action: {
                    type: params.action,
                    result: params.result,
                    reason: params.reason,
                },
                context: {
                    checkId: params.checkId,
                    responseTime: params.responseTime,
                    cacheHit: params.cacheHit || false,
                    ...params.context,
                },
            };
            // Log locally
            logger_1.loggerHelpers.logPermissionCheck(params);
            // Send to audit system (Qerberos)
            await this.sendToAuditSystem(auditEvent);
            // Publish audit event
            await this.publishAuditEvent(auditEvent);
        }
        catch (error) {
            logger_1.logger.error('Failed to log permission check audit', { error, params });
            // Don't throw - audit failures shouldn't break the main flow
        }
    }
    /**
     * Log a permission grant event
     */
    async logPermissionGrant(params) {
        if (!config_1.config.features.auditLogging) {
            return;
        }
        try {
            const auditEvent = {
                eventId: (0, uuid_1.v4)(),
                timestamp: new Date(),
                eventType: 'PERMISSION_GRANTED',
                severity: 'INFO',
                actor: {
                    identity: params.grantedBy,
                },
                resource: {
                    id: params.resource,
                    type: this.extractResourceType(params.resource),
                },
                action: {
                    type: 'grant',
                    result: 'ALLOWED',
                    reason: `Granted permissions: ${params.permissions.join(', ')}`,
                },
                context: {
                    grantId: params.grantId,
                    targetIdentity: params.identity,
                    permissions: params.permissions,
                    expiresAt: params.expiresAt?.toISOString(),
                    conditions: params.conditions,
                },
            };
            // Log locally
            logger_1.loggerHelpers.logPermissionGrant(params);
            // Send to audit system
            await this.sendToAuditSystem(auditEvent);
            // Publish audit event
            await this.publishAuditEvent(auditEvent);
        }
        catch (error) {
            logger_1.logger.error('Failed to log permission grant audit', { error, params });
        }
    }
    /**
     * Log a permission revocation event
     */
    async logPermissionRevocation(params) {
        if (!config_1.config.features.auditLogging) {
            return;
        }
        try {
            const auditEvent = {
                eventId: (0, uuid_1.v4)(),
                timestamp: new Date(),
                eventType: 'PERMISSION_REVOKED',
                severity: 'INFO',
                actor: {
                    identity: params.revokedBy,
                },
                resource: {
                    id: params.resource,
                    type: this.extractResourceType(params.resource),
                },
                action: {
                    type: 'revoke',
                    result: 'ALLOWED',
                    reason: params.reason || `Revoked permissions: ${params.revokedPermissions.join(', ')}`,
                },
                context: {
                    targetIdentity: params.identity,
                    revokedPermissions: params.revokedPermissions,
                    reason: params.reason,
                },
            };
            // Log locally
            logger_1.loggerHelpers.logPermissionRevocation(params);
            // Send to audit system
            await this.sendToAuditSystem(auditEvent);
            // Publish audit event
            await this.publishAuditEvent(auditEvent);
        }
        catch (error) {
            logger_1.logger.error('Failed to log permission revocation audit', { error, params });
        }
    }
    /**
     * Log a security event
     */
    async logSecurityEvent(params) {
        if (!config_1.config.features.auditLogging) {
            return;
        }
        try {
            const auditEvent = {
                eventId: (0, uuid_1.v4)(),
                timestamp: new Date(),
                eventType: params.eventType,
                severity: params.severity === 'CRITICAL' ? 'CRITICAL' :
                    params.severity === 'HIGH' ? 'ERROR' :
                        params.severity === 'MEDIUM' ? 'WARN' : 'INFO',
                actor: {
                    identity: params.identity || 'unknown',
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent,
                },
                resource: params.resource ? {
                    id: params.resource,
                    type: this.extractResourceType(params.resource),
                } : undefined,
                action: {
                    type: 'security_event',
                    result: 'DENIED',
                    reason: `Security event: ${params.eventType}`,
                },
                context: params.details,
            };
            // Log locally
            logger_1.loggerHelpers.logSecurityEvent({
                eventType: params.eventType,
                severity: params.severity,
                identity: params.identity,
                resource: params.resource,
                details: params.details,
            });
            // Send to audit system with high priority
            await this.sendToAuditSystem(auditEvent, true);
            // Publish security event
            await this.publishSecurityEvent(auditEvent);
        }
        catch (error) {
            logger_1.logger.error('Failed to log security event audit', { error, params });
        }
    }
    /**
     * Log a policy operation event
     */
    async logPolicyOperation(params) {
        if (!config_1.config.features.auditLogging) {
            return;
        }
        try {
            const auditEvent = {
                eventId: (0, uuid_1.v4)(),
                timestamp: new Date(),
                eventType: 'POLICY_OPERATION',
                severity: 'INFO',
                actor: {
                    identity: params.performedBy,
                },
                action: {
                    type: params.operation.toLowerCase(),
                    result: 'ALLOWED',
                    reason: `Policy ${params.operation.toLowerCase()}: ${params.policyName}`,
                },
                context: {
                    policyId: params.policyId,
                    policyName: params.policyName,
                    operation: params.operation,
                    ...params.details,
                },
            };
            // Log locally
            logger_1.loggerHelpers.logPolicyOperation({
                operation: params.operation,
                policyId: params.policyId,
                policyName: params.policyName,
                performedBy: params.performedBy,
            });
            // Send to audit system
            await this.sendToAuditSystem(auditEvent);
            // Publish audit event
            await this.publishAuditEvent(auditEvent);
        }
        catch (error) {
            logger_1.logger.error('Failed to log policy operation audit', { error, params });
        }
    }
    /**
     * Send audit event to Qerberos audit system
     */
    async sendToAuditSystem(auditEvent, highPriority = false) {
        try {
            // In a real implementation, this would send to Qerberos service
            // For now, we'll just log it
            logger_1.logger.debug('Sending audit event to Qerberos', {
                eventId: auditEvent.eventId,
                eventType: auditEvent.eventType,
                severity: auditEvent.severity,
                highPriority,
            });
            // Mock implementation - in production this would be an HTTP call to Qerberos
            if (config_1.config.isDevelopment) {
                return;
            }
            // Example implementation:
            // const response = await fetch(`${config.services.qerberos.baseUrl}/api/v1/audit`, {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //     'x-priority': highPriority ? 'high' : 'normal',
            //   },
            //   body: JSON.stringify(auditEvent),
            // });
        }
        catch (error) {
            logger_1.logger.error('Failed to send audit event to Qerberos', { error, eventId: auditEvent.eventId });
        }
    }
    /**
     * Publish audit event to event bus
     */
    async publishAuditEvent(auditEvent) {
        try {
            await this.eventBus.publish('q.qonsent.audit.v1', {
                eventId: auditEvent.eventId,
                timestamp: auditEvent.timestamp.toISOString(),
                source: 'qonsent',
                type: 'q.qonsent.audit.v1',
                data: auditEvent,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to publish audit event', { error, eventId: auditEvent.eventId });
        }
    }
    /**
     * Publish security event to event bus
     */
    async publishSecurityEvent(auditEvent) {
        try {
            await this.eventBus.publish('q.qonsent.security.alert.v1', {
                eventId: auditEvent.eventId,
                timestamp: auditEvent.timestamp.toISOString(),
                source: 'qonsent',
                type: 'q.qonsent.security.alert.v1',
                data: auditEvent,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to publish security event', { error, eventId: auditEvent.eventId });
        }
    }
    /**
     * Extract resource type from resource identifier
     */
    extractResourceType(resource) {
        const parts = resource.split(':');
        return parts.length >= 2 ? parts[1] : 'unknown';
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=AuditService.js.map