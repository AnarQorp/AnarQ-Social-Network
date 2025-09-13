/**
 * Gossipsub Backpressure and Fair Work Distribution
 *
 * Implements token-bucket per node with fair scheduling, priority lanes,
 * and reannounce policy for unclaimed jobs with exponential backoff
 */
import { EventEmitter } from 'events';
import { qflowEventEmitter } from '../events/EventEmitter.js';
import { libp2pCoordinator } from './Libp2pCoordinator.js';
/**
 * Gossipsub Work Distributor with Fair Scheduling
 */
export class GossipsubWorkDistributor extends EventEmitter {
    workQueue = new Map();
    tokenBuckets = new Map();
    nodeWorkloads = new Map();
    reannounceTimers = new Map();
    priorityQueues = new Map(); // priority -> work items
    config;
    reannouncePolicy;
    rebalanceTimer = null;
    isRunning = false;
    // IPFS job manifest topics
    TOPICS = {
        WORK_AVAILABLE: 'qflow.work.available',
        WORK_CLAIM: 'qflow.work.claim',
        WORK_RESULT: 'qflow.work.result',
        WORK_REANNOUNCE: 'qflow.work.reannounce',
        NODE_CAPACITY: 'qflow.node.capacity'
    };
    constructor(config = {}, reannouncePolicy = {}) {
        super();
        this.config = {
            enablePriorityLanes: true,
            priorityWeights: {
                'critical': 4,
                'high': 3,
                'normal': 2,
                'low': 1
            },
            maxJobsPerNode: 10,
            rebalanceIntervalMs: 30000, // 30 seconds
            starvationPreventionMs: 300000, // 5 minutes
            ...config
        };
        this.reannouncePolicy = {
            initialDelayMs: 5000, // 5 seconds
            maxDelayMs: 300000, // 5 minutes
            backoffMultiplier: 2,
            jitterPercent: 20,
            maxAttempts: 10,
            ...reannouncePolicy
        };
        // Initialize priority queues
        for (const priority of ['critical', 'high', 'normal', 'low']) {
            this.priorityQueues.set(priority, []);
        }
        this.setupEventHandlers();
    }
    /**
     * Start the work distributor
     */
    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        // Start rebalancing timer
        this.rebalanceTimer = setInterval(() => {
            this.rebalanceWorkload();
        }, this.config.rebalanceIntervalMs);
        // Subscribe to gossipsub topics
        await this.subscribeToTopics();
        console.log('[GossipsubWorkDistributor] Started work distribution system');
        // Emit started event
        await qflowEventEmitter.emit('q.qflow.work.distributor.started.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-work-distributor',
            actor: 'system',
            data: {
                config: this.config,
                reannouncePolicy: this.reannouncePolicy
            }
        });
    }
    /**
     * Stop the work distributor
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        // Clear timers
        if (this.rebalanceTimer) {
            clearInterval(this.rebalanceTimer);
            this.rebalanceTimer = null;
        }
        // Clear reannounce timers
        for (const timer of this.reannounceTimers.values()) {
            clearTimeout(timer);
        }
        this.reannounceTimers.clear();
        console.log('[GossipsubWorkDistributor] Stopped work distribution system');
    }
    /**
     * Submit work item for distribution
     */
    async submitWork(workItem) {
        const workId = this.generateWorkId();
        const fullWorkItem = {
            ...workItem,
            workId,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        // Add to work queue
        this.workQueue.set(workId, fullWorkItem);
        // Add to priority queue
        const priorityQueue = this.priorityQueues.get(fullWorkItem.priority);
        if (priorityQueue) {
            priorityQueue.push(fullWorkItem);
            // Sort by priority weight and creation time
            priorityQueue.sort((a, b) => {
                const weightA = this.config.priorityWeights[a.priority] || 1;
                const weightB = this.config.priorityWeights[b.priority] || 1;
                if (weightA !== weightB) {
                    return weightB - weightA; // Higher weight first
                }
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // FIFO for same priority
            });
        }
        console.log(`[GossipsubWorkDistributor] Submitted work item: ${workId} (priority: ${fullWorkItem.priority})`);
        // Announce work availability
        await this.announceWorkAvailable(fullWorkItem);
        // Emit work submitted event
        await qflowEventEmitter.emit('q.qflow.work.submitted.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-work-distributor',
            actor: 'system',
            data: {
                workId,
                executionId: fullWorkItem.executionId,
                stepId: fullWorkItem.stepId,
                priority: fullWorkItem.priority
            }
        });
        return workId;
    }
    /**
     * Claim work item
     */
    async claimWork(workId, nodeId) {
        const workItem = this.workQueue.get(workId);
        if (!workItem || workItem.status !== 'pending') {
            return false;
        }
        // Check if node has capacity
        if (!this.hasCapacity(nodeId, workItem)) {
            return false;
        }
        // Check token bucket
        if (!this.consumeToken(nodeId, workItem.priority)) {
            return false;
        }
        // Claim the work
        workItem.status = 'claimed';
        workItem.claimedBy = nodeId;
        workItem.claimedAt = new Date().toISOString();
        // Remove from priority queue
        const priorityQueue = this.priorityQueues.get(workItem.priority);
        if (priorityQueue) {
            const index = priorityQueue.findIndex(item => item.workId === workId);
            if (index >= 0) {
                priorityQueue.splice(index, 1);
            }
        }
        // Update node workload
        this.updateNodeWorkload(nodeId, 'claim', workItem);
        // Cancel reannounce timer
        const timer = this.reannounceTimers.get(workId);
        if (timer) {
            clearTimeout(timer);
            this.reannounceTimers.delete(workId);
        }
        console.log(`[GossipsubWorkDistributor] Work claimed: ${workId} by node ${nodeId}`);
        // Emit work claimed event
        await qflowEventEmitter.emit('q.qflow.work.claimed.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-work-distributor',
            actor: nodeId,
            data: {
                workId,
                executionId: workItem.executionId,
                stepId: workItem.stepId,
                nodeId
            }
        });
        return true;
    }
    /**
     * Complete work item
     */
    async completeWork(workId, nodeId, result) {
        const workItem = this.workQueue.get(workId);
        if (!workItem || workItem.claimedBy !== nodeId) {
            throw new Error(`Work item ${workId} not found or not claimed by ${nodeId}`);
        }
        workItem.status = 'completed';
        workItem.completedAt = new Date().toISOString();
        // Update node workload
        this.updateNodeWorkload(nodeId, 'complete', workItem);
        console.log(`[GossipsubWorkDistributor] Work completed: ${workId} by node ${nodeId}`);
        // Emit work completed event
        await qflowEventEmitter.emit('q.qflow.work.completed.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-work-distributor',
            actor: nodeId,
            data: {
                workId,
                executionId: workItem.executionId,
                stepId: workItem.stepId,
                nodeId,
                result
            }
        });
    }
    /**
     * Fail work item
     */
    async failWork(workId, nodeId, error) {
        const workItem = this.workQueue.get(workId);
        if (!workItem || workItem.claimedBy !== nodeId) {
            throw new Error(`Work item ${workId} not found or not claimed by ${nodeId}`);
        }
        workItem.status = 'failed';
        // Update node workload
        this.updateNodeWorkload(nodeId, 'fail', workItem);
        // Check if we should retry
        if (workItem.maxRetries > 0) {
            workItem.maxRetries--;
            workItem.status = 'pending';
            workItem.claimedBy = undefined;
            workItem.claimedAt = undefined;
            // Re-add to priority queue
            const priorityQueue = this.priorityQueues.get(workItem.priority);
            if (priorityQueue) {
                priorityQueue.push(workItem);
            }
            // Reannounce with backoff
            await this.scheduleReannounce(workItem, 1);
        }
        console.log(`[GossipsubWorkDistributor] Work failed: ${workId} by node ${nodeId} (retries left: ${workItem.maxRetries})`);
        // Emit work failed event
        await qflowEventEmitter.emit('q.qflow.work.failed.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-work-distributor',
            actor: nodeId,
            data: {
                workId,
                executionId: workItem.executionId,
                stepId: workItem.stepId,
                nodeId,
                error,
                retriesLeft: workItem.maxRetries
            }
        });
    }
    /**
     * Get work queue status
     */
    getWorkQueueStatus() {
        const byStatus = {};
        const byPriority = {};
        for (const workItem of this.workQueue.values()) {
            byStatus[workItem.status] = (byStatus[workItem.status] || 0) + 1;
            byPriority[workItem.priority] = (byPriority[workItem.priority] || 0) + 1;
        }
        return {
            total: this.workQueue.size,
            byStatus,
            byPriority
        };
    }
    /**
     * Get node workloads
     */
    getNodeWorkloads() {
        return Array.from(this.nodeWorkloads.values());
    }
    // Private methods
    setupEventHandlers() {
        // Handle libp2p messages
        libp2pCoordinator.on('pubsub:message', async (message) => {
            try {
                switch (message.topic) {
                    case this.TOPICS.WORK_CLAIM:
                        await this.handleWorkClaim(message);
                        break;
                    case this.TOPICS.WORK_RESULT:
                        await this.handleWorkResult(message);
                        break;
                    case this.TOPICS.NODE_CAPACITY:
                        await this.handleNodeCapacity(message);
                        break;
                }
            }
            catch (error) {
                console.error(`[GossipsubWorkDistributor] Failed to handle message: ${error}`);
            }
        });
    }
    async subscribeToTopics() {
        // In real implementation, would subscribe to gossipsub topics
        console.log('[GossipsubWorkDistributor] Subscribed to gossipsub topics');
    }
    async announceWorkAvailable(workItem) {
        // Create IPFS job manifest
        const manifest = {
            workId: workItem.workId,
            executionId: workItem.executionId,
            stepId: workItem.stepId,
            priority: workItem.priority,
            requirements: workItem.requirements,
            timeout: workItem.timeout,
            createdAt: workItem.createdAt
        };
        // In real implementation, would store manifest in IPFS and announce CID
        console.log(`[GossipsubWorkDistributor] Announced work available: ${workItem.workId}`);
        // Schedule reannounce if not claimed
        await this.scheduleReannounce(workItem, 0);
    }
    async scheduleReannounce(workItem, attempt) {
        if (attempt >= this.reannouncePolicy.maxAttempts) {
            workItem.status = 'expired';
            console.warn(`[GossipsubWorkDistributor] Work item expired: ${workItem.workId}`);
            return;
        }
        const delay = Math.min(this.reannouncePolicy.initialDelayMs * Math.pow(this.reannouncePolicy.backoffMultiplier, attempt), this.reannouncePolicy.maxDelayMs);
        // Add jitter
        const jitter = delay * (this.reannouncePolicy.jitterPercent / 100) * (Math.random() - 0.5);
        const finalDelay = delay + jitter;
        const timer = setTimeout(async () => {
            if (workItem.status === 'pending') {
                console.log(`[GossipsubWorkDistributor] Reannouncing work: ${workItem.workId} (attempt ${attempt + 1})`);
                await this.announceWorkAvailable(workItem);
            }
        }, finalDelay);
        this.reannounceTimers.set(workItem.workId, timer);
    }
    hasCapacity(nodeId, workItem) {
        const workload = this.nodeWorkloads.get(nodeId);
        if (!workload) {
            return true; // New node, assume it has capacity
        }
        // Check max jobs per node
        if (workload.activeJobs >= this.config.maxJobsPerNode) {
            return false;
        }
        // Check capabilities
        for (const requiredCapability of workItem.requirements.capabilities) {
            if (!workload.capabilities.includes(requiredCapability)) {
                return false;
            }
        }
        // Check performance thresholds
        if (workload.performance.cpuUtilization > 90 || workload.performance.memoryUtilization > 90) {
            return false;
        }
        return true;
    }
    consumeToken(nodeId, priority) {
        let bucket = this.tokenBuckets.get(nodeId);
        if (!bucket) {
            // Create new token bucket for node
            bucket = {
                nodeId,
                capacity: 10,
                tokens: 10,
                refillRate: 1, // 1 token per second
                lastRefill: Date.now(),
                priority: priority
            };
            this.tokenBuckets.set(nodeId, bucket);
        }
        // Refill tokens
        this.refillTokens(bucket);
        // Check if we have tokens
        const tokensNeeded = this.config.priorityWeights[priority] || 1;
        if (bucket.tokens >= tokensNeeded) {
            bucket.tokens -= tokensNeeded;
            return true;
        }
        return false;
    }
    refillTokens(bucket) {
        const now = Date.now();
        const timePassed = (now - bucket.lastRefill) / 1000; // seconds
        const tokensToAdd = timePassed * bucket.refillRate;
        bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
    }
    updateNodeWorkload(nodeId, action, workItem) {
        let workload = this.nodeWorkloads.get(nodeId);
        if (!workload) {
            workload = {
                nodeId,
                activeJobs: 0,
                queuedJobs: 0,
                completedJobs: 0,
                failedJobs: 0,
                averageExecutionTime: 0,
                lastActivity: new Date().toISOString(),
                capabilities: [],
                performance: {
                    cpuUtilization: 0,
                    memoryUtilization: 0,
                    networkLatency: 0,
                    reliability: 1.0
                }
            };
            this.nodeWorkloads.set(nodeId, workload);
        }
        switch (action) {
            case 'claim':
                workload.activeJobs++;
                break;
            case 'complete':
                workload.activeJobs--;
                workload.completedJobs++;
                if (workItem.claimedAt && workItem.completedAt) {
                    const executionTime = new Date(workItem.completedAt).getTime() - new Date(workItem.claimedAt).getTime();
                    workload.averageExecutionTime = (workload.averageExecutionTime + executionTime) / 2;
                }
                break;
            case 'fail':
                workload.activeJobs--;
                workload.failedJobs++;
                // Reduce reliability score
                workload.performance.reliability = Math.max(0, workload.performance.reliability - 0.1);
                break;
        }
        workload.lastActivity = new Date().toISOString();
    }
    rebalanceWorkload() {
        if (!this.config.enablePriorityLanes) {
            return;
        }
        // Check for starvation prevention
        const now = Date.now();
        const starvationThreshold = now - this.config.starvationPreventionMs;
        for (const [priority, queue] of this.priorityQueues.entries()) {
            for (const workItem of queue) {
                const createdTime = new Date(workItem.createdAt).getTime();
                if (createdTime < starvationThreshold) {
                    // Boost priority to prevent starvation
                    console.log(`[GossipsubWorkDistributor] Boosting priority for starved work item: ${workItem.workId}`);
                    // In real implementation, would move to higher priority queue
                }
            }
        }
        // Emit rebalance event
        qflowEventEmitter.emit('q.qflow.work.rebalanced.v1', {
            eventId: this.generateEventId(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'qflow-work-distributor',
            actor: 'system',
            data: {
                queueStatus: this.getWorkQueueStatus(),
                nodeWorkloads: this.getNodeWorkloads().length
            }
        });
    }
    async handleWorkClaim(message) {
        const { workId, nodeId } = message.data;
        await this.claimWork(workId, nodeId);
    }
    async handleWorkResult(message) {
        const { workId, nodeId, success, result, error } = message.data;
        if (success) {
            await this.completeWork(workId, nodeId, result);
        }
        else {
            await this.failWork(workId, nodeId, error);
        }
    }
    async handleNodeCapacity(message) {
        const { nodeId, capacity } = message.data;
        // Update node capacity information
        let workload = this.nodeWorkloads.get(nodeId);
        if (workload) {
            workload.capabilities = capacity.capabilities || [];
            workload.performance = { ...workload.performance, ...capacity.performance };
        }
    }
    generateWorkId() {
        return `work_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stop();
        this.workQueue.clear();
        this.tokenBuckets.clear();
        this.nodeWorkloads.clear();
        this.priorityQueues.clear();
        this.removeAllListeners();
    }
}
// Export singleton instance
export const gossipsubWorkDistributor = new GossipsubWorkDistributor();
//# sourceMappingURL=GossipsubWorkDistributor.js.map