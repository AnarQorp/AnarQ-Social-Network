/**
 * WASM Egress Controls and Capability Tokens
 *
 * Implements host shims for Q-module calls with deny-by-default policy,
 * per-step capability tokens (expiring, DAO-approved), and argument-bounded
 * capability tokens signed by DAO policy
 */
import { EventEmitter } from 'events';
import { qflowEventEmitter } from '../events/EventEmitter.js';
/**
 * Capability Token Manager with Egress Controls
 */
export class CapabilityTokenManager extends EventEmitter {
    tokens = new Map();
    hostShims = new Map();
    daoPolicies = new Map();
    egressRequests = [];
    rateLimitTracking = new Map(); // tokenId -> operation -> rateLimit
    isRunning = false;
    // Default host shims for Q-module integration
    DEFAULT_SHIMS = [
        {
            moduleName: 'qmail',
            functionName: 'sendEmail',
            requiredCapability: 'qmail.send',
            denyByDefault: true,
            auditLog: true
        },
        {
            moduleName: 'qpic',
            functionName: 'processImage',
            requiredCapability: 'qpic.process',
            denyByDefault: true,
            auditLog: true
        },
        {
            moduleName: 'qlock',
            functionName: 'encrypt',
            requiredCapability: 'qlock.encrypt',
            denyByDefault: false,
            auditLog: true
        },
        {
            moduleName: 'qonsent',
            functionName: 'checkPermission',
            requiredCapability: 'qonsent.check',
            denyByDefault: false,
            auditLog: true
        },
        {
            moduleName: 'qindex',
            functionName: 'search',
            requiredCapability: 'qindex.search',
            denyByDefault: false,
            auditLog: true
        },
        {
            moduleName: 'qerberos',
            functionName: 'validateIntegrity',
            requiredCapability: 'qerberos.validate',
            denyByDefault: false,
            auditLog: true
        }
    ];
    constructor() {
        super();
        this.setupDefaultShims();
        this.startTokenCleanup();
    }
    /**
     * Start capability token manager
     */
    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        console.log('[CapabilityTokenManager] Started capability token management');
        // Emit started event
        await qflowEventEmitter.emit('q.qflow.capability.manager.started.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-capability-manager',
            actor: 'system',
            data: {
                activeTokens: this.tokens.size,
                hostShims: this.hostShims.size
            }
        });
    }
    /**
     * Stop capability token manager
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        console.log('[CapabilityTokenManager] Stopped capability token management');
    }
    /**
     * Issue capability token
     */
    async issueToken(sandboxId, executionId, stepId, capability, permissions, constraints, daoSubnet, durationMs = 300000 // 5 minutes default
    ) {
        const tokenId = this.generateTokenId();
        // Check DAO policy
        const policy = this.daoPolicies.get(daoSubnet);
        if (policy) {
            const capabilityPolicy = policy.capabilities[capability];
            if (!capabilityPolicy || !capabilityPolicy.allowed) {
                throw new Error(`Capability ${capability} not allowed by DAO policy`);
            }
            if (capabilityPolicy.approvalRequired) {
                throw new Error(`Capability ${capability} requires DAO approval`);
            }
            if (durationMs > capabilityPolicy.maxDuration) {
                throw new Error(`Token duration exceeds DAO policy limit: ${durationMs} > ${capabilityPolicy.maxDuration}`);
            }
            // Merge policy constraints
            constraints = this.mergeConstraints(constraints, capabilityPolicy.constraints);
        }
        const token = {
            tokenId,
            sandboxId,
            executionId,
            stepId,
            capability,
            permissions,
            constraints,
            metadata: {
                issuedBy: 'qflow-capability-manager',
                daoSubnet,
                daoApproved: !!policy,
                issuedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + durationMs).toISOString(),
                maxUsage: constraints.rateLimits?.[0]?.maxRequests || 100,
                currentUsage: 0
            },
            signature: await this.signToken(tokenId, capability, daoSubnet),
            status: 'active'
        };
        // Store token
        this.tokens.set(tokenId, token);
        // Initialize rate limit tracking
        if (constraints.rateLimits) {
            const rateLimits = new Map();
            for (const rateLimit of constraints.rateLimits) {
                rateLimits.set(rateLimit.operation, { ...rateLimit });
            }
            this.rateLimitTracking.set(tokenId, rateLimits);
        }
        console.log(`[CapabilityTokenManager] Issued token: ${tokenId} (capability: ${capability})`);
        // Emit token issued event
        await qflowEventEmitter.emit('q.qflow.capability.token.issued.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-capability-manager',
            actor: 'system',
            data: {
                tokenId,
                sandboxId,
                executionId,
                stepId,
                capability,
                daoSubnet,
                expiresAt: token.metadata.expiresAt
            }
        });
        return tokenId;
    }
    /**
     * Validate and use capability token
     */
    async useToken(tokenId, moduleName, functionName, args) {
        const token = this.tokens.get(tokenId);
        if (!token) {
            return { allowed: false, reason: 'Token not found' };
        }
        // Check token status
        if (token.status !== 'active') {
            return { allowed: false, reason: `Token status: ${token.status}` };
        }
        // Check expiration
        if (new Date() > new Date(token.metadata.expiresAt)) {
            token.status = 'expired';
            return { allowed: false, reason: 'Token expired' };
        }
        // Check usage limits
        if (token.metadata.currentUsage >= token.metadata.maxUsage) {
            token.status = 'exhausted';
            return { allowed: false, reason: 'Token usage exhausted' };
        }
        // Find host shim
        const shimKey = `${moduleName}.${functionName}`;
        const shim = this.hostShims.get(shimKey);
        if (!shim) {
            return { allowed: false, reason: `No host shim found for ${shimKey}` };
        }
        // Check if capability matches
        if (shim.requiredCapability !== token.capability) {
            return { allowed: false, reason: `Capability mismatch: required ${shim.requiredCapability}, got ${token.capability}` };
        }
        // Validate constraints
        const constraintValidation = await this.validateConstraints(token, args);
        if (!constraintValidation.valid) {
            return { allowed: false, reason: constraintValidation.reason };
        }
        // Check rate limits
        const rateLimitCheck = await this.checkRateLimit(tokenId, functionName);
        if (!rateLimitCheck.allowed) {
            return { allowed: false, reason: rateLimitCheck.reason };
        }
        // Create egress request
        const requestId = this.generateRequestId();
        const egressRequest = {
            requestId,
            sandboxId: token.sandboxId,
            tokenId,
            moduleName,
            functionName,
            arguments: args,
            timestamp: new Date().toISOString(),
            approved: true
        };
        this.egressRequests.push(egressRequest);
        try {
            // Execute host shim
            const result = await shim.implementation(args, token);
            // Update token usage
            token.metadata.currentUsage++;
            // Update rate limit tracking
            await this.updateRateLimit(tokenId, functionName);
            console.log(`[CapabilityTokenManager] Token used successfully: ${tokenId} (${moduleName}.${functionName})`);
            // Emit token used event
            await qflowEventEmitter.emit('q.qflow.capability.token.used.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-capability-manager',
                actor: token.sandboxId,
                data: {
                    tokenId,
                    requestId,
                    moduleName,
                    functionName,
                    success: true,
                    usage: token.metadata.currentUsage,
                    maxUsage: token.metadata.maxUsage
                }
            });
            return { allowed: true, result };
        }
        catch (error) {
            console.error(`[CapabilityTokenManager] Host shim execution failed: ${error}`);
            // Emit token error event
            await qflowEventEmitter.emit('q.qflow.capability.token.error.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-capability-manager',
                actor: token.sandboxId,
                data: {
                    tokenId,
                    requestId,
                    moduleName,
                    functionName,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
            return { allowed: false, reason: `Execution failed: ${error}` };
        }
    }
    /**
     * Revoke capability token
     */
    async revokeToken(tokenId, reason) {
        const token = this.tokens.get(tokenId);
        if (!token) {
            return;
        }
        token.status = 'revoked';
        console.log(`[CapabilityTokenManager] Token revoked: ${tokenId} - ${reason}`);
        // Emit token revoked event
        await qflowEventEmitter.emit('q.qflow.capability.token.revoked.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-capability-manager',
            actor: 'system',
            data: {
                tokenId,
                reason,
                sandboxId: token.sandboxId,
                capability: token.capability
            }
        });
    }
    /**
     * Register host shim
     */
    registerHostShim(moduleName, functionName, requiredCapability, implementation, options = {}) {
        const shimId = this.generateShimId();
        const shimKey = `${moduleName}.${functionName}`;
        const shim = {
            shimId,
            moduleName,
            functionName,
            requiredCapability,
            implementation,
            denyByDefault: options.denyByDefault ?? true,
            auditLog: options.auditLog ?? true
        };
        this.hostShims.set(shimKey, shim);
        console.log(`[CapabilityTokenManager] Registered host shim: ${shimKey} (capability: ${requiredCapability})`);
    }
    /**
     * Update DAO policy
     */
    async updateDAOPolicy(policy) {
        // Verify policy signature
        const signatureValid = await this.verifyPolicySignature(policy);
        if (!signatureValid) {
            throw new Error('Invalid DAO policy signature');
        }
        this.daoPolicies.set(policy.daoSubnet, policy);
        console.log(`[CapabilityTokenManager] Updated DAO policy: ${policy.daoSubnet} (version: ${policy.version})`);
        // Emit policy updated event
        await qflowEventEmitter.emit('q.qflow.dao.policy.updated.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-capability-manager',
            actor: 'dao-governance',
            data: {
                policyId: policy.policyId,
                daoSubnet: policy.daoSubnet,
                version: policy.version,
                capabilities: Object.keys(policy.capabilities)
            }
        });
    }
    /**
     * Get active tokens
     */
    getActiveTokens(sandboxId) {
        const tokens = Array.from(this.tokens.values()).filter(token => token.status === 'active');
        if (sandboxId) {
            return tokens.filter(token => token.sandboxId === sandboxId);
        }
        return tokens;
    }
    /**
     * Get egress requests
     */
    getEgressRequests(sandboxId) {
        if (sandboxId) {
            return this.egressRequests.filter(req => req.sandboxId === sandboxId);
        }
        return [...this.egressRequests];
    }
    // Private methods
    setupDefaultShims() {
        for (const shimConfig of this.DEFAULT_SHIMS) {
            this.registerHostShim(shimConfig.moduleName, shimConfig.functionName, shimConfig.requiredCapability, this.createDefaultImplementation(shimConfig.moduleName, shimConfig.functionName), {
                denyByDefault: shimConfig.denyByDefault,
                auditLog: shimConfig.auditLog
            });
        }
    }
    createDefaultImplementation(moduleName, functionName) {
        return async (args, token) => {
            // Mock implementation for Q-module calls
            console.log(`[CapabilityTokenManager] Executing ${moduleName}.${functionName} with args:`, args);
            switch (`${moduleName}.${functionName}`) {
                case 'qmail.sendEmail':
                    return { messageId: 'mock_message_id', status: 'sent' };
                case 'qpic.processImage':
                    return { processedImageUrl: 'mock_processed_image_url', status: 'processed' };
                case 'qlock.encrypt':
                    return { encryptedData: 'mock_encrypted_data', keyId: 'mock_key_id' };
                case 'qonsent.checkPermission':
                    return { allowed: true, reason: 'mock_permission_check' };
                case 'qindex.search':
                    return { results: [], totalCount: 0, searchId: 'mock_search_id' };
                case 'qerberos.validateIntegrity':
                    return { valid: true, score: 100, validationId: 'mock_validation_id' };
                default:
                    throw new Error(`Unknown Q-module function: ${moduleName}.${functionName}`);
            }
        };
    }
    async validateConstraints(token, args) {
        const constraints = token.constraints;
        // Validate argument bounds
        if (constraints.argumentBounds) {
            for (const bound of constraints.argumentBounds) {
                if (bound.argumentIndex >= args.length) {
                    if (bound.constraints.required) {
                        return { valid: false, reason: `Required argument ${bound.argumentName} missing` };
                    }
                    continue;
                }
                const arg = args[bound.argumentIndex];
                const validation = this.validateArgumentBound(arg, bound);
                if (!validation.valid) {
                    return validation;
                }
            }
        }
        // Validate resource limits
        if (constraints.resourceLimits) {
            for (const limit of constraints.resourceLimits) {
                if (limit.currentUsage >= limit.maxUsage) {
                    return { valid: false, reason: `Resource limit exceeded: ${limit.resource} (${limit.currentUsage}/${limit.maxUsage})` };
                }
            }
        }
        // Validate time windows
        if (constraints.timeWindows) {
            const now = new Date();
            const isInWindow = constraints.timeWindows.some(window => {
                const start = new Date(window.startTime);
                const end = new Date(window.endTime);
                return now >= start && now <= end;
            });
            if (!isInWindow) {
                return { valid: false, reason: 'Current time is outside allowed time windows' };
            }
        }
        return { valid: true };
    }
    validateArgumentBound(arg, bound) {
        const constraints = bound.constraints;
        // Type validation
        const argType = Array.isArray(arg) ? 'array' : typeof arg;
        if (argType !== bound.type) {
            return { valid: false, reason: `Argument ${bound.argumentName} type mismatch: expected ${bound.type}, got ${argType}` };
        }
        // String/array length validation
        if ((bound.type === 'string' || bound.type === 'array') && arg.length !== undefined) {
            if (constraints.minLength !== undefined && arg.length < constraints.minLength) {
                return { valid: false, reason: `Argument ${bound.argumentName} too short: ${arg.length} < ${constraints.minLength}` };
            }
            if (constraints.maxLength !== undefined && arg.length > constraints.maxLength) {
                return { valid: false, reason: `Argument ${bound.argumentName} too long: ${arg.length} > ${constraints.maxLength}` };
            }
        }
        // Number value validation
        if (bound.type === 'number') {
            if (constraints.minValue !== undefined && arg < constraints.minValue) {
                return { valid: false, reason: `Argument ${bound.argumentName} too small: ${arg} < ${constraints.minValue}` };
            }
            if (constraints.maxValue !== undefined && arg > constraints.maxValue) {
                return { valid: false, reason: `Argument ${bound.argumentName} too large: ${arg} > ${constraints.maxValue}` };
            }
        }
        // Allowed values validation
        if (constraints.allowedValues && !constraints.allowedValues.includes(arg)) {
            return { valid: false, reason: `Argument ${bound.argumentName} not in allowed values` };
        }
        // Pattern validation for strings
        if (bound.type === 'string' && constraints.pattern) {
            const regex = new RegExp(constraints.pattern);
            if (!regex.test(arg)) {
                return { valid: false, reason: `Argument ${bound.argumentName} does not match required pattern` };
            }
        }
        return { valid: true };
    }
    async checkRateLimit(tokenId, operation) {
        const rateLimits = this.rateLimitTracking.get(tokenId);
        if (!rateLimits) {
            return { allowed: true };
        }
        const rateLimit = rateLimits.get(operation);
        if (!rateLimit) {
            return { allowed: true };
        }
        const now = Date.now();
        // Reset window if expired
        if (now - rateLimit.windowStart >= rateLimit.windowMs) {
            rateLimit.currentCount = 0;
            rateLimit.windowStart = now;
        }
        // Check if limit exceeded
        if (rateLimit.currentCount >= rateLimit.maxRequests) {
            const resetTime = rateLimit.windowStart + rateLimit.windowMs;
            return {
                allowed: false,
                reason: `Rate limit exceeded for ${operation}: ${rateLimit.currentCount}/${rateLimit.maxRequests} (resets at ${new Date(resetTime).toISOString()})`
            };
        }
        return { allowed: true };
    }
    async updateRateLimit(tokenId, operation) {
        const rateLimits = this.rateLimitTracking.get(tokenId);
        if (!rateLimits) {
            return;
        }
        const rateLimit = rateLimits.get(operation);
        if (rateLimit) {
            rateLimit.currentCount++;
        }
    }
    mergeConstraints(base, policy) {
        return {
            argumentBounds: [...(base.argumentBounds || []), ...(policy.argumentBounds || [])],
            rateLimits: [...(base.rateLimits || []), ...(policy.rateLimits || [])],
            resourceLimits: [...(base.resourceLimits || []), ...(policy.resourceLimits || [])],
            networkRestrictions: [...(base.networkRestrictions || []), ...(policy.networkRestrictions || [])],
            timeWindows: [...(base.timeWindows || []), ...(policy.timeWindows || [])]
        };
    }
    startTokenCleanup() {
        setInterval(() => {
            this.cleanupExpiredTokens();
        }, 60000); // Every minute
    }
    cleanupExpiredTokens() {
        const now = new Date();
        let cleanedCount = 0;
        for (const [tokenId, token] of this.tokens.entries()) {
            if (token.status === 'expired' || new Date(token.metadata.expiresAt) < now) {
                token.status = 'expired';
                this.tokens.delete(tokenId);
                this.rateLimitTracking.delete(tokenId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            console.log(`[CapabilityTokenManager] Cleaned up ${cleanedCount} expired tokens`);
        }
    }
    async signToken(tokenId, capability, daoSubnet) {
        // Simplified signing - in real implementation would use proper cryptographic signing
        const dataToSign = `${tokenId}:${capability}:${daoSubnet}`;
        return `token_sig_${Buffer.from(dataToSign).toString('base64').substring(0, 32)}`;
    }
    async verifyPolicySignature(policy) {
        // Simplified verification - in real implementation would use proper cryptographic verification
        return policy.signature.length > 0;
    }
    generateTokenId() {
        return `token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateShimId() {
        return `shim_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        this.tokens.clear();
        this.hostShims.clear();
        this.daoPolicies.clear();
        this.egressRequests.length = 0;
        this.rateLimitTracking.clear();
        this.removeAllListeners();
    }
}
// Export singleton instance
export const capabilityTokenManager = new CapabilityTokenManager();
//# sourceMappingURL=CapabilityTokenManager.js.map