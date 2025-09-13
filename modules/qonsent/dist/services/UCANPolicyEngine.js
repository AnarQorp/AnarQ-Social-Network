"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UCANPolicyEngine = void 0;
const logger_1 = require("../utils/logger");
const Policy_1 = require("../models/Policy");
const errors_1 = require("../utils/errors");
class UCANPolicyEngine {
    /**
     * Check permission using UCAN policies
     */
    async checkPermission(params) {
        const { resource, identity, action, context = {} } = params;
        try {
            logger_1.logger.debug('Checking UCAN policies', { resource, identity, action });
            // Find applicable policies
            const policies = await this.findApplicablePolicies(resource, identity);
            for (const policy of policies) {
                const result = await this.evaluatePolicy(policy, resource, identity, action, context);
                if (result.allowed) {
                    return result;
                }
            }
            // No matching policies found
            return {
                allowed: false,
                reason: 'No matching UCAN policies found',
            };
        }
        catch (error) {
            logger_1.logger.error('Error checking UCAN policies', { error, resource, identity, action });
            throw new errors_1.QonsentError(errors_1.ErrorCodes.POLICY_EVALUATION_FAILED, 'Failed to evaluate UCAN policies', { resource, identity, action });
        }
    }
    /**
     * Find policies that might apply to the resource and identity
     */
    async findApplicablePolicies(resource, identity) {
        try {
            // Query for policies that match the resource pattern and identity
            const policies = await Policy_1.PolicyModel.find({
                $and: [
                    { active: true },
                    {
                        $or: [
                            { expiresAt: { $exists: false } },
                            { expiresAt: { $gt: new Date() } },
                        ],
                    },
                    {
                        $or: [
                            // Direct identity match
                            { 'rules.audience': identity },
                            // Wildcard audience
                            { 'rules.audience': '*' },
                            // DAO-based policies (would need DAO membership check)
                            { 'rules.audience': { $regex: '^dao:' } },
                        ],
                    },
                    {
                        $or: [
                            // Exact resource match
                            { 'rules.resource': resource },
                            // Resource pattern match
                            { 'rules.resource': { $regex: this.resourceToRegex(resource) } },
                            // Wildcard resource
                            { 'rules.resource': '*' },
                        ],
                    },
                ],
            }).exec();
            return policies;
        }
        catch (error) {
            logger_1.logger.error('Error finding applicable policies', { error, resource, identity });
            throw error;
        }
    }
    /**
     * Evaluate a single policy against the request
     */
    async evaluatePolicy(policy, resource, identity, action, context) {
        try {
            logger_1.logger.debug('Evaluating policy', { policyId: policy._id, resource, identity, action });
            // Check if policy is still valid
            if (policy.expiresAt && policy.expiresAt < new Date()) {
                return {
                    allowed: false,
                    reason: 'Policy has expired',
                };
            }
            // Evaluate each rule in the policy
            for (const rule of policy.rules) {
                const ruleResult = await this.evaluateRule(rule, resource, identity, action, context);
                if (ruleResult.allowed) {
                    return {
                        allowed: true,
                        reason: ruleResult.reason,
                        policy: {
                            id: policy._id?.toString() || '',
                            name: policy.name,
                            type: policy.scope,
                        },
                        expiresAt: policy.expiresAt?.toISOString(),
                        conditions: rule.conditions,
                    };
                }
            }
            return {
                allowed: false,
                reason: 'No matching rules in policy',
            };
        }
        catch (error) {
            logger_1.logger.error('Error evaluating policy', { error, policyId: policy._id });
            return {
                allowed: false,
                reason: 'Policy evaluation error',
            };
        }
    }
    /**
     * Evaluate a single rule within a policy
     */
    async evaluateRule(rule, resource, identity, action, context) {
        try {
            // Check audience (identity) match
            if (!this.matchesPattern(identity, rule.audience)) {
                return { allowed: false, reason: 'Identity does not match rule audience' };
            }
            // Check resource match
            if (!this.matchesPattern(resource, rule.resource)) {
                return { allowed: false, reason: 'Resource does not match rule resource pattern' };
            }
            // Check action match
            if (!this.matchesAction(action, rule.actions)) {
                return { allowed: false, reason: 'Action not permitted by rule' };
            }
            // Check conditions/caveats
            if (rule.conditions) {
                const conditionResult = await this.evaluateConditions(rule.conditions, context);
                if (!conditionResult.allowed) {
                    return conditionResult;
                }
            }
            return { allowed: true, reason: 'Rule conditions satisfied' };
        }
        catch (error) {
            logger_1.logger.error('Error evaluating rule', { error, rule });
            return { allowed: false, reason: 'Rule evaluation error' };
        }
    }
    /**
     * Check if a value matches a pattern (supports wildcards)
     */
    matchesPattern(value, pattern) {
        if (pattern === '*')
            return true;
        if (pattern === value)
            return true;
        // Convert pattern to regex
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(value);
    }
    /**
     * Check if an action is allowed by the rule's actions
     */
    matchesAction(action, allowedActions) {
        if (allowedActions.includes('*'))
            return true;
        if (allowedActions.includes(action))
            return true;
        // Check hierarchical permissions
        const hierarchy = {
            admin: ['read', 'write', 'delete', 'share', 'execute'],
            write: ['read'],
            share: ['read'],
        };
        for (const allowedAction of allowedActions) {
            if (hierarchy[allowedAction]?.includes(action)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Evaluate conditions/caveats
     */
    async evaluateConditions(conditions, context) {
        try {
            // Time window conditions
            if (conditions.timeWindow) {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                if (conditions.timeWindow.start && conditions.timeWindow.end) {
                    const [startHour, startMin] = conditions.timeWindow.start.split(':').map(Number);
                    const [endHour, endMin] = conditions.timeWindow.end.split(':').map(Number);
                    const startTime = startHour * 60 + startMin;
                    const endTime = endHour * 60 + endMin;
                    if (currentTime < startTime || currentTime > endTime) {
                        return { allowed: false, reason: 'Outside allowed time window' };
                    }
                }
            }
            // IP restrictions
            if (conditions.ipRestrictions && context.clientIp) {
                if (!conditions.ipRestrictions.includes(context.clientIp)) {
                    return { allowed: false, reason: 'IP address not in allowed list' };
                }
            }
            // Usage limits
            if (conditions.maxUses) {
                // This would require tracking usage count
                // For now, we'll assume it's within limits
            }
            // DAO membership conditions
            if (conditions.daoMembership && context.daoContext) {
                // This would require checking DAO membership
                // For now, we'll assume membership is valid
            }
            return { allowed: true, reason: 'All conditions satisfied' };
        }
        catch (error) {
            logger_1.logger.error('Error evaluating conditions', { error, conditions });
            return { allowed: false, reason: 'Condition evaluation error' };
        }
    }
    /**
     * Convert resource pattern to regex
     */
    resourceToRegex(resource) {
        // Extract module and type from resource (e.g., "qdrive:file:abc123")
        const parts = resource.split(':');
        if (parts.length >= 2) {
            return `^${parts[0]}:${parts[1]}:.*$`;
        }
        return `^${resource}$`;
    }
    /**
     * Create a new UCAN policy
     */
    async createPolicy(params) {
        try {
            const policy = new Policy_1.PolicyModel({
                name: params.name,
                description: params.description,
                scope: params.scope,
                rules: params.rules,
                createdBy: params.createdBy,
                expiresAt: params.expiresAt,
                active: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await policy.save();
            return policy.toObject();
        }
        catch (error) {
            logger_1.logger.error('Error creating policy', { error, params });
            throw new errors_1.QonsentError(errors_1.ErrorCodes.POLICY_CREATION_FAILED, 'Failed to create policy', params);
        }
    }
    /**
     * Update an existing policy
     */
    async updatePolicy(policyId, updates, updatedBy) {
        try {
            const policy = await Policy_1.PolicyModel.findById(policyId).exec();
            if (!policy) {
                throw new errors_1.QonsentError(errors_1.ErrorCodes.POLICY_NOT_FOUND, 'Policy not found', { policyId });
            }
            Object.assign(policy, updates, {
                updatedBy,
                updatedAt: new Date(),
            });
            await policy.save();
            return policy.toObject();
        }
        catch (error) {
            logger_1.logger.error('Error updating policy', { error, policyId, updates });
            throw new errors_1.QonsentError(errors_1.ErrorCodes.POLICY_UPDATE_FAILED, 'Failed to update policy', { policyId, updates });
        }
    }
    /**
     * Delete a policy
     */
    async deletePolicy(policyId, deletedBy) {
        try {
            const policy = await Policy_1.PolicyModel.findById(policyId).exec();
            if (!policy) {
                throw new errors_1.QonsentError(errors_1.ErrorCodes.POLICY_NOT_FOUND, 'Policy not found', { policyId });
            }
            policy.active = false;
            policy.updatedBy = deletedBy;
            policy.updatedAt = new Date();
            await policy.save();
        }
        catch (error) {
            logger_1.logger.error('Error deleting policy', { error, policyId });
            throw new errors_1.QonsentError(errors_1.ErrorCodes.POLICY_DELETE_FAILED, 'Failed to delete policy', { policyId });
        }
    }
}
exports.UCANPolicyEngine = UCANPolicyEngine;
//# sourceMappingURL=UCANPolicyEngine.js.map