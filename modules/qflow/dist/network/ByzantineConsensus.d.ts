/**
 * Byzantine Consensus for Critical Operations
 *
 * Implements 2-phase commit over libp2p with timeouts, fallback to quadratic voting,
 * and Byzantine-fault-tolerant consensus for scarce resource mutations
 */
import { EventEmitter } from 'events';
export interface ConsensusProposal {
    proposalId: string;
    type: 'step-execution' | 'state-update' | 'checkpoint' | 'flow-completion' | 'resource-mutation';
    data: any;
    proposer: string;
    timestamp: string;
    timeout: number;
    requiredVotes: number;
    phase: 'prepare' | 'commit' | 'abort';
    status: 'pending' | 'prepared' | 'committed' | 'aborted' | 'timeout';
}
export interface ConsensusVote {
    voteId: string;
    proposalId: string;
    nodeId: string;
    phase: 'prepare' | 'commit';
    vote: 'yes' | 'no' | 'abstain';
    reason?: string;
    timestamp: string;
    signature: string;
    weight: number;
}
export interface ValidatorNode {
    nodeId: string;
    publicKey: string;
    weight: number;
    reputation: number;
    lastSeen: string;
    status: 'active' | 'inactive' | 'byzantine';
    daoSubnet?: string;
}
export interface ConsensusResult {
    proposalId: string;
    decision: 'approved' | 'rejected' | 'timeout';
    votes: ConsensusVote[];
    finalPhase: string;
    completedAt: string;
    evidence?: any;
}
export interface QuadraticVotingConfig {
    enableQuadraticVoting: boolean;
    maxVoteWeight: number;
    costFunction: 'quadratic' | 'linear' | 'exponential';
    tieBreakingMethod: 'random' | 'reputation' | 'stake';
}
export interface ByzantineDetection {
    nodeId: string;
    behavior: 'double-voting' | 'invalid-signature' | 'timeout' | 'conflicting-votes';
    evidence: any;
    detectedAt: string;
    severity: 'minor' | 'major' | 'critical';
    action: 'warn' | 'penalize' | 'exclude';
}
/**
 * Byzantine Consensus Engine
 */
export declare class ByzantineConsensus extends EventEmitter {
    private proposals;
    private votes;
    private validators;
    private consensusResults;
    private byzantineDetections;
    private readonly config;
    private readonly nodeId;
    private isRunning;
    private readonly TOPICS;
    constructor(nodeId: string, config?: Partial<QuadraticVotingConfig>);
    /**
     * Start consensus engine
     */
    start(): Promise<void>;
    /**
     * Stop consensus engine
     */
    stop(): Promise<void>;
    /**
     * Propose consensus for critical operation
     */
    proposeConsensus(type: ConsensusProposal['type'], data: any, timeout?: number, requiredVotes?: number): Promise<string>;
    /**
     * Vote on consensus proposal
     */
    voteOnProposal(proposalId: string, vote: 'yes' | 'no' | 'abstain', weight?: number, reason?: string): Promise<void>;
    /**
     * Get consensus result
     */
    getConsensusResult(proposalId: string): ConsensusResult | undefined;
    /**
     * Get active proposals
     */
    getActiveProposals(): ConsensusProposal[];
    /**
     * Get validator nodes
     */
    getValidators(): ValidatorNode[];
    /**
     * Get Byzantine detections
     */
    getByzantineDetections(): ByzantineDetection[];
    private setupEventHandlers;
    private registerValidator;
    private broadcastProposal;
    private broadcastVote;
    private checkConsensusReached;
    private breakTie;
    private finalizeConsensus;
    private broadcastResult;
    private handleConsensusTimeout;
    private calculateVoteCost;
    private signVote;
    private startByzantineDetection;
    private detectByzantineBehaviors;
    private detectByzantineBehavior;
    private getBehaviorSeverity;
    private getBehaviorAction;
    private handleProposalMessage;
    private handleVoteMessage;
    private handleResultMessage;
    private handleValidatorHeartbeat;
    private handleByzantineAlert;
    private evaluateProposal;
    private verifyVoteSignature;
    private generateProposalId;
    private generateVoteId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const byzantineConsensus: ByzantineConsensus;
//# sourceMappingURL=ByzantineConsensus.d.ts.map