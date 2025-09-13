/**
 * External Integration Controller for API Endpoints
 *
 * Handles HTTP endpoints for external system integration management
 */
import { Request, Response } from 'express';
export interface ExternalSystemCreateRequest {
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
}
export interface ExternalCallRequest {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    options?: {
        headers?: Record<string, string>;
        timeout?: number;
        transformRequest?: string;
        transformResponse?: string;
    };
}
/**
 * External Integration Controller
 */
export declare class ExternalIntegrationController {
    /**
     * Create external system configuration
     */
    createExternalSystem(req: Request, res: Response): Promise<void>;
    /**
     * List external systems
     */
    listExternalSystems(req: Request, res: Response): Promise<void>;
    /**
     * Get external system details
     */
    getExternalSystem(req: Request, res: Response): Promise<void>;
    /**
     * Execute external API call
     */
    executeExternalCall(req: Request, res: Response): Promise<void>;
    /**
     * Get integration templates
     */
    getIntegrationTemplates(req: Request, res: Response): Promise<void>;
    /**
     * Create integration template
     */
    createIntegrationTemplate(req: Request, res: Response): Promise<void>;
}
export declare const externalIntegrationController: ExternalIntegrationController;
//# sourceMappingURL=ExternalIntegrationController.d.ts.map