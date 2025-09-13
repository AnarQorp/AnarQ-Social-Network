/**
 * Webhook Service for External Event Processing
 *
 * Handles incoming webhooks from external systems with comprehensive
 * security validation through the universal validation pipeline
 */
import { EventEmitter } from 'events';
import { ExecutionContext } from '../models/FlowDefinition.js';
export interface WebhookEvent {
    id: string;
    source: string;
    type: string;
    timestamp: string;
    data: any;
    signature?: string;
    headers: Record<string, string>;
    rawBody: string;
}
export interface WebhookConfig {
    flowId: string;
    endpoint: string;
    secret?: string;
    signatureHeader?: string;
    signatureAlgorithm?: 'sha256' | 'sha1' | 'md5' | 'qlock-ed25519';
    allowedSources?: string[];
    rateLimitPerMinute?: number;
    enabled: boolean;
    createdBy: string;
    createdAt: string;
    qlockVerification?: {
        enabled: boolean;
        publicKey?: string;
        requiredClaims?: string[];
    };
    qonsentScopes?: {
        required: string[];
        rateLimits?: Record<string, {
            requests: number;
            window: string;
        }>;
    };
    qerberosRiskThreshold?: number;
}
export interface WebhookValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    processedEvent?: ProcessedWebhookEvent;
    securityAssessment?: {
        qlockVerified: boolean;
        qonsentApproved: boolean;
        qerberosRiskScore: number;
        riskFactors: string[];
    };
}
export interface ProcessedWebhookEvent {
    id: string;
    originalEvent: WebhookEvent;
    flowId: string;
    executionContext: ExecutionContext;
    validationResults: any[];
    processedAt: string;
}
export interface ExternalEventSchema {
    name: string;
    version: string;
    source: string;
    schema: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
    transformation?: {
        mapping: Record<string, string>;
        defaultValues?: Record<string, any>;
    };
}
/**
 * Webhook Service for processing external events
 */
export declare class WebhookService extends EventEmitter {
    private webhookConfigs;
    private eventSchemas;
    private rateLimitTracker;
    private processingQueue;
    private isProcessing;
    constructor();
    /**
     * Register webhook configuration for a flow
     */
    registerWebhook(config: Omit<WebhookConfig, 'createdAt'>): Promise<string>;
    /**
     * Process incoming webhook event
     */
    processWebhookEvent(endpoint: string, headers: Record<string, string>, body: string, sourceIp?: string): Promise<WebhookValidationResult>;
    /**
     * Register external event schema
     */
    registerEventSchema(schema: ExternalEventSchema): void;
    /**
     * Get webhook configurations for a flow
     */
    getWebhookConfigs(flowId: string): WebhookConfig[];
    /**
     * Update webhook configuration
     */
    updateWebhookConfig(webhookId: string, updates: Partial<WebhookConfig>, updatedBy: string): Promise<boolean>;
    /**
     * Delete webhook configuration
     */
    deleteWebhookConfig(webhookId: string, deletedBy: string): Promise<boolean>;
    private setupEventSchemas;
    private findWebhookConfig;
    private checkRateLimit;
    private parseWebhookEvent;
    private validateSignature;
    /**
     * Validate Qlock-verified webhook signatures
     */
    private validateQlockSignature;
    /**
     * Validate Qonsent scopes for external principals
     */
    private validateQonsentScopes;
    /**
     * Assess risk using Qerberos before admitting external events
     */
    private assessQerberosRisk;
    /**
     * Perform basic risk assessment when Qerberos is not available
     */
    private performBasicRiskAssessment;
    /**
     * Get recent events from a specific source (for risk assessment)
     */
    private getRecentEventsFromSource;
    /**
     * Check if IP is known to be malicious (basic implementation)
     */
    private isKnownMaliciousIp;
    private validateThroughPipeline;
    private findEventSchema;
    private transformEvent;
    private createExecutionContext;
    private startProcessingQueue;
    private processQueuedEvent;
    private getFlow;
    private generateEventId;
}
export declare const webhookService: WebhookService;
//# sourceMappingURL=WebhookService.d.ts.map