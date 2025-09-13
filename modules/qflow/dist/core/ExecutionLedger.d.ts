/**
 * Qflow Deterministic Execution Ledger
 *
 * Implements append-only log format with signed entries and vector clocks
 * for deterministic replay and Byzantine fault tolerance.
 */
import { EventEmitter } from 'events';
export interface VectorClock {
    [nodeId: string]: number;
}
export interface ExecutionRecord {
    execId: string;
    stepId: string;
    prevHash: string;
    payloadCID: string;
    actor: string;
    nodeId: string;
    timestamp: string;
    vectorClock: VectorClock;
    signature: string;
    recordHash?: string;
}
export interface LedgerEntry {
    record: ExecutionRecord;
    index: number;
    verified: boolean;
    timestamp: string;
}
export interface ReplayState {
    execId: string;
    currentStepIndex: number;
    vectorClock: VectorClock;
    stateHash: string;
    isReplaying: boolean;
    replayStartTime: string;
}
export interface LedgerValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    chainIntegrity: boolean;
    signatureValidity: boolean;
    causalConsistency: boolean;
}
/**
 * Deterministic Execution Ledger
 * Provides append-only log with cryptographic integrity and deterministic replay
 */
export declare class ExecutionLedger extends EventEmitter {
    private ledger;
    private vectorClocks;
    private replayStates;
    private isInitialized;
    constructor();
    /**
     * Initialize the execution ledger
     */
    initialize(): Promise<void>;
    /**
       * Append a new execution record to the ledger
       */
    appendRecord(record: Omit<ExecutionRecord, 'prevHash' | 'signature' | 'vectorClock'>): Promise<ExecutionRecord>;
    /**
     * Get execution records for a specific execution ID
     */
    getExecutionRecords(execId: string): LedgerEntry[];
    /**
     * Validate ledger integrity for an execution
     */
    validateLedger(execId: string): Promise<LedgerValidationResult>; /**
  
     * Start deterministic replay for an execution
     */
    startReplay(execId: string): Promise<ReplayState>;
    /**
     * Get next record in replay sequence
     */
    getNextReplayRecord(execId: string): ExecutionRecord | null;
    /**
     * Complete replay for an execution
     */
    completeReplay(execId: string): void;
    /**
     * Get current replay state
     */
    getReplayState(execId: string): ReplayState | null;
    /**
     * Calculate record hash
     */
    private calculateRecordHash;
    /**
     * Sign a record (mock implementation)
     */
    private signRecord;
    /**
     * Update vector clock for a node
     */
    private updateVectorClock;
    /**
     * Check if two vector clocks are causally consistent
     */
    private isCausallyConsistent;
    /**
     * Calculate state hash at a specific point in execution
     */
    private calculateStateHash;
    /**
     * Get ledger statistics
     */
    getStatistics(): {
        totalExecutions: number;
        totalRecords: number;
        activeReplays: number;
        nodeCount: number;
    };
    /**
     * Export ledger data for persistence
     */
    exportLedger(execId?: string): any;
    /**
     * Import ledger data from persistence
     */
    importLedger(data: any): void;
    /**
     * Shutdown the execution ledger
     */
    shutdown(): Promise<void>;
    /**
     * Check if ledger is ready
     */
    isReady(): boolean;
}
export declare const executionLedger: ExecutionLedger;
//# sourceMappingURL=ExecutionLedger.d.ts.map