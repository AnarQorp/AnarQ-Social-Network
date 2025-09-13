/**
 * QNET Node Management Service
 *
 * Handles QNET node discovery, management, and health monitoring
 * for distributed flow execution
 */
import { EventEmitter } from 'events';
export interface QNETNode {
    nodeId: string;
    peerId: string;
    address: string;
    multiaddrs: string[];
    capabilities: NodeCapability[];
    performanceScore: number;
    currentLoad: number;
    latency: number;
    daoSubnets: string[];
    lastSeen: string;
    reputation: number;
    status: 'online' | 'offline' | 'degraded' | 'maintenance';
    metadata: {
        version: string;
        region?: string;
        provider?: string;
        resources: NodeResources;
        uptime: number;
    };
}
export interface NodeCapability {
    name: string;
    version: string;
    enabled: boolean;
    configuration?: Record<string, any>;
}
export interface NodeResources {
    cpu: {
        cores: number;
        usage: number;
        available: number;
    };
    memory: {
        total: number;
        used: number;
        available: number;
    };
    storage: {
        total: number;
        used: number;
        available: number;
    };
    network: {
        bandwidth: number;
        connections: number;
        maxConnections: number;
    };
}
export interface NodeSelectionCriteria {
    daoSubnet?: string;
    requiredCapabilities: string[];
    minPerformanceScore: number;
    maxLatency: number;
    resourceRequirements: {
        minCpu?: number;
        minMemory?: number;
        minStorage?: number;
        minBandwidth?: number;
    };
    geographicPreference?: string[];
    excludeNodes?: string[];
    loadBalancing?: 'round-robin' | 'least-loaded' | 'performance-based' | 'random';
}
export interface NodeMetrics {
    nodeId: string;
    timestamp: string;
    metrics: {
        cpu: number;
        memory: number;
        storage: number;
        network: number;
        activeExecutions: number;
        completedExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        errorRate: number;
    };
}
export interface NodeHealthCheck {
    nodeId: string;
    timestamp: string;
    healthy: boolean;
    checks: {
        connectivity: boolean;
        resources: boolean;
        capabilities: boolean;
        performance: boolean;
    };
    issues: string[];
    responseTime: number;
}
/**
 * QNET Node Manager for distributed execution
 */
export declare class QNETNodeManager extends EventEmitter {
    private nodes;
    private nodeMetrics;
    private healthCheckInterval;
    private discoveryInterval;
    private performanceUpdateInterval;
    constructor();
    /**
     * Discover and register QNET nodes
     */
    discoverNodes(): Promise<QNETNode[]>;
    /**
     * Select optimal node for execution
     */
    selectNode(criteria: NodeSelectionCriteria): Promise<QNETNode | null>;
    /**
     * Get available nodes
     */
    getAvailableNodes(daoSubnet?: string): QNETNode[];
    /**
     * Update node metrics
     */
    updateNodeMetrics(nodeId: string, metrics: NodeMetrics): Promise<void>;
    /**
     * Check node health
     */
    checkNodeHealth(nodeId: string): Promise<NodeHealthCheck>;
    /**
     * Get node metrics history
     */
    getNodeMetrics(nodeId: string, limit?: number): NodeMetrics[];
    /**
     * Get node by ID
     */
    getNode(nodeId: string): QNETNode | undefined;
    /**
     * Get all nodes
     */
    getAllNodes(): QNETNode[];
    /**
     * Remove node
     */
    removeNode(nodeId: string): Promise<boolean>;
    private startNodeDiscovery;
    private startHealthChecking;
    private startPerformanceMonitoring;
    private getNodeInfo;
    private createNodeFromPeerInfo;
    private parseCapabilities;
    private calculateNodeScore;
    private calculatePerformanceScore;
    private calculateAveragePerformance;
    private selectRoundRobin;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const qnetNodeManager: QNETNodeManager;
//# sourceMappingURL=QNETNodeManager.d.ts.map