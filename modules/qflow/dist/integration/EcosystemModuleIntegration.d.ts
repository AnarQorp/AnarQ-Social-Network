/**
 * Ecosystem Module Integration Service
 *
 * Provides integration capabilities with all AnarQ & Q ecosystem modules
 * including Qmail, QpiC, and other ecosystem services
 */
import { EventEmitter } from 'events';
export interface ModuleCapability {
    moduleId: string;
    name: string;
    version: string;
    capabilities: string[];
    endpoints: ModuleEndpoint[];
    eventTypes: string[];
    status: 'available' | 'unavailable' | 'degraded';
    lastHealthCheck: string;
    metadata: Record<string, any>;
}
export interface ModuleEndpoint {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    description: string;
    parameters: EndpointParameter[];
    responseSchema: any;
    authentication: boolean;
    rateLimit?: {
        requests: number;
        window: string;
    };
}
export interface EndpointParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    defaultValue?: any;
    validation?: {
        pattern?: string;
        min?: number;
        max?: number;
        enum?: any[];
    };
}
export interface ModuleCallRequest {
    moduleId: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    parameters?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
    retryPolicy?: {
        maxAttempts: number;
        backoffMs: number;
    };
}
export interface ModuleCallResponse {
    success: boolean;
    data?: any;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata: {
        moduleId: string;
        endpoint: string;
        duration: number;
        timestamp: string;
        requestId: string;
    };
}
export interface CrossModuleEvent {
    eventId: string;
    sourceModule: string;
    targetModule: string;
    eventType: string;
    payload: any;
    timestamp: string;
    correlationId?: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;
}
/**
 * Ecosystem Module Integration Service
 */
export declare class EcosystemModuleIntegration extends EventEmitter {
    private moduleCapabilities;
    private eventSubscriptions;
    private crossModuleEvents;
    private discoveryInterval;
    constructor(); /**
  
     * Discover and register ecosystem modules
     */
    discoverModules(): Promise<ModuleCapability[]>;
    /**
     * Call ecosystem module endpoint
     */
    callModuleEndpoint(request: ModuleCallRequest): Promise<ModuleCallResponse>;
    /**
     * Send cross-module event
     */
    sendCrossModuleEvent(event: Omit<CrossModuleEvent, 'eventId' | 'timestamp'>): Promise<string>;
    /**
     * Subscribe to cross-module events
     */
    subscribeToEvents(moduleId: string, eventTypes: string[]): void;
    /**
     * Get module capabilities
     */
    getModuleCapabilities(moduleId?: string): ModuleCapability[];
    /**
     * Check module health
     */
    checkModuleHealth(moduleId: string): Promise<boolean>;
    /**
     * Get cross-module events
     */
    getCrossModuleEvents(filters?: {
        sourceModule?: string;
        targetModule?: string;
        eventType?: string;
        since?: string;
    }): CrossModuleEvent[];
    /**
       * Setup module discovery
       */
    private setupModuleDiscovery;
    /**
     * Setup event handling
     */
    private setupEventHandling;
    /**
     * Discover Qmail module
     */
    private discoverQmailModule;
    /**
     * Discover QpiC module
     */
    private discoverQpiCModule;
    /**
     * Discover sQuid module
     */
    private discoverSquidModule;
    /**
     * Discover QNET module
     */
    private discoverQNETModule;
    /**
     * Validate endpoint parameters
     */
    private validateEndpointParameters;
    /**
     * Execute with retry policy
     */
    private executeWithRetry;
    /**
     * Make module call
     */
    private makeModuleCall;
    /**
     * Update module status
     */
    private updateModuleStatus;
    /**
     * Handle module registered event
     */
    private handleModuleRegistered;
    /**
     * Handle module unregistered event
     */
    private handleModuleUnregistered;
    /**
     * Handle module health changed event
     */
    private handleModuleHealthChanged;
    /**
     * Generate event ID
     */
    private generateEventId;
    /**
     * Generate request ID
     */
    private generateRequestId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const ecosystemModuleIntegration: EcosystemModuleIntegration;
//# sourceMappingURL=EcosystemModuleIntegration.d.ts.map