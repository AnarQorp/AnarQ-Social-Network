/**
 * Webhook Controller for API Endpoints
 *
 * Handles HTTP endpoints for webhook management and processing
 */
import { Request, Response } from 'express';
export interface WebhookCreateRequest {
    flowId: string;
    endpoint: string;
    secret?: string;
    signatureHeader?: string;
    signatureAlgorithm?: 'sha256' | 'sha1' | 'md5';
    allowedSources?: string[];
    rateLimitPerMinute?: number;
}
export interface WebhookUpdateRequest {
    secret?: string;
    signatureHeader?: string;
    signatureAlgorithm?: 'sha256' | 'sha1' | 'md5';
    allowedSources?: string[];
    rateLimitPerMinute?: number;
    enabled?: boolean;
}
/**
 * Webhook Controller
 */
export declare class WebhookController {
    /**
     * Create webhook configuration
     */
    createWebhook(req: Request, res: Response): Promise<void>;
    /**
     * List webhooks for a flow
     */
    listWebhooks(req: Request, res: Response): Promise<void>;
    /**
     * Update webhook configuration
     */
    updateWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Delete webhook configuration
     */
    deleteWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Process incoming webhook
     */
    processWebhook(req: Request, res: Response): Promise<void>;
    /**
     * Get webhook event schemas
     */
    getEventSchemas(req: Request, res: Response): Promise<void>;
}
export declare const webhookController: WebhookController;
//# sourceMappingURL=WebhookController.d.ts.map