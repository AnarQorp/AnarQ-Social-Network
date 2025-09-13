/**
 * Code Template Service
 *
 * Manages DAO-approved code templates and whitelisting for secure execution
 */
import { EventEmitter } from 'events';
import { qflowEventEmitter } from '../events/EventEmitter.js';
import { squidIdentityService } from '../auth/SquidIdentityService.js';
export class CodeTemplateService extends EventEmitter {
    templatesCache = new Map();
    whitelistsCache = new Map();
    approvalRequestsCache = new Map();
    executionStatsCache = new Map();
    constructor() {
        super();
        this.setupEventHandlers();
        this.initializeDefaultTemplates();
    }
    async registerTemplate(templateData, author) {
        try {
            const authorIdentity = await squidIdentityService.getIdentity(author);
            if (!authorIdentity) {
                throw new Error(`Author identity ${author} not found`);
            }
            const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const template = {
                id: templateId,
                name: templateData.name,
                description: templateData.description,
                category: templateData.category,
                language: templateData.language,
                version: templateData.version,
                code: templateData.code,
                entryPoint: templateData.entryPoint,
                parameters: templateData.parameters,
                dependencies: templateData.dependencies,
                resourceRequirements: templateData.resourceRequirements,
                security: templateData.security,
                metadata: {
                    author,
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    tags: templateData.metadata.tags || [],
                    documentation: templateData.metadata.documentation || '',
                    examples: templateData.metadata.examples || []
                },
                approval: {
                    status: 'pending',
                    approvedBy: [],
                    rejectedBy: []
                }
            };
            const securityValidation = await this.validateTemplateSecurity(template);
            if (!securityValidation.valid) {
                throw new Error(`Template security validation failed: ${securityValidation.errors.join(', ')}`);
            }
            this.templatesCache.set(templateId, template);
            qflowEventEmitter.emit('q.qflow.template.registered.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-templates',
                actor: author,
                data: {
                    templateId,
                    name: template.name,
                    category: template.category,
                    language: template.language,
                    author
                }
            });
            return template;
        }
        catch (error) {
            console.error(`[CodeTemplate] Failed to register template: ${error}`);
            throw error;
        }
    }
    async isTemplateApproved(templateId, daoSubnet) {
        try {
            const whitelist = this.whitelistsCache.get(daoSubnet);
            if (!whitelist) {
                return false;
            }
            if (whitelist.whitelistedTemplates.includes(templateId)) {
                return true;
            }
            if (whitelist.blacklistedTemplates.includes(templateId)) {
                return false;
            }
            const template = this.templatesCache.get(templateId);
            if (!template) {
                return false;
            }
            return template.approval.status === 'approved';
        }
        catch (error) {
            console.error(`[CodeTemplate] Failed to check template approval: ${error}`);
            return false;
        }
    }
    async getApprovedTemplates(daoSubnet) {
        try {
            const approvedTemplates = [];
            for (const template of this.templatesCache.values()) {
                const isApproved = await this.isTemplateApproved(template.id, daoSubnet);
                if (isApproved) {
                    approvedTemplates.push(template);
                }
            }
            return approvedTemplates;
        }
        catch (error) {
            console.error(`[CodeTemplate] Failed to get approved templates: ${error}`);
            return [];
        }
    }
    setupEventHandlers() {
        setInterval(() => {
            this.cleanupExpiredRequests();
        }, 60 * 60 * 1000);
    }
    initializeDefaultTemplates() {
        const defaultTemplate = {
            name: 'JSON Transformer',
            description: 'Transform JSON data using JSONPath expressions',
            category: 'transformation',
            language: 'javascript',
            version: '1.0.0',
            code: 'function transform(input, parameters) { return { transformed: input }; }',
            entryPoint: 'transform',
            parameters: [
                {
                    name: 'jsonPath',
                    type: 'string',
                    required: true,
                    description: 'JSONPath expression for data selection'
                }
            ],
            dependencies: [],
            resourceRequirements: {
                cpu: 1,
                memory: 64,
                timeout: 30,
                networkAccess: false,
                fileSystemAccess: false
            },
            security: {
                sandboxed: true,
                allowedAPIs: ['JSON'],
                blockedAPIs: ['fetch', 'XMLHttpRequest'],
                maxExecutionTime: 30,
                memoryLimit: 64
            },
            metadata: {
                tags: ['json', 'transformation', 'utility'],
                documentation: 'Transform JSON data using JSONPath expressions',
                examples: []
            }
        };
        this.registerTemplate(defaultTemplate, 'system').catch(error => {
            console.error(`[CodeTemplate] Failed to register default template: ${error}`);
        });
    }
    async validateTemplateSecurity(template) {
        const errors = [];
        const dangerousPatterns = [
            /eval\s*\(/,
            /Function\s*\(/,
            /require\s*\(/,
            /import\s*\(/,
            /process\./,
            /global\./
        ];
        for (const pattern of dangerousPatterns) {
            if (pattern.test(template.code)) {
                errors.push(`Dangerous pattern detected: ${pattern.source}`);
            }
        }
        if (template.resourceRequirements.cpu > 10) {
            errors.push('CPU requirement too high (max 10 units)');
        }
        if (template.resourceRequirements.memory > 1024) {
            errors.push('Memory requirement too high (max 1024 MB)');
        }
        if (template.resourceRequirements.timeout > 300) {
            errors.push('Timeout too high (max 300 seconds)');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    async cleanupExpiredRequests() {
        try {
            const maxAge = 30 * 24 * 60 * 60 * 1000;
            const cutoff = new Date(Date.now() - maxAge);
            for (const [daoSubnet, requests] of this.approvalRequestsCache.entries()) {
                const activeRequests = requests.filter(r => new Date(r.requestedAt) > cutoff || r.status === 'pending');
                if (activeRequests.length !== requests.length) {
                    this.approvalRequestsCache.set(daoSubnet, activeRequests);
                }
            }
        }
        catch (error) {
            console.error(`[CodeTemplate] Cleanup failed: ${error}`);
        }
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
}
export const codeTemplateService = new CodeTemplateService();
//# sourceMappingURL=CodeTemplateService.js.map