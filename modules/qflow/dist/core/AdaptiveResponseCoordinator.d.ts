/**
 * Adaptive Response Coordinator for Qflow
 * Coordinates automatic scaling, load redirection, and proactive optimization
 */
import { EventEmitter } from 'events';
import { PerformanceIntegrationService } from '../services/PerformanceIntegrationService.js';
export interface AdaptiveResponseConfig {
    scalingEnabled: boolean;
    optimizationEnabled: boolean;
    maxConcurrentActions: number;
    coordinationInterval: number;
    emergencyThresholds: {
        criticalLatency: number;
        criticalErrorRate: number;
        criticalCpuUsage: number;
        criticalMemoryUsage: number;
    };
}
export interface SystemState {
    performance: any;
    scaling: any;
    optimization: any;
    emergencyMode: boolean;
    lastUpdate: number;
}
export declare class AdaptiveResponseCoordinator extends EventEmitter {
    private scalingEngine;
    private optimizer;
    private performanceService;
    private config;
    private systemState;
    private coordinationInterval;
    private activeActions;
    constructor(performanceService: PerformanceIntegrationService, options?: Partial<AdaptiveResponseConfig>);
    /**
     * Start adaptive response coordination
     */
    start(): void;
    /**
     * Stop adaptive response coordination
     */
    stop(): void;
    /**
     * Update system metrics for all components
     */
    updateMetrics(metrics: any): void;
    /**
     * Trigger emergency response
     */
    triggerEmergencyResponse(reason: string, context: any): Promise<void>;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): {
        overall: 'healthy' | 'warning' | 'critical' | 'emergency';
        performance: any;
        scaling: any;
        optimization: any;
        activeActions: Array<{
            id: string;
            type: string;
            timestamp: number;
            priority: number;
        }>;
        emergencyMode: boolean;
        recommendations: string[];
    };
    /**
     * Force specific adaptive action
     */
    forceAdaptiveAction(actionType: string, parameters: any): Promise<void>;
    /**
     * Private methods
     */
    private setupEventHandlers;
    private coordinateAdaptiveResponses;
    private coordinateEmergencyActions;
    private coordinateCriticalActions;
    private coordinateProactiveActions;
    private coordinateMaintenanceActions;
    private checkEmergencyConditions;
    private executeEmergencyActions;
    private executeEmergencyAction;
    private exitEmergencyMode;
    private handlePerformanceGateFailure;
    private handleSLOViolation;
    private recordAction;
    private generateSystemRecommendations;
}
export default AdaptiveResponseCoordinator;
//# sourceMappingURL=AdaptiveResponseCoordinator.d.ts.map