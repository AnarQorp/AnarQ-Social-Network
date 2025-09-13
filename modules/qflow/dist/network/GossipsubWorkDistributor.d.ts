/**
 * Gossipsub Backpressure and Fair Work Distribution
 *
 * Implements token-bucket per node with fair scheduling, priority lanes,
 * and reannounce policy for unclaimed jobs with exponential backoff
 */
import { EventEmitter } from 'events';
export interface WorkItem {
    workId: string;
    executionId: string;
    stepId: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    payload: any;
    requirements: {
        minMemoryMB: number;
        minCpuCores: number;
        capabilities: string[];
    };
    timeout: number;
    maxRetries: number;
    createdAt: string;
    claimedBy?: string;
    claimedAt?: string;
    completedAt?: string;
    status: 'pending' | 'claimed' | 'processing' | 'completed' | 'failed' | 'expired';
}
export interface TokenBucket {
    nodeId: string;
    capacity: number;
    tokens: number;
    refillRate: number;
    lastRefill: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
}
export interface NodeWorkload {
    nodeId: string;
    activeJobs: number;
    queuedJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageExecutionTime: number;
    lastActivity: string;
    capabilities: string[];
    performance: {
        cpuUtilization: number;
        memoryUtilization: number;
        networkLatency: number;
        reliability: number;
    };
}
export interface ReannouncePolicy {
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    jitterPercent: number;
    maxAttempts: number;
}
export interface FairSchedulingConfig {
    enablePriorityLanes: boolean;
    priorityWeights: Record<string, number>;
    maxJobsPerNode: number;
    rebalanceIntervalMs: number;
    starvationPreventionMs: number;
}
/**
 * Gossipsub Work Distributor with Fair Scheduling
 */
export declare class GossipsubWorkDistributor extends EventEmitter {
    private workQueue;
    private tokenBuckets;
    private nodeWorkloads;
    private reannounceTimers;
    private priorityQueues;
    private readonly config;
    private readonly reannouncePolicy;
    private rebalanceTimer;
    private isRunning;
    private readonly TOPICS;
    constructor(config?: Partial<FairSchedulingConfig>, reannouncePolicy?: Partial<ReannouncePolicy>);
    /**
     * Start the work distributor
     */
    start(): Promise<void>;
    /**
     * Stop the work distributor
     */
    stop(): Promise<void>;
    /**
     * Submit work item for distribution
     */
    submitWork(workItem: Omit<WorkItem, 'workId' | 'createdAt' | 'status'>): Promise<string>;
    /**
     * Claim work item
     */
    claimWork(workId: string, nodeId: string): Promise<boolean>;
    /**
     * Complete work item
     */
    completeWork(workId: string, nodeId: string, result: any): Promise<void>;
    /**
     * Fail work item
     */
    failWork(workId: string, nodeId: string, error: string): Promise<void>;
    /**
     * Get work queue status
     */
    getWorkQueueStatus(): {
        total: number;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
    };
    /**
     * Get node workloads
     */
    getNodeWorkloads(): NodeWorkload[];
    private setupEventHandlers;
    private subscribeToTopics;
    private announceWorkAvailable;
    private scheduleReannounce;
    private hasCapacity;
    private consumeToken;
    private refillTokens;
    private updateNodeWorkload;
    private rebalanceWorkload;
    private handleWorkClaim;
    private handleWorkResult;
    private handleNodeCapacity;
    private generateWorkId;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const gossipsubWorkDistributor: GossipsubWorkDistributor;
//# sourceMappingURL=GossipsubWorkDistributor.d.ts.map