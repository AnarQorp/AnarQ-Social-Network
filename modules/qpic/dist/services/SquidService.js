"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SquidService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
class SquidService {
    constructor() {
        this.baseUrl = config_1.config.squidUrl;
    }
    async verifyIdentity(token) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v1/verify`, {
                token
            }, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.data.status === 'ok') {
                return response.data.data;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('sQuid identity verification failed:', error);
            // In development mode, return mock identity
            if (config_1.config.nodeEnv === 'development') {
                return {
                    squidId: 'dev-user-123',
                    verified: true,
                    permissions: ['media:upload', 'media:download', 'media:transcode']
                };
            }
            return null;
        }
    }
    async getActiveContext(squidId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/api/v1/identity/${squidId}/context`, {
                timeout: 5000
            });
            if (response.data.status === 'ok') {
                return response.data.data;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get active context:', error);
            return null;
        }
    }
    async updateReputation(squidId, action, value) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/api/v1/identity/${squidId}/reputation`, {
                action,
                value
            }, {
                timeout: 5000
            });
            return response.data.status === 'ok';
        }
        catch (error) {
            logger_1.logger.error('Failed to update reputation:', error);
            return false;
        }
    }
}
exports.SquidService = SquidService;
//# sourceMappingURL=SquidService.js.map