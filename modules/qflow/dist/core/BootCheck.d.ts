/**
 * Qflow Boot Check
 *
 * Runtime boot check requiring IPFS + libp2p presence
 * Exits if centralized dependencies are detected at runtime
 */
export interface BootCheckResult {
    success: boolean;
    errors: string[];
    warnings: string[];
}
export interface DistributedInfrastructure {
    ipfs: boolean;
    libp2p: boolean;
    nodeId?: string;
    peers?: number;
}
/**
 * Boot Check Service
 * Ensures Qflow can only start in a truly distributed environment
 */
export declare class BootCheck {
    private static instance;
    private infrastructureStatus;
    private constructor();
    static getInstance(): BootCheck;
    /**
     * Perform comprehensive boot check
     */
    performBootCheck(): Promise<BootCheckResult>;
    /**
     * Check IPFS availability
     */
    private checkIPFS;
    /**
     * Check Libp2p availability
     */
    private checkLibp2p;
    /**
     * Check for centralized service dependencies
     */
    private checkForCentralizedServices;
    /**
     * Check network requirements for distributed operation
     */
    private checkNetworkRequirements;
    /**
     * Get current infrastructure status
     */
    getInfrastructureStatus(): DistributedInfrastructure;
    /**
     * Force exit if centralized dependencies detected
     */
    enforceDistributedMode(): void;
}
export declare const bootCheck: BootCheck;
//# sourceMappingURL=BootCheck.d.ts.map