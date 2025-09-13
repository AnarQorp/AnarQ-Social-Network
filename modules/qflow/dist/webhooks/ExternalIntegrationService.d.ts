/**
 * External System Integration Service
 *
 * Provides capabilities for integrating with external systems
 * including standard webhook formats and custom event schemas
 */
import { EventEmitter } from 'events';
export interface ExternalSystemConfig {
    id: string;
    name: string;
    type: 'webhook' | 'api' | 'database' | 'message_queue' | 'custom';
    baseUrl?: string;
    authentication: {
        type: 'none' | 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'custom';
        credentials: Record<string, string>;
    };
    headers?: Record<string, string>;
    timeout?: number;
    retryPolicy?: {
        maxAttempts: number;
        backoffMs: number;
    };
    rateLimiting?: {
        requestsPerSecond: number;
        burstLimit: number;
    };
    enabled: boolean;
    createdBy: string;
    createdAt: string;
}
export interface IntegrationTemplate {
    id: string;
    name: string;
    description: string;
    systemType: string;
    version: string;
    schema: {
        input: any;
        output: any;
        configuration: any;
    };
    transformations: {
        request: string;
        response: string;
    };
    examples: {
        input: any;
        output: any;
    }[];
    tags: string[];
    author: string;
    createdAt: string;
}
/**
 * External Integration Service
 */
export declare class ExternalIntegrationService extends EventEmitter {
    private systemConfigs;
    private integrationTemplates;
    constructor();
    /**
       * Register external system configuration
       */
    registerExternalSystem(config: Omit<ExternalSystemConfig, 'createdAt'>): Promise<string>;
    /**
     * Create integration template
     */
    createIntegrationTemplate(template: Omit<IntegrationTemplate, 'createdAt'>): Promise<string>;
    /**
      * Execute external API call
      */
    executeExternalCall(systemId: string, endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', data?: any, options?: {
        headers?: Record<string, string>;
        timeout?: number;
        transformRequest?: string;
        transformResponse?: string;
    }): Promise<any>; /**
    
   * Get integration templates by system type
     */
    getIntegrationTemplates(systemType?: string): IntegrationTemplate[];
    /**
     * Get external system configuration
     */
    getExternalSystem(systemId: string): ExternalSystemConfig | undefined;
    /**
     * List all external systems
     */
    listExternalSystems(): ExternalSystemConfig[];
    private setupDefaultTemplates;
    private addAuthentication;
    private makeHttpRequest;
    private executeWithRetry;
    private executeTransformation;
    private generateEventId;
}
export declare const externalIntegrationService: ExternalIntegrationService;
//# sourceMappingURL=ExternalIntegrationService.d.ts.map