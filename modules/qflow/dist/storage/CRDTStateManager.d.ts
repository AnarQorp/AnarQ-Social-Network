/**
 * CRDT State Management with IPFS Blocks
 *
 * Implements CRDT (Conflict-free Replicated Data Types) support for concurrent
 * state operations with IPFS block storage and vector clock causal ordering
 */
import { EventEmitter } from 'events';
import { ExecutionState } from '../models/FlowDefinition.js';
export interface VectorClock {
    [nodeId: string]: number;
}
export interface CRDTOperation {
    operationId: string;
    type: 'set' | 'delete' | 'increment' | 'decrement' | 'append' | 'merge';
    path: string;
    value: any;
    timestamp: string;
    nodeId: string;
    vectorClock: VectorClock;
    causality: string[];
}
export interface CRDTState {
    executionId: string;
    baseState: ExecutionState;
    operations: CRDTOperation[];
    vectorClock: VectorClock;
    lastCompacted: string;
    conflictResolutions: ConflictResolution[];
}
export interface ConflictResolution {
    conflictId: string;
    operationIds: string[];
    resolutionStrategy: 'last-write-wins' | 'merge' | 'custom';
    resolvedValue: any;
    resolvedAt: string;
    resolvedBy: string;
}
export interface StateCompaction {
    compactionId: string;
    executionId: string;
    beforeOperationCount: number;
    afterOperationCount: number;
    compactedState: ExecutionState;
    compactedAt: string;
    ipfsCid: string;
}
export interface ConcurrentStateUpdate {
    executionId: string;
    nodeId: string;
    operations: CRDTOperation[];
    vectorClock: VectorClock;
    timestamp: string;
}
export interface ConflictDetectionResult {
    hasConflicts: boolean;
    conflicts: {
        operationId1: string;
        operationId2: string;
        path: string;
        conflictType: 'concurrent-write' | 'causal-violation' | 'type-mismatch';
        description: string;
    }[];
}
/**
 * CRDT State Manager for distributed concurrent state operations
 */
export declare class CRDTStateManager extends EventEmitter {
    private crdtStates;
    private nodeId;
    private vectorClocks;
    private operationLog;
    private compactionHistory;
    private conflictTelemetry;
    constructor(nodeId?: string);
    /**
     * Apply CRDT operation to state
     */
    applyOperation(executionId: string, operation: Omit<CRDTOperation, 'operationId' | 'nodeId' | 'vectorClock' | 'timestamp'>): Promise<string>;
    /**
     * Merge concurrent state updates from other nodes
     */
    mergeConcurrentUpdates(updates: ConcurrentStateUpdate[]): Promise<void>;
    /**
     * Get current state with all operations applied
     */
    getCurrentState(executionId: string): Promise<ExecutionState | null>;
    /**
     * Create state delta for synchronization
     */
    createStateDelta(executionId: string, sinceVectorClock?: VectorClock): Promise<ConcurrentStateUpdate | null>;
    /**
     * Compact state by merging operations into base state
     */
    compactState(executionId: string): Promise<StateCompaction | null>;
    /**
     * Get conflict telemetry
     */
    getConflictTelemetry(): ConflictResolution[];
    /**
     * Get operation log for execution
     */
    getOperationLog(executionId: string): CRDTOperation[];
    /**
     * Get compaction history
     */
    getCompactionHistory(executionId: string): StateCompaction[];
    private mergeRemoteOperations;
    private detectConflicts;
    private resolveConflicts;
    private resolveConflict;
    private applyOperationToState;
    private sortOperationsByCausalOrder;
    private isCausallyOrdered;
    private isOperationNewer;
    private mergeVectorClocks;
    private loadOrCreateBaseState;
    private recomputeBaseState;
    private setValueAtPath;
    private getValueAtPath;
    private deleteValueAtPath;
    private setupPeriodicCompaction;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const crdtStateManager: CRDTStateManager;
//# sourceMappingURL=CRDTStateManager.d.ts.map