/**
 * Graceful Degradation Integration Service for Qflow
 * Integrates with Task 34 Graceful Degradation ladder
 */
import { EventEmitter } from 'events';
import { FlowBurnRateService } from './FlowBurnRateService.js';
export interface DegradationLadder {
    levels: DegradationLevel[];
    currentLevel: number;
    autoEscalation: boolean;
    manualOverride: boolean;
}
export interface DegradationLevel {
    level: number;
    name: string;
    description: string;
    triggers: {
        burnRate: number;
        errorRate: number;
        latency: number;
        resourceUtilization: number;
    };
    actions: {
        qflow: QflowDegradationActions;
        ecosystem: EcosystemDegradationActions;
    };
    slaImpact: {
        latencyIncrease: number;
        throughputReduction: number;
        featureDisabled: string[];
    };
}
export interface QflowDegradationActions {
    pauseFlows: {
        enabled: boolean;
        priorities: string[];
        maxCount: number;
    };
    deferSteps: {
        enabled: boolean;
        heavyStepsOnly: boolean;
        coldNodesRequired: boolean;
    };
    reduceParallelism: {
        enabled: boolean;
        reductionPercentage: number;
    };
    disableFeatures: {
        enabled: boolean;
        features: string[];
    };
}
export interface EcosystemDegradationActions {
    reduceModuleCalls: {
        enabled: boolean;
        modules: string[];
        reductionPercentage: number;
    };
    enableCaching: {
        enabled: boolean;
        aggressive: boolean;
        ttlMultiplier: number;
    };
    limitConnections: {
        enabled: boolean;
        maxConnections: number;
    };
}
export declare class GracefulDegradationIntegration extends EventEmitter {
    private burnRateService;
    private degradationLadder;
    private escalationHistory;
    private config;
    constructor(burnRateService: FlowBurnRateService, options?: any);
    /**
     * Get current degradation status
     */
    getDegradationStatus(): {
        currentLevel: number;
        levelName: string;
        description: string;
        slaImpact: any;
        activeActions: string[];
        escalationHistory: any[];
        canEscalate: boolean;
        canDeEscalate: boolean;
    };
    /**
     * Manually escalate degradation level
     */
    manualEscalate(targetLevel: number, reason: string): Promise<void>;
    /**
     * Manually de-escalate degradation level
     */
    manualDeEscalate(targetLevel: number, reason: string): Promise<void>;
    /**
     * Check if escalation should occur based on current metrics
     */
    checkEscalationTriggers(metrics: {
        burnRate: number;
        errorRate: number;
        latency: number;
        resourceUtilization: number;
    }): Promise<void>;
    /**
     * Private methods
     */
    private initializeDegradationLadder;
}
export default GracefulDegradationIntegration;
//# sourceMappingURL=GracefulDegradationIntegration.d.ts.map