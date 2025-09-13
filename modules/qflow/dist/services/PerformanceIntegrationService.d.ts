/**
 * Performance Integration Service for Qflow
 * Integrates with Task 36 performance monitoring system
 */
import { EventEmitter } from 'events';
export interface PerformanceMetrics {
    executionLatency: number;
    validationLatency: number;
    stepLatency: number;
    throughput: number;
    errorRate: number;
    resourceUtilization: {
        cpu: number;
        memory: number;
        network: number;
    };
}
export interface PerformanceGate {
    name: string;
    threshold: number;
    metric: string;
    operator: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
    enabled: boolean;
}
export interface AdaptiveResponse {
    trigger: string;
    action: 'scale_up' | 'scale_down' | 'pause_flows' | 'redirect_load' | 'optimize_resources';
    parameters: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export declare class PerformanceIntegrationService extends EventEmitter {
    private metricsService;
    private regressionService;
    private performanceGates;
    private adaptiveResponses;
    private monitoringInterval;
    private config;
    constructor(options?: any);
    /**
     * Start performance monitoring
     */
    startMonitoring(): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Record flow execution metrics
     */
    recordFlowExecution(flowId: string, metrics: {
        duration: number;
        stepCount: number;
        validationTime: number;
        nodeId: string;
        success: boolean;
        errorType?: string;
    }): void;
    /**
     * Record step execution metrics
     */
    recordStepExecution(stepId: string, metrics: {
        duration: number;
        nodeId: string;
        stepType: string;
        success: boolean;
        resourceUsage?: {
            cpu: number;
            memory: number;
        };
    }): void;
    /**
     * Record validation pipeline metrics
     */
    recordValidationMetrics(operationId: string, metrics: {
        totalDuration: number;
        layerDurations: Record<string, number>;
        cacheHitRate: number;
        success: boolean;
    }): void;
    /**
     * Add performance gate
     */
    addPerformanceGate(gate: PerformanceGate): void;
    /**
     * Remove performance gate
     */
    removePerformanceGate(name: string): void;
    /**
     * Add adaptive response
     */
    addAdaptiveResponse(response: AdaptiveResponse): void;
    /**
     * Get current performance status
     */
    getPerformanceStatus(): {
        overall: 'healthy' | 'warning' | 'critical';
        metrics: PerformanceMetrics;
        gates: Array<{
            name: string;
            status: 'pass' | 'fail';
            value: number;
            threshold: number;
        }>;
        slo: any;
        recommendations: any[];
    };
    /**
     * Get ecosystem-wide performance correlation
     */
    getEcosystemCorrelation(): {
        qflowHealth: string;
        ecosystemHealth: string;
        correlations: Array<{
            module: string;
            correlation: number;
            impact: 'positive' | 'negative' | 'neutral';
        }>;
    };
    /**
     * Trigger adaptive response
     */
    triggerAdaptiveResponse(trigger: string, context?: any): Promise<void>;
    /**
     * Private methods
     */
    private setupDefaultGates;
    private setupDefaultResponses;
    private setupEventHandlers;
    private collectMetrics;
    private checkPerformanceGates;
    private detectRegressions;
    private calculateCurrentMetrics;
    private checkAllGates;
    private handleScaleUp;
    private handleScaleDown;
    private handlePauseFlows;
    private handleRedirectLoad;
    private handleOptimizeResources;
    /**
     * Initialize the performance integration service
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the performance integration service
     */
    shutdown(): Promise<void>;
}
export default PerformanceIntegrationService;
//# sourceMappingURL=PerformanceIntegrationService.d.ts.map