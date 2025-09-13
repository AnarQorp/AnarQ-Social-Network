"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QonsentService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class QonsentService {
    constructor() {
        this.baseUrl = config_1.config.qonsentUrl;
    }
    async checkPermission(squidId, permission, subId, daoId) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v1/check`, {
                squidId,
                subId,
                daoId,
                resource: permission.resource,
                action: permission.action,
                context: permission.context
            }, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.status === 'ok') {
                return response.data.data;
            }
            return { allowed: false, reason: 'Permission check failed' };
        }
        catch (error) {
            logger_1.logger.error('Qonsent permission check failed:', error);
            // In development mode, allow all permissions
            if (config_1.config.nodeEnv === 'development') {
                return { allowed: true };
            }
            return { allowed: false, reason: 'Service unavailable' };
        }
    }
    async grantPermission(squidId, resource, action, conditions, expiresAt) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v1/grant`, {
                squidId,
                resource,
                action,
                conditions,
                expiresAt
            }, {
                timeout: 5000
            });
            return response.data.status === 'ok';
        }
        catch (error) {
            logger_1.logger.error('Failed to grant permission:', error);
            return false;
        }
    }
    async revokePermission(squidId, resource, action) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v1/revoke`, {
                squidId,
                resource,
                action
            }, {
                timeout: 5000
            });
            return response.data.status === 'ok';
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke permission:', error);
            return false;
        }
    }
}
exports.QonsentService = QonsentService;
//# sourceMappingURL=QonsentService.js.map