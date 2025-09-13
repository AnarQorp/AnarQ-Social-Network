/**
 * Qflow Ecosystem Integration
 *
 * Provides integration with all AnarQ & Q ecosystem services
 * for the Universal Validation Pipeline and distributed execution
 */
interface MockService {
    healthCheck(): Promise<{
        status: string;
    }>;
}
declare class MockSquidService implements MockService {
    healthCheck(): Promise<{
        status: string;
    }>;
    getIdentity(identityId: string): Promise<null>;
    validateSubIdentitySignature(params: any): Promise<boolean>;
    signToken(token: any, publicKey: string): Promise<string>;
    validateTokenSignature(token: any): Promise<boolean>;
}
export interface EcosystemServices {
    qonsent: MockService;
    qlock: MockService;
    qindex: MockService;
    qerberos: MockService;
    qnet: MockService;
    squid: MockSquidService;
}
export interface EcosystemHealth {
    status: 'healthy' | 'degraded' | 'error';
    services: Record<string, any>;
    timestamp: string;
}
/**
 * Ecosystem Integration Manager
 * Manages connections and health checks for all ecosystem services
 */
export declare class EcosystemIntegration {
    private services;
    private initialized;
    /**
     * Initialize ecosystem services
     */
    initialize(): Promise<void>;
    /**
     * Get ecosystem services (throws if not initialized)
     */
    getServices(): EcosystemServices;
    /**
     * Get specific ecosystem service
     */
    getService(serviceName: keyof EcosystemServices): any;
    /**
     * Get ecosystem health status
     */
    getHealth(): Promise<EcosystemHealth>;
    /**
     * Check if ecosystem services are ready
     */
    isReady(): boolean;
    /**
     * Shutdown ecosystem integration
     */
    shutdown(): Promise<void>;
}
export declare const ecosystemIntegration: EcosystemIntegration;
export {};
//# sourceMappingURL=EcosystemIntegration.d.ts.map