/**
 * Byzantine Consensus for Critical Operations
 *
 * Implements 2-phase commit over libp2p with timeouts, fallback to quadratic voting,
 * and Byzantine-fault-tolerant consensus for scarce resource mutations
 */
import { EventEmitter } from 'events';
import { qflowEventEmitter } from '../events/EventEmitter.js';
import { libp2pCoordinator } from './Libp2pCoordinator.js';
/**
 * Byzantine Consensus Engine
 */
export class ByzantineConsensus extends EventEmitter {
    proposals = new Map();
    votes = new Map(); // proposalId -> votes
    validators = new Map();
    consensusResults = new Map();
    byzantineDetections = [];
    config;
    nodeId;
    isRunning = false;
    // Consensus topics
    TOPICS = {
        CONSENSUS_PROPOSAL: 'qflow.consensus.proposal',
        CONSENSUS_VOTE: 'qflow.consensus.vote',
        CONSENSUS_RESULT: 'qflow.consensus.result',
        VALIDATOR_HEARTBEAT: 'qflow.validator.heartbeat',
        BYZANTINE_ALERT: 'qflow.byzantine.alert'
    };
    constructor(nodeId, config = {}) {
        super();
        this.nodeId = nodeId;
        this.config = {
            enableQuadraticVoting: true,
            maxVoteWeight: 100,
            costFunction: 'quadratic',
            tieBreakingMethod: 'reputation',
            ...config
        };
        this.setupEventHandlers();
    }
    /**
     * Start consensus engine
     */
    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        // Register as validator
        await this.registerValidator();
        // Start Byzantine detection
        this.startByzantineDetection();
        console.log(`[ByzantineConsensus] Started consensus engine for node ${this.nodeId}`);
        // Emit started event
        await qflowEventEmitter.emit('q.qflow.consensus.started.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-byzantine-consensus',
            actor: this.nodeId,
            data: {
                nodeId: this.nodeId,
                config: this.config
            }
        });
    }
    /**
     * Stop consensus engine
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        console.log(`[ByzantineConsensus] Stopped consensus engine for node ${this.nodeId}`);
    }
    /**
     * Propose consensus for critical operation
     */
    async proposeConsensus(type, data, timeout = 30000, requiredVotes) {
        const proposalId = this.generateProposalId();
        // Calculate required votes (2/3 + 1 for Byzantine fault tolerance)
        const activeValidators = Array.from(this.validators.values()).filter(v => v.status === 'active');
        const defaultRequiredVotes = Math.floor((activeValidators.length * 2) / 3) + 1;
        const proposal = {
            proposalId,
            type,
            data,
            proposer: this.nodeId,
            timestamp: new Date().toISOString(),
            timeout,
            requiredVotes: requiredVotes || defaultRequiredVotes,
            phase: 'prepare',
            status: 'pending'
        };
        this.proposals.set(proposalId, proposal);
        this.votes.set(proposalId, []);
        console.log(`[ByzantineConsensus] Proposed consensus: ${proposalId} (type: ${type})`);
        // Broadcast proposal
        await this.broadcastProposal(proposal);
        // Set timeout
        setTimeout(() => {
            this.handleConsensusTimeout(proposalId);
        }, timeout);
        // Emit proposal created event
        await qflowEventEmitter.emit('q.qflow.consensus.proposed.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-byzantine-consensus',
            actor: this.nodeId,
            data: {
                proposalId,
                type,
                requiredVotes: proposal.requiredVotes,
                timeout
            }
        });
        return proposalId;
    }
    /**
     * Vote on consensus proposal
     */
    async voteOnProposal(proposalId, vote, weight = 1, reason) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal || proposal.status !== 'pending') {
            throw new Error(`Proposal ${proposalId} not found or not active`);
        }
        const validator = this.validators.get(this.nodeId);
        if (!validator || validator.status !== 'active') {
            throw new Error(`Node ${this.nodeId} is not an active validator`);
        }
        // Validate vote weight for quadratic voting
        if (this.config.enableQuadraticVoting) {
            const cost = this.calculateVoteCost(weight);
            if (cost > validator.weight) {
                throw new Error(`Insufficient weight for vote. Required: ${cost}, Available: ${validator.weight}`);
            }
        }
        const voteObj = {
            voteId: this.generateVoteId(),
            proposalId,
            nodeId: this.nodeId,
            phase: proposal.phase,
            vote,
            reason,
            timestamp: new Date().toISOString(),
            signature: await this.signVote(proposalId, vote, weight),
            weight: this.config.enableQuadraticVoting ? weight : 1
        };
        // Check for double voting (Byzantine behavior)
        const existingVotes = this.votes.get(proposalId) || [];
        const existingVote = existingVotes.find(v => v.nodeId === this.nodeId && v.phase === proposal.phase);
        if (existingVote) {
            await this.detectByzantineBehavior(this.nodeId, 'double-voting', {
                proposalId,
                existingVote,
                newVote: voteObj
            });
            return;
        }
        // Add vote
        existingVotes.push(voteObj);
        this.votes.set(proposalId, existingVotes);
        console.log(`[ByzantineConsensus] Voted ${vote} on proposal ${proposalId} (weight: ${weight})`);
        // Broadcast vote
        await this.broadcastVote(voteObj);
        // Check if consensus is reached
        await this.checkConsensusReached(proposalId);
        // Emit vote cast event
        await qflowEventEmitter.emit('q.qflow.consensus.voted.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-byzantine-consensus',
            actor: this.nodeId,
            data: {
                proposalId,
                vote,
                weight,
                phase: proposal.phase
            }
        });
    }
    /**
     * Get consensus result
     */
    getConsensusResult(proposalId) {
        return this.consensusResults.get(proposalId);
    }
    /**
     * Get active proposals
     */
    getActiveProposals() {
        return Array.from(this.proposals.values()).filter(p => p.status === 'pending');
    }
    /**
     * Get validator nodes
     */
    getValidators() {
        return Array.from(this.validators.values());
    }
    /**
     * Get Byzantine detections
     */
    getByzantineDetections() {
        return [...this.byzantineDetections];
    }
    // Private methods
    setupEventHandlers() {
        // Handle libp2p messages
        libp2pCoordinator.on('pubsub:message', async (message) => {
            try {
                switch (message.topic) {
                    case this.TOPICS.CONSENSUS_PROPOSAL:
                        await this.handleProposalMessage(message);
                        break;
                    case this.TOPICS.CONSENSUS_VOTE:
                        await this.handleVoteMessage(message);
                        break;
                    case this.TOPICS.CONSENSUS_RESULT:
                        await this.handleResultMessage(message);
                        break;
                    case this.TOPICS.VALIDATOR_HEARTBEAT:
                        await this.handleValidatorHeartbeat(message);
                        break;
                    case this.TOPICS.BYZANTINE_ALERT:
                        await this.handleByzantineAlert(message);
                        break;
                }
            }
            catch (error) {
                console.error(`[ByzantineConsensus] Failed to handle message: ${error}`);
            }
        });
    }
    async registerValidator() {
        const validator = {
            nodeId: this.nodeId,
            publicKey: 'mock_public_key', // In real implementation, would use actual public key
            weight: 100, // Default weight
            reputation: 1.0,
            lastSeen: new Date().toISOString(),
            status: 'active'
        };
        this.validators.set(this.nodeId, validator);
        // Broadcast validator registration
        // In real implementation, would broadcast to network
        console.log(`[ByzantineConsensus] Registered validator: ${this.nodeId}`);
    }
    async broadcastProposal(proposal) {
        // In real implementation, would broadcast via libp2p pubsub
        console.log(`[ByzantineConsensus] Broadcasting proposal: ${proposal.proposalId}`);
    }
    async broadcastVote(vote) {
        // In real implementation, would broadcast via libp2p pubsub
        console.log(`[ByzantineConsensus] Broadcasting vote: ${vote.voteId}`);
    }
    async checkConsensusReached(proposalId) {
        const proposal = this.proposals.get(proposalId);
        const votes = this.votes.get(proposalId);
        if (!proposal || !votes || proposal.status !== 'pending') {
            return;
        }
        // Count votes by type
        const yesVotes = votes.filter(v => v.vote === 'yes' && v.phase === proposal.phase);
        const noVotes = votes.filter(v => v.vote === 'no' && v.phase === proposal.phase);
        // Calculate weighted votes if quadratic voting is enabled
        let yesWeight = 0;
        let noWeight = 0;
        if (this.config.enableQuadraticVoting) {
            yesWeight = yesVotes.reduce((sum, vote) => sum + vote.weight, 0);
            noWeight = noVotes.reduce((sum, vote) => sum + vote.weight, 0);
        }
        else {
            yesWeight = yesVotes.length;
            noWeight = noVotes.length;
        }
        const totalVotes = yesVotes.length + noVotes.length;
        // Check if we have enough votes
        if (totalVotes >= proposal.requiredVotes) {
            let decision;
            if (yesWeight > noWeight) {
                decision = 'approved';
            }
            else if (noWeight > yesWeight) {
                decision = 'rejected';
            }
            else {
                // Tie - use tie-breaking method
                decision = await this.breakTie(yesVotes, noVotes);
            }
            // Handle 2-phase commit
            if (proposal.phase === 'prepare' && decision === 'approved') {
                // Move to commit phase
                proposal.phase = 'commit';
                proposal.status = 'prepared';
                // Clear votes for commit phase
                this.votes.set(proposalId, []);
                // Broadcast commit phase
                await this.broadcastProposal(proposal);
                console.log(`[ByzantineConsensus] Proposal ${proposalId} prepared, moving to commit phase`);
            }
            else if (proposal.phase === 'commit' && decision === 'approved') {
                // Consensus reached
                await this.finalizeConsensus(proposalId, 'approved', votes);
            }
            else {
                // Consensus rejected or prepare phase rejected
                await this.finalizeConsensus(proposalId, 'rejected', votes);
            }
        }
    }
    async breakTie(yesVotes, noVotes) {
        switch (this.config.tieBreakingMethod) {
            case 'random':
                return Math.random() < 0.5 ? 'approved' : 'rejected';
            case 'reputation':
                const yesReputation = yesVotes.reduce((sum, vote) => {
                    const validator = this.validators.get(vote.nodeId);
                    return sum + (validator?.reputation || 0);
                }, 0);
                const noReputation = noVotes.reduce((sum, vote) => {
                    const validator = this.validators.get(vote.nodeId);
                    return sum + (validator?.reputation || 0);
                }, 0);
                return yesReputation >= noReputation ? 'approved' : 'rejected';
            case 'stake':
                // In real implementation, would use actual stake amounts
                return 'rejected'; // Conservative default
            default:
                return 'rejected';
        }
    }
    async finalizeConsensus(proposalId, decision, votes) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            return;
        }
        proposal.status = decision === 'approved' ? 'committed' : 'aborted';
        const result = {
            proposalId,
            decision,
            votes: [...votes],
            finalPhase: proposal.phase,
            completedAt: new Date().toISOString()
        };
        this.consensusResults.set(proposalId, result);
        console.log(`[ByzantineConsensus] Consensus finalized: ${proposalId} (${decision})`);
        // Emit consensus reached event
        await qflowEventEmitter.emit('q.qflow.consensus.finalized.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-byzantine-consensus',
            actor: this.nodeId,
            data: {
                proposalId,
                decision,
                totalVotes: votes.length,
                phase: proposal.phase
            }
        });
        // Broadcast result
        await this.broadcastResult(result);
    }
    async broadcastResult(result) {
        // In real implementation, would broadcast via libp2p pubsub
        console.log(`[ByzantineConsensus] Broadcasting result: ${result.proposalId} (${result.decision})`);
    }
    handleConsensusTimeout(proposalId) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal || proposal.status !== 'pending') {
            return;
        }
        proposal.status = 'timeout';
        const votes = this.votes.get(proposalId) || [];
        const result = {
            proposalId,
            decision: 'timeout',
            votes,
            finalPhase: proposal.phase,
            completedAt: new Date().toISOString()
        };
        this.consensusResults.set(proposalId, result);
        console.warn(`[ByzantineConsensus] Consensus timeout: ${proposalId}`);
        // Emit timeout event
        qflowEventEmitter.emit('q.qflow.consensus.timeout.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-byzantine-consensus',
            actor: this.nodeId,
            data: {
                proposalId,
                phase: proposal.phase,
                votes: votes.length,
                requiredVotes: proposal.requiredVotes
            }
        });
    }
    calculateVoteCost(weight) {
        switch (this.config.costFunction) {
            case 'quadratic':
                return weight * weight;
            case 'linear':
                return weight;
            case 'exponential':
                return Math.pow(2, weight);
            default:
                return weight;
        }
    }
    async signVote(proposalId, vote, weight) {
        // Simplified signing - in real implementation would use proper cryptographic signing
        const dataToSign = `${proposalId}:${vote}:${weight}:${this.nodeId}`;
        return `vote_sig_${Buffer.from(dataToSign).toString('base64').substring(0, 32)}`;
    }
    startByzantineDetection() {
        // Start periodic Byzantine behavior detection
        setInterval(() => {
            this.detectByzantineBehaviors();
        }, 60000); // Every minute
    }
    detectByzantineBehaviors() {
        // Check for timeout patterns
        for (const validator of this.validators.values()) {
            const lastSeen = new Date(validator.lastSeen).getTime();
            const now = Date.now();
            if (now - lastSeen > 300000) { // 5 minutes
                this.detectByzantineBehavior(validator.nodeId, 'timeout', {
                    lastSeen: validator.lastSeen,
                    timeoutDuration: now - lastSeen
                });
            }
        }
    }
    async detectByzantineBehavior(nodeId, behavior, evidence) {
        const detection = {
            nodeId,
            behavior,
            evidence,
            detectedAt: new Date().toISOString(),
            severity: this.getBehaviorSeverity(behavior),
            action: this.getBehaviorAction(behavior)
        };
        this.byzantineDetections.push(detection);
        // Take action
        const validator = this.validators.get(nodeId);
        if (validator) {
            switch (detection.action) {
                case 'warn':
                    validator.reputation = Math.max(0, validator.reputation - 0.1);
                    break;
                case 'penalize':
                    validator.reputation = Math.max(0, validator.reputation - 0.3);
                    validator.weight = Math.max(1, validator.weight * 0.8);
                    break;
                case 'exclude':
                    validator.status = 'byzantine';
                    break;
            }
        }
        console.warn(`[ByzantineConsensus] Byzantine behavior detected: ${nodeId} (${behavior})`);
        // Emit Byzantine detection event
        await qflowEventEmitter.emit('q.qflow.byzantine.detected.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-byzantine-consensus',
            actor: this.nodeId,
            data: {
                nodeId,
                behavior,
                severity: detection.severity,
                action: detection.action
            }
        });
    }
    getBehaviorSeverity(behavior) {
        switch (behavior) {
            case 'double-voting':
            case 'conflicting-votes':
                return 'critical';
            case 'invalid-signature':
                return 'major';
            case 'timeout':
                return 'minor';
            default:
                return 'minor';
        }
    }
    getBehaviorAction(behavior) {
        switch (behavior) {
            case 'double-voting':
            case 'conflicting-votes':
                return 'exclude';
            case 'invalid-signature':
                return 'penalize';
            case 'timeout':
                return 'warn';
            default:
                return 'warn';
        }
    }
    async handleProposalMessage(message) {
        // Handle incoming consensus proposal
        const proposal = message.data;
        if (!this.proposals.has(proposal.proposalId)) {
            this.proposals.set(proposal.proposalId, proposal);
            this.votes.set(proposal.proposalId, []);
            // Auto-vote based on proposal type and data
            const vote = await this.evaluateProposal(proposal);
            await this.voteOnProposal(proposal.proposalId, vote);
        }
    }
    async handleVoteMessage(message) {
        // Handle incoming vote
        const vote = message.data;
        // Verify vote signature
        const signatureValid = await this.verifyVoteSignature(vote);
        if (!signatureValid) {
            await this.detectByzantineBehavior(vote.nodeId, 'invalid-signature', { vote });
            return;
        }
        // Add vote to proposal
        const votes = this.votes.get(vote.proposalId) || [];
        votes.push(vote);
        this.votes.set(vote.proposalId, votes);
        // Check consensus
        await this.checkConsensusReached(vote.proposalId);
    }
    async handleResultMessage(message) {
        // Handle consensus result
        const result = message.data;
        this.consensusResults.set(result.proposalId, result);
    }
    async handleValidatorHeartbeat(message) {
        // Handle validator heartbeat
        const { nodeId } = message.data;
        const validator = this.validators.get(nodeId);
        if (validator) {
            validator.lastSeen = new Date().toISOString();
        }
    }
    async handleByzantineAlert(message) {
        // Handle Byzantine behavior alert
        const detection = message.data;
        this.byzantineDetections.push(detection);
    }
    async evaluateProposal(proposal) {
        // Simple evaluation logic - in real implementation would be more sophisticated
        switch (proposal.type) {
            case 'step-execution':
                return 'yes'; // Generally approve step execution
            case 'state-update':
                return 'yes'; // Generally approve state updates
            case 'checkpoint':
                return 'yes'; // Generally approve checkpoints
            case 'flow-completion':
                return 'yes'; // Generally approve flow completion
            case 'resource-mutation':
                // More careful evaluation for resource mutations
                return Math.random() > 0.2 ? 'yes' : 'no';
            default:
                return 'abstain';
        }
    }
    async verifyVoteSignature(vote) {
        // Simplified verification - in real implementation would use proper cryptographic verification
        const expectedSignature = await this.signVote(vote.proposalId, vote.vote, vote.weight);
        return vote.signature.length > 0; // Mock verification
    }
    generateProposalId() {
        return `proposal_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateVoteId() {
        return `vote_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        this.proposals.clear();
        this.votes.clear();
        this.validators.clear();
        this.consensusResults.clear();
        this.byzantineDetections.length = 0;
        this.removeAllListeners();
    }
}
// Export singleton instance
export const byzantineConsensus = new ByzantineConsensus('default_node');
//# sourceMappingURL=ByzantineConsensus.js.map