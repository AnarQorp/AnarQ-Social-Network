/**
 * Libp2p Pubsub Coordination Service
 *
 * Implements peer-to-peer coordination using Libp2p Pubsub for
 * distributed execution coordination and message routing
 */
import { EventEmitter } from 'events';
export interface Libp2pNode {
    peerId: string;
    multiaddrs: string[];
    protocols: string[];
    status: 'connected' | 'disconnected' | 'connecting';
    lastSeen: string;
}
export interface PubsubMessage {
    messageId: string;
    topic: string;
    data: any;
    sender: string;
    timestamp: string;
    signature?: string;
    ttl?: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
    correlationId?: string;
}
export interface ExecutionDispatch {
    dispatchId: string;
    executionId: string;
    flowId: string;
    stepId: string;
    targetNodeId: string;
    payload: any;
    timeout: number;
    retryPolicy?: {
        maxAttempts: number;
        backoffMs: number;
    };
}
export interface ExecutionResult {
    dispatchId: string;
    executionId: string;
    stepId: string;
    success: boolean;
    result?: any;
    error?: string;
    nodeId: string;
    timestamp: string;
    duration: number;
}
export interface ConsensusOperation {
    operationId: string;
    type: 'step-execution' | 'state-update' | 'checkpoint' | 'flow-completion';
    data: any;
    requiredVotes: number;
    timeout: number;
    votes: ConsensusVote[];
    status: 'pending' | 'approved' | 'rejected' | 'timeout';
}
export interface ConsensusVote {
    voteId: string;
    nodeId: string;
    vote: 'approve' | 'reject';
    reason?: string;
    timestamp: string;
    signature: string;
}
export interface NetworkPartition {
    partitionId: string;
    detectedAt: string;
    affectedNodes: string[];
    isolatedNodes: string[];
    recoveredAt?: string;
    status: 'active' | 'recovered';
}
/**
 * Libp2p Pubsub Coordinator for distributed execution
 */
export declare class Libp2pCoordinator extends EventEmitter {
    private libp2pNode;
    private connectedPeers;
    private subscriptions;
    private messageQueue;
    private pendingDispatches;
    private consensusOperations;
    private networkPartitions;
    private messageHistory;
    private nodeId;
    private readonly TOPICS;
    constructor(nodeId?: string);
    /**
     * Initialize Libp2p node
     */
    private initializeLibp2p;
    /**
     * Dispatch execution step to target node
     */
    dispatchExecution(dispatch: Omit<ExecutionDispatch, 'dispatchId'>): Promise<string>;
    /**
     * Send execution result back to coordinator
     */
    sendExecutionResult(result: ExecutionResult): Promise<void>;
    /**
     * Start consensus operation
     */
    startConsensus(type: ConsensusOperation['type'], data: any, requiredVotes: number, timeout?: number): Promise<string>;
    /**
     * Vote on consensus operation
     */
    voteOnConsensus(operationId: string, vote: 'approve' | 'reject', reason?: string): Promise<void>;
    /**
     * Synchronize state with peers
     */
    synchronizeState(executionId: string, stateData: any): Promise<void>;
    /**
     * Get connected peers
     */
    getConnectedPeers(): Libp2pNode[];
    /**
     * Get pending dispatches
     */
    getPendingDispatches(): ExecutionDispatch[];
    /**
     * Get consensus operations
     */
    getConsensusOperations(): ConsensusOperation[];
    /**
     * Get network partitions
     */
    getNetworkPartitions(): NetworkPartition[];
    private setupMessageHandlers;
    private publishMessage;
    private handlePeerConnect;
    private handlePeerDisconnect;
    private handlePubsubMessage;
    private handleExecutionDispatch;
    private handleExecutionResult;
    private handleConsensusMessage;
    private handleHeartbeat;
    private handleStateSync;
    private handleNodeDiscovery;
    private handleDispatchTimeout;
    private handleConsensusTimeout;
    private handleConsensusReached;
    private shouldApproveConsensus;
    private startHeartbeat;
    private startPartitionDetection;
    private detectNetworkPartitions;
    private signMessage;
    private verifyMessageSignature;
    private signVote;
    private generateMessageId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): Promise<void>;
}
export declare const libp2pCoordinator: Libp2pCoordinator;
//# sourceMappingURL=Libp2pCoordinator.d.ts.map