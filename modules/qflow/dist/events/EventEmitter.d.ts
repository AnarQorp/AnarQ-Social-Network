import { EventEmitter } from 'events';
import { QflowEvent } from '../schemas/SchemaRegistry.js';
/**
 * Qflow Event Emitter
 * Simple event emitter for Qflow events (will be enhanced with ecosystem integration later)
 */
export declare class QflowEventEmitter extends EventEmitter {
    constructor();
    /**
     * Emit a simple event (basic implementation)
     */
    emit(eventType: string, data: any): boolean;
    /**
     * Emit a flow created event
     */
    emitFlowCreated(actor: string, flowData: {
        flowId: string;
        flowName: string;
        flowVersion: string;
        owner: string;
        daoSubnet?: string;
        metadata?: any;
        ipfsCid: string;
    }): Promise<void>;
    /**
     * Emit an execution started event
     */
    emitExecutionStarted(actor: string, executionData: {
        executionId: string;
        flowId: string;
        flowVersion: string;
        triggerType: 'manual' | 'webhook' | 'event' | 'schedule';
        daoSubnet?: string;
        inputData?: any;
        context?: any;
        estimatedDuration?: number;
    }): Promise<void>;
    /**
     * Emit a step dispatched event
     */
    emitStepDispatched(actor: string, stepData: {
        executionId: string;
        stepId: string;
        stepType: 'task' | 'condition' | 'parallel' | 'event-trigger' | 'module-call';
        targetNodeId: string;
        nodeCapabilities?: string[];
        stepPayload: {
            action: string;
            params?: any;
            resourceLimits?: any;
        };
        validationPipelineResult?: any;
    }): Promise<void>;
    /**
     * Emit a step completed event
     */
    emitStepCompleted(actor: string, stepData: {
        executionId: string;
        stepId: string;
        nodeId: string;
        status: 'success' | 'failure' | 'timeout' | 'cancelled';
        result?: any;
        error?: any;
        executionMetrics?: any;
        qerberosStamp?: any;
    }): Promise<void>;
    /**
     * Emit an execution completed event
     */
    emitExecutionCompleted(actor: string, executionData: {
        executionId: string;
        flowId: string;
        status: 'completed' | 'failed' | 'aborted' | 'timeout';
        startTime: string;
        endTime: string;
        durationMs: number;
        completedSteps: string[];
        failedSteps: string[];
        finalResult?: any;
        error?: any;
        resourceUsage?: any;
        auditTrail?: any;
    }): Promise<void>;
    /**
     * Emit a validation pipeline executed event
     */
    emitValidationPipelineExecuted(actor: string, validationData: {
        validationId: string;
        operationType: 'flow-execution' | 'step-execution' | 'external-event' | 'flow-creation';
        operationId: string;
        inputHash: string;
        pipelineResult: any;
        cacheHit?: boolean;
        cacheKey?: string;
    }): Promise<void>;
    /**
     * Emit an external event received event
     */
    emitExternalEventReceived(actor: string, eventData: {
        externalEventId: string;
        sourceSystem: string;
        eventType: string;
        payload: any;
        signature?: string;
        validationResult: any;
        triggeredFlows?: Array<{
            flowId: string;
            executionId: string;
        }>;
        rateLimitInfo?: any;
    }): Promise<void>;
    /**
     * Emit a flow updated event
     */
    emitFlowUpdated(actor: string, flowData: {
        flowId: string;
        flowName: string;
        flowVersion: string;
        previousVersion: string;
        owner: string;
        daoSubnet?: string;
        metadata?: any;
        ipfsCid: string;
    }): Promise<void>;
    /**
     * Emit a flow deleted event
     */
    emitFlowDeleted(actor: string, flowData: {
        flowId: string;
        flowName: string;
        flowVersion: string;
        owner: string;
        daoSubnet?: string;
    }): Promise<void>;
    /**
     * Emit a flow ownership transferred event
     */
    emitFlowOwnershipTransferred(actor: string, ownershipData: {
        flowId: string;
        previousOwner: string;
        newOwner: string;
        transferredBy: string;
        reason?: string;
        timestamp: string;
    }): Promise<void>;
    /**
     * Emit a flow access granted event
     */
    emitFlowAccessGranted(actor: string, accessData: {
        flowId: string;
        grantedTo: string;
        grantedBy: string;
        permissions: string[];
        grantedAt: string;
        expiresAt?: string;
        conditions?: Record<string, any>;
    }): Promise<void>;
    /**
     * Emit a flow access revoked event
     */
    emitFlowAccessRevoked(actor: string, accessData: {
        flowId: string;
        revokedFrom: string;
        revokedBy: string;
        revokedAt: string;
    }): Promise<void>;
    /**
     * Emit a flow sharing settings updated event
     */
    emitFlowSharingSettingsUpdated(actor: string, sharingData: {
        flowId: string;
        settings: any;
        setBy: string;
        setAt: string;
    }): Promise<void>;
    /**
     * Subscribe to Qflow events
     */
    subscribe(eventType: string, handler: (event: QflowEvent) => Promise<void>): Promise<void>;
    /**
     * Unsubscribe from Qflow events
     */
    unsubscribe(eventType: string, handler: (event: QflowEvent) => Promise<void>): Promise<void>;
}
export declare const qflowEventEmitter: QflowEventEmitter;
//# sourceMappingURL=EventEmitter.d.ts.map