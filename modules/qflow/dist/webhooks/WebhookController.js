/**
 * Webhook Controller for API Endpoints
 *
 * Handles HTTP endpoints for webhook management and processing
 */
import { webhookService } from './WebhookService.js';
import { flowOwnershipService } from '../auth/FlowOwnershipService.js';
/**
 * Webhook Controller
 */
export class WebhookController {
    /**
     * Create webhook configuration
     */
    async createWebhook(req, res) {
        try {
            const { flowId, endpoint, secret, signatureHeader, signatureAlgorithm, allowedSources, rateLimitPerMinute } = req.body;
            if (!flowId || !endpoint) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_REQUIRED_FIELDS',
                        message: 'flowId and endpoint are required'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            if (!req.identity) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            // Check if user has permission to create webhooks for this flow
            const hasPermission = await flowOwnershipService.hasPermission(req.identity.id, flowId, 'modify');
            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Insufficient permissions to create webhook for this flow'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            // Generate unique endpoint if not provided
            const webhookEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
            const webhookId = await webhookService.registerWebhook({
                flowId,
                endpoint: webhookEndpoint,
                secret,
                signatureHeader,
                signatureAlgorithm,
                allowedSources,
                rateLimitPerMinute,
                enabled: true,
                createdBy: req.identity.id
            });
            res.status(201).json({
                success: true,
                data: {
                    webhookId,
                    flowId,
                    endpoint: webhookEndpoint,
                    enabled: true,
                    createdAt: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
        catch (error) {
            console.error('[WebhookController] Create webhook error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'CREATE_WEBHOOK_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to create webhook'
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
    }
    /**
     * List webhooks for a flow
     */
    async listWebhooks(req, res) {
        try {
            const { flowId } = req.params;
            if (!req.identity) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            // Check if user has permission to view webhooks for this flow
            const hasPermission = await flowOwnershipService.hasPermission(req.identity.id, flowId, 'read');
            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'Insufficient permissions to view webhooks for this flow'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            const webhooks = webhookService.getWebhookConfigs(flowId);
            res.json({
                success: true,
                data: {
                    webhooks: webhooks.map(webhook => ({
                        ...webhook,
                        // Hide sensitive information
                        secret: webhook.secret ? '***' : undefined
                    }))
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
        catch (error) {
            console.error('[WebhookController] List webhooks error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'LIST_WEBHOOKS_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to list webhooks'
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
    }
    /**
     * Update webhook configuration
     */
    async updateWebhook(req, res) {
        try {
            const { webhookId } = req.params;
            const updates = req.body;
            if (!req.identity) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            const success = await webhookService.updateWebhookConfig(webhookId, updates, req.identity.id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'WEBHOOK_NOT_FOUND',
                        message: 'Webhook configuration not found'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    webhookId,
                    updatedAt: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
        catch (error) {
            console.error('[WebhookController] Update webhook error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'UPDATE_WEBHOOK_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to update webhook'
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
    }
    /**
     * Delete webhook configuration
     */
    async deleteWebhook(req, res) {
        try {
            const { webhookId } = req.params;
            if (!req.identity) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'AUTHENTICATION_REQUIRED',
                        message: 'Authentication required'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            const success = await webhookService.deleteWebhookConfig(webhookId, req.identity.id);
            if (!success) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'WEBHOOK_NOT_FOUND',
                        message: 'Webhook configuration not found'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    webhookId,
                    deletedAt: new Date().toISOString()
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
        catch (error) {
            console.error('[WebhookController] Delete webhook error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'DELETE_WEBHOOK_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to delete webhook'
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
    }
    /**
     * Process incoming webhook
     */
    async processWebhook(req, res) {
        try {
            const endpoint = req.path;
            const headers = req.headers;
            const body = JSON.stringify(req.body);
            const sourceIp = req.ip;
            const result = await webhookService.processWebhookEvent(endpoint, headers, body, sourceIp);
            if (!result.valid) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'WEBHOOK_VALIDATION_FAILED',
                        message: 'Webhook validation failed',
                        details: {
                            errors: result.errors,
                            warnings: result.warnings
                        }
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id']
                });
                return;
            }
            res.json({
                success: true,
                data: {
                    processed: true,
                    eventId: result.processedEvent?.id,
                    flowId: result.processedEvent?.flowId,
                    warnings: result.warnings
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
        catch (error) {
            console.error('[WebhookController] Process webhook error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'PROCESS_WEBHOOK_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to process webhook'
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
    }
    /**
     * Get webhook event schemas
     */
    async getEventSchemas(req, res) {
        try {
            // Return available event schemas
            const schemas = [
                {
                    name: 'github-push',
                    version: '1.0.0',
                    source: 'github',
                    description: 'GitHub push event webhook',
                    example: {
                        ref: 'refs/heads/main',
                        repository: { name: 'my-repo', full_name: 'user/my-repo' },
                        commits: [{ id: 'abc123', message: 'Update README' }],
                        pusher: { name: 'user', email: 'user@example.com' }
                    }
                },
                {
                    name: 'stripe-payment',
                    version: '1.0.0',
                    source: 'stripe',
                    description: 'Stripe payment event webhook',
                    example: {
                        id: 'evt_123',
                        type: 'payment_intent.succeeded',
                        data: { object: { id: 'pi_123', amount: 2000, currency: 'usd' } },
                        created: 1234567890
                    }
                },
                {
                    name: 'generic-webhook',
                    version: '1.0.0',
                    source: 'generic',
                    description: 'Generic webhook event',
                    example: {
                        event: 'user.created',
                        data: { userId: '123', email: 'user@example.com' },
                        timestamp: '2023-01-01T00:00:00Z'
                    }
                }
            ];
            res.json({
                success: true,
                data: { schemas },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
        catch (error) {
            console.error('[WebhookController] Get event schemas error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'GET_SCHEMAS_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to get event schemas'
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id']
            });
        }
    }
}
// Export singleton instance
export const webhookController = new WebhookController();
//# sourceMappingURL=WebhookController.js.map