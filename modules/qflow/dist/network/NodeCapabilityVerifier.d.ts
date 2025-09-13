/**
 * Node Capability Provenance and Verification Service
 *
 * Handles signed capability manifests, verification of node capabilities,
 * and anomaly detection against declared capabilities
 */
import { EventEmitter } from 'events';
export interface CapabilityManifest {
    manifestId: string;
    nodeId: string;
    peerId: string;
    timestamp: string;
    version: string;
    capabilities: DeclaredCapability[];
    resources: DeclaredResources;
    signature: string;
    issuer: string;
    validUntil: string;
    metadata: {
        region?: string;
        provider?: string;
        certifications?: string[];
        complianceLevel?: 'basic' | 'enhanced' | 'enterprise';
    };
}
export interface DeclaredCapability {
    name: string;
    version: string;
    type: 'wasm-runtime' | 'storage' | 'network' | 'compute' | 'security';
    specifications: {
        wasmRuntime?: {
            engine: 'wasmtime' | 'wasmer' | 'v8' | 'spidermonkey';
            version: string;
            maxMemoryMB: number;
            maxExecutionTimeMs: number;
            supportedModules: string[];
            securityFeatures: string[];
        };
        storage?: {
            type: 'ipfs' | 'local' | 'distributed';
            capacity: number;
            throughput: number;
            durability: number;
            encryption: boolean;
        };
        network?: {
            bandwidth: number;
            latency: number;
            protocols: string[];
            maxConnections: number;
            firewallRules?: string[];
        };
        compute?: {
            architecture: 'x86_64' | 'arm64' | 'riscv';
            cores: number;
            frequency: number;
            cache: number;
            virtualization: boolean;
        };
        security?: {
            teeSupport: boolean;
            attestation: boolean;
            keyManagement: string[];
            encryptionAlgorithms: string[];
        };
    };
    benchmarks?: {
        [testName: string]: {
            score: number;
            unit: string;
            timestamp: string;
        };
    };
}
export interface DeclaredResources {
    cpu: {
        cores: number;
        architecture: string;
        frequency: number;
        cache: number;
    };
    memory: {
        total: number;
        type: 'DDR4' | 'DDR5' | 'LPDDR4' | 'LPDDR5';
        speed: number;
        ecc: boolean;
    };
    storage: {
        total: number;
        type: 'SSD' | 'NVMe' | 'HDD' | 'Distributed';
        iops: number;
        throughput: number;
    };
    network: {
        bandwidth: number;
        latency: number;
        reliability: number;
    };
}
export interface CapabilityVerification {
    verificationId: string;
    nodeId: string;
    manifestId: string;
    timestamp: string;
    verificationResults: CapabilityVerificationResult[];
    overallStatus: 'verified' | 'partial' | 'failed' | 'anomaly';
    anomalies: CapabilityAnomaly[];
    qerberosRiskScore: number;
    nextVerification: string;
}
export interface CapabilityVerificationResult {
    capabilityName: string;
    status: 'verified' | 'failed' | 'degraded' | 'unavailable';
    actualPerformance?: any;
    declaredPerformance?: any;
    variance: number;
    testResults: {
        [testName: string]: {
            passed: boolean;
            actualValue: any;
            expectedValue: any;
            tolerance: number;
        };
    };
}
export interface CapabilityAnomaly {
    anomalyId: string;
    type: 'performance-degradation' | 'capability-mismatch' | 'resource-exhaustion' | 'security-violation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: string;
    affectedCapabilities: string[];
    evidence: any;
    recommendedAction: string;
}
export interface NodeSelectionCriteria {
    requiredCapabilities: string[];
    minimumPerformance?: Record<string, number>;
    securityRequirements?: {
        teeRequired?: boolean;
        attestationRequired?: boolean;
        encryptionAlgorithms?: string[];
    };
    resourceRequirements?: {
        minCpu?: number;
        minMemory?: number;
        minStorage?: number;
        minBandwidth?: number;
    };
    complianceLevel?: 'basic' | 'enhanced' | 'enterprise';
    maxRiskScore?: number;
}
/**
 * Node Capability Verifier for provenance and verification
 */
export declare class NodeCapabilityVerifier extends EventEmitter {
    private capabilityManifests;
    private verificationHistory;
    private anomalies;
    private verificationInterval;
    private benchmarkTests;
    constructor();
    /**
     * Register capability manifest for a node
     */
    registerCapabilityManifest(manifest: Omit<CapabilityManifest, 'manifestId' | 'timestamp' | 'signature'>): Promise<string>;
    /**
     * Verify node capabilities against manifest
     */
    verifyNodeCapabilities(nodeId: string): Promise<CapabilityVerification>;
    /**
     * Select nodes based on verified capabilities
     */
    selectVerifiedNodes(criteria: NodeSelectionCriteria): Promise<string[]>;
    /**
     * Get capability manifest for node
     */
    getCapabilityManifest(nodeId: string): CapabilityManifest | undefined;
    /**
     * Get verification history for node
     */
    getVerificationHistory(nodeId: string): CapabilityVerification[];
    /**
     * Get anomalies for node
     */
    getNodeAnomalies(nodeId: string): CapabilityAnomaly[];
    /**
     * Get all registered manifests
     */
    getAllManifests(): CapabilityManifest[];
    private getLatestManifest;
    private verifyCapability;
    private testWasmCapability;
    private testStorageCapability;
    private testNetworkCapability;
    private testComputeCapability;
    private testSecurityCapability;
    private getQerberosRiskScore;
    private signManifest;
    private verifyManifestSignature;
    private setupBenchmarkTests;
    private startPeriodicVerification;
    private generateEventId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const nodeCapabilityVerifier: NodeCapabilityVerifier;
//# sourceMappingURL=NodeCapabilityVerifier.d.ts.map