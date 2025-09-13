/**
 * External System Integration Service
 *
 * Provides capabilities for integrating with external systems
 * including standard webhook formats and custom event schemas
 */
import { EventEmitter } from 'events';
import { qflowEventEmitter } from '../events/EventEmitter.js';
import { webhookService } from './WebhookService.js';
/**
 * External Integration Service
 */
export class ExternalIntegrationService extends EventEmitter {
    systemConfigs = new Map();
    integrationTemplates = new Map();
    constructor() {
        super();
        this.setupDefaultTemplates();
    }
    /**
       * Register external system configuration
       */
    async registerExternalSystem(config) {
        try {
            const systemId = config.id || `system_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const fullConfig = {
                ...config,
                id: systemId,
                createdAt: new Date().toISOString()
            };
            this.systemConfigs.set(systemId, fullConfig);
            await qflowEventEmitter.emit('q.qflow.external.system.registered.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-external-integration',
                actor: config.createdBy,
                data: {
                    systemId,
                    name: config.name,
                    type: config.type,
                    enabled: config.enabled
                }
            });
            return systemId;
        }
        catch (error) {
            console.error(`[ExternalIntegration] Failed to register system: ${error}`);
            throw error;
        }
    }
    /**
     * Create integration template
     */
    async createIntegrationTemplate(template) {
        try {
            const templateId = template.id || `template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const fullTemplate = {
                ...template,
                id: templateId,
                createdAt: new Date().toISOString()
            };
            this.integrationTemplates.set(templateId, fullTemplate);
            if (template.systemType === 'webhook') {
                webhookService.registerEventSchema({
                    name: template.name.toLowerCase().replace(/\s+/g, '-'),
                    version: template.version,
                    source: template.systemType,
                    schema: template.schema.input
                });
            }
            await qflowEventEmitter.emit('q.qflow.integration.template.created.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-external-integration',
                actor: template.author,
                data: {
                    templateId,
                    name: template.name,
                    systemType: template.systemType,
                    version: template.version
                }
            });
            return templateId;
        }
        catch (error) {
            console.error(`[ExternalIntegration] Failed to create template: ${error}`);
            throw error;
        }
    }
    /**
      * Execute external API call
      */
    async executeExternalCall(systemId, endpoint, method, data, options) {
        try {
            const systemConfig = this.systemConfigs.get(systemId);
            if (!systemConfig) {
                throw new Error(`External system not found: ${systemId}`);
            }
            if (!systemConfig.enabled) {
                throw new Error(`External system is disabled: ${systemId}`);
            }
            const url = systemConfig.baseUrl ?
                `${systemConfig.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}` :
                endpoint;
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Qflow-External-Integration/1.0',
                ...systemConfig.headers,
                ...options?.headers
            };
            this.addAuthentication(headers, systemConfig.authentication);
            let requestData = data;
            if (options?.transformRequest && data) {
                requestData = this.executeTransformation(options.transformRequest, data);
            }
            const response = await this.executeWithRetry(() => this.makeHttpRequest(url, method, requestData, headers, options?.timeout || systemConfig.timeout), systemConfig.retryPolicy);
            let responseData = response;
            if (options?.transformResponse) {
                responseData = this.executeTransformation(options.transformResponse, response);
            }
            await qflowEventEmitter.emit('q.qflow.external.call.executed.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-external-integration',
                actor: 'system',
                data: {
                    systemId,
                    endpoint,
                    method,
                    success: true,
                    responseSize: JSON.stringify(responseData).length
                }
            });
            return responseData;
        }
        catch (error) {
            console.error(`[ExternalIntegration] External call failed: ${error}`);
            await qflowEventEmitter.emit('q.qflow.external.call.failed.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-external-integration',
                actor: 'system',
                data: {
                    systemId,
                    endpoint,
                    method,
                    error: error instanceof Error ? error.message : String(error)
                }
            });
            throw error;
        }
    } /**
    
   * Get integration templates by system type
     */
    getIntegrationTemplates(systemType) {
        const templates = Array.from(this.integrationTemplates.values());
        if (systemType) {
            return templates.filter(template => template.systemType === systemType);
        }
        return templates;
    }
    /**
     * Get external system configuration
     */
    getExternalSystem(systemId) {
        return this.systemConfigs.get(systemId);
    }
    /**
     * List all external systems
     */
    listExternalSystems() {
        return Array.from(this.systemConfigs.values());
    }
    // Private helper methods
    setupDefaultTemplates() {
        // GitHub API Template
        this.integrationTemplates.set('github-api', {
            id: 'github-api',
            name: 'GitHub API Integration',
            description: 'Template for integrating with GitHub API',
            systemType: 'api',
            version: '1.0.0',
            schema: {
                input: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        action: { type: 'string', enum: ['create-issue', 'get-repo', 'list-commits'] }
                    },
                    required: ['owner', 'repo', 'action']
                },
                output: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' }
                    }
                },
                configuration: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', description: 'GitHub personal access token' }
                    },
                    required: ['token']
                }
            },
            transformations: {
                request: 'const { owner, repo, action, ...params } = input; return { url: `/repos/${owner}/${repo}`, method: action === "create-issue" ? "POST" : "GET", data: params };',
                response: 'return { success: true, data: response, timestamp: new Date().toISOString() };'
            },
            examples: [
                {
                    input: { owner: 'octocat', repo: 'Hello-World', action: 'get-repo' },
                    output: { success: true, data: { id: 1296269, name: 'Hello-World' } }
                }
            ],
            tags: ['github', 'api', 'git', 'repository'],
            author: 'system',
            createdAt: new Date().toISOString()
        });
        // Slack Webhook Template
        this.integrationTemplates.set('slack-webhook', {
            id: 'slack-webhook',
            name: 'Slack Webhook Integration',
            description: 'Template for sending messages to Slack via webhooks',
            systemType: 'webhook',
            version: '1.0.0',
            schema: {
                input: {
                    type: 'object',
                    properties: {
                        text: { type: 'string' },
                        channel: { type: 'string' },
                        username: { type: 'string' },
                        icon_emoji: { type: 'string' }
                    },
                    required: ['text']
                },
                output: {
                    type: 'object',
                    properties: {
                        ok: { type: 'boolean' }
                    }
                },
                configuration: {
                    type: 'object',
                    properties: {
                        webhook_url: { type: 'string', description: 'Slack webhook URL' }
                    },
                    required: ['webhook_url']
                }
            },
            transformations: {
                request: 'return { text: input.text, channel: input.channel || "#general", username: input.username || "Qflow Bot", icon_emoji: input.icon_emoji || ":robot_face:" };',
                response: 'return { success: response.ok === true, message: response.ok ? "Message sent successfully" : "Failed to send message" };'
            },
            examples: [
                {
                    input: { text: 'Hello from Qflow!', channel: '#general' },
                    output: { ok: true }
                }
            ],
            tags: ['slack', 'webhook', 'messaging', 'notification'],
            author: 'system',
            createdAt: new Date().toISOString()
        });
        console.log('[ExternalIntegration] Default integration templates loaded');
    }
    addAuthentication(headers, auth) {
        switch (auth.type) {
            case 'api_key':
                if (auth.credentials.header && auth.credentials.key) {
                    headers[auth.credentials.header] = auth.credentials.key;
                }
                break;
            case 'bearer':
                if (auth.credentials.token) {
                    headers['Authorization'] = `Bearer ${auth.credentials.token}`;
                }
                break;
            case 'basic':
                if (auth.credentials.username && auth.credentials.password) {
                    const encoded = Buffer.from(`${auth.credentials.username}:${auth.credentials.password}`).toString('base64');
                    headers['Authorization'] = `Basic ${encoded}`;
                }
                break;
            case 'oauth2':
                if (auth.credentials.access_token) {
                    headers['Authorization'] = `Bearer ${auth.credentials.access_token}`;
                }
                break;
            case 'custom':
                Object.assign(headers, auth.credentials);
                break;
            case 'none':
            default:
                break;
        }
    }
    async makeHttpRequest(url, method, data, headers, timeout = 30000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const options = {
                method,
                headers,
                signal: controller.signal
            };
            if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
                options.body = JSON.stringify(data);
            }
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            else {
                return await response.text();
            }
        }
        catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    async executeWithRetry(operation, retryPolicy) {
        const maxAttempts = retryPolicy?.maxAttempts || 1;
        const backoffMs = retryPolicy?.backoffMs || 1000;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt === maxAttempts) {
                    break;
                }
                const delay = backoffMs * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
    executeTransformation(transformationCode, data) {
        try {
            const context = {
                input: data,
                response: data,
                console: {
                    log: (...args) => console.log('[Transformation]', ...args),
                    error: (...args) => console.error('[Transformation]', ...args)
                },
                JSON,
                Date,
                Math
            };
            const func = new Function('input', 'response', 'console', 'JSON', 'Date', 'Math', transformationCode);
            return func.call(context, data, data, context.console, JSON, Date, Math);
        }
        catch (error) {
            console.error(`[ExternalIntegration] Transformation error: ${error}`);
            throw new Error(`Transformation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
}
// Export singleton instance
export const externalIntegrationService = new ExternalIntegrationService();
//# sourceMappingURL=ExternalIntegrationService.js.map