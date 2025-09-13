/**
 * WebAssembly Runtime for Secure Code Execution
 *
 * Implements secure WASM runtime with isolation, multiple module format support,
 * and comprehensive module loading and validation
 */
import { EventEmitter } from 'events';
import { ResourceLimits } from './ResourceLimiter.js';
export interface WASMModule {
    moduleId: string;
    name: string;
    version: string;
    format: 'wasm' | 'wat' | 'wasi';
    code: Uint8Array;
    exports: string[];
    imports: string[];
    metadata: {
        author: string;
        description: string;
        capabilities: string[];
        daoApproved: boolean;
        approvalSignature?: string;
        createdAt: string;
    };
    validation: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
        securityScore: number;
    };
}
export interface WASMExecutionContext {
    executionId: string;
    moduleId: string;
    input: any;
    environment: Record<string, any>;
    limits: ResourceLimits;
    timeout: number;
    capabilities: string[];
    daoSubnet?: string;
}
export interface WASMExecutionResult {
    executionId: string;
    success: boolean;
    result?: any;
    error?: string;
    logs: string[];
    metrics: {
        executionTimeMs: number;
        memoryUsedMB: number;
        cpuTimeMs: number;
        instructionCount: number;
    };
    resourceViolations: any[];
}
export interface WASMValidationConfig {
    maxModuleSizeMB: number;
    allowedImports: string[];
    forbiddenInstructions: string[];
    requireDAOApproval: boolean;
    enableSecurityScanning: boolean;
    minSecurityScore: number;
}
export interface SecurityScanResult {
    scanId: string;
    moduleId: string;
    score: number;
    issues: SecurityIssue[];
    recommendations: string[];
    scannedAt: string;
}
export interface SecurityIssue {
    type: 'memory-access' | 'system-call' | 'network-access' | 'file-access' | 'crypto-usage';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location?: string;
    mitigation?: string;
}
/**
 * WASM Runtime with Security Isolation
 */
export declare class WASMRuntime extends EventEmitter {
    private modules;
    private activeExecutions;
    private executionResults;
    private resourceLimiters;
    private readonly config;
    private wasmEngine;
    private isInitialized;
    constructor(config?: Partial<WASMValidationConfig>);
    /**
     * Initialize WASM engine
     */
    private initializeWASMEngine;
    /**
     * Load WASM module
     */
    loadModule(moduleCode: string | Uint8Array, metadata: WASMModule['metadata']): Promise<string>;
    /**
     * Validate WASM module
     */
    validateModule(module: WASMModule): Promise<void>;
    /**
     * Execute WASM code
     */
    executeCode(moduleId: string, input: any, limits: ResourceLimits, timeout?: number, capabilities?: string[]): Promise<WASMExecutionResult>;
    /**
     * Get loaded modules
     */
    getLoadedModules(): WASMModule[];
    /**
     * Get execution result
     */
    getExecutionResult(executionId: string): WASMExecutionResult | undefined;
    /**
     * Get active executions
     */
    getActiveExecutions(): WASMExecutionContext[];
    private executeWASMModule;
    private createImportsObject;
    private analyzeModule;
    private performSecurityScan;
    private generateModuleId;
    private generateExecutionId;
    private generateScanId;
    private generateEventId;
    /**
     * Check if runtime is healthy
     */
    isHealthy(): boolean;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const wasmRuntime: WASMRuntime;
//# sourceMappingURL=WASMRuntime.d.ts.map