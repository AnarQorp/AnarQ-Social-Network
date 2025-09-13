/**
 * IPFS State Storage Service
 *
 * Provides distributed state storage using IPFS with cryptographic signing
 * and encryption through Qlock integration
 */
import { EventEmitter } from 'events';
import { ExecutionState } from '../models/FlowDefinition.js';
export interface IPFSClient {
    add(data: any, options?: any): Promise<{
        cid: any;
        size: number;
    }>;
    cat(cid: any): AsyncIterable<Uint8Array>;
    pin: {
        add(cid: any): Promise<void>;
        rm(cid: any): Promise<void>;
        ls(): AsyncIterable<{
            cid: any;
            type: string;
        }>;
    };
    version(): Promise<{
        version: string;
        commit: string;
        repo: string;
    }>;
    id(): Promise<{
        id: string;
        publicKey: string;
        addresses: string[];
    }>;
}
export interface StateRecord {
    executionId: string;
    state: ExecutionState;
    signature: string;
    timestamp: string;
    version: string;
    previousCid?: string;
    checksum: string;
}
export interface StateMetadata {
    executionId: string;
    flowId: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    size: number;
    cid: string;
    encrypted: boolean;
    signedBy: string;
}
export interface CheckpointInfo {
    checkpointId: string;
    executionId: string;
    cid: string;
    timestamp: string;
    stepId: string;
    description?: string;
}
/**
 * IPFS State Storage Service
 */
export declare class IPFSStateStorage extends EventEmitter {
    private ipfsClient;
    private stateMetadata;
    private checkpoints;
    private encryptionEnabled;
    private signingEnabled;
    constructor();
    /**
     * Initialize IPFS client
     */
    private initializeIPFS;
    /**
     * Save execution state to IPFS
     */
    saveState(executionId: string, state: ExecutionState): Promise<string>;
    /**
     * Load execution state from IPFS
     */
    loadState(executionId: string): Promise<ExecutionState>;
    /**
     * Create checkpoint for execution state
     */
    createCheckpoint(executionId: string, stepId: string, description?: string): Promise<string>;
    /**
     * Restore execution state from checkpoint
     */
    restoreCheckpoint(executionId: string, checkpointId: string): Promise<void>;
    /**
     * Get checkpoints for execution
     */
    getCheckpoints(executionId: string): CheckpointInfo[];
    /**
     * Get state metadata
     */
    getStateMetadata(executionId: string): StateMetadata | undefined;
    /**
     * List all stored states
     */
    listStates(): StateMetadata[];
    /**
     * Delete state from IPFS (unpin)
     */
    deleteState(executionId: string): Promise<boolean>;
    /**
     * Get IPFS node information
     */
    getNodeInfo(): Promise<{
        id: string;
        version: string;
        addresses: string[];
    } | null>;
    /**
     * Calculate checksum for data
     */
    private calculateChecksum;
    /**
     * Sign state record using Qlock
     */
    private signStateRecord;
    /**
     * Verify state record signature using Qlock
     */
    private verifyStateRecord;
    /**
     * Encrypt data using Qlock
     */
    private encryptData;
    /**
     * Decrypt data using Qlock
     */
    private decryptData;
    /**
     * Generate event ID
     */
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const ipfsStateStorage: IPFSStateStorage;
//# sourceMappingURL=IPFSStateStorage.d.ts.map