import { EventEmitter } from 'events';
import { schemaRegistry } from '../schemas/SchemaRegistry.js';
/**
 * Qflow Event Emitter
 * Simple event emitter for Qflow events (will be enhanced with ecosystem integration later)
 */
export class QflowEventEmitter extends EventEmitter {
    constructor() {
        super();
    }
    /**
     * Emit a simple event (basic implementation)
     */
    emit(eventType, data) {
        console.log(`[QflowEventEmitter] Emitting event: ${eventType}`, data);
        return super.emit(eventType, data);
    }
    /**
     * Emit a flow created event
     */
    async emitFlowCreated(actor, flowData) {
        const event = schemaRegistry.createEvent('q.qflow.flow.created.v1', actor, flowData);
        this.emit('q.qflow.flow.created.v1', event);
    }
    /**
     * Emit an execution started event
     */
    async emitExecutionStarted(actor, executionData) {
        const event = schemaRegistry.createEvent('q.qflow.exec.started.v1', actor, executionData);
        this.emit('q.qflow.exec.started.v1', event);
    }
    /**
     * Emit a step dispatched event
     */
    async emitStepDispatched(actor, stepData) {
        const event = schemaRegistry.createEvent('q.qflow.exec.step.dispatched.v1', actor, stepData);
        this.emit('q.qflow.exec.step.dispatched.v1', event);
    }
    /**
     * Emit a step completed event
     */
    async emitStepCompleted(actor, stepData) {
        const event = schemaRegistry.createEvent('q.qflow.exec.step.completed.v1', actor, stepData);
        this.emit('q.qflow.exec.step.completed.v1', event);
    }
    /**
     * Emit an execution completed event
     */
    async emitExecutionCompleted(actor, executionData) {
        const event = schemaRegistry.createEvent('q.qflow.exec.completed.v1', actor, executionData);
        this.emit('q.qflow.exec.completed.v1', event);
    }
    /**
     * Emit a validation pipeline executed event
     */
    async emitValidationPipelineExecuted(actor, validationData) {
        const event = schemaRegistry.createEvent('q.qflow.validation.pipeline.executed.v1', actor, validationData);
        this.emit('q.qflow.validation.pipeline.executed.v1', event);
    }
    /**
     * Emit an external event received event
     */
    async emitExternalEventReceived(actor, eventData) {
        const event = schemaRegistry.createEvent('q.qflow.external.event.received.v1', actor, eventData);
        this.emit('q.qflow.external.event.received.v1', event);
    }
    /**
     * Emit a flow updated event
     */
    async emitFlowUpdated(actor, flowData) {
        const event = schemaRegistry.createEvent('q.qflow.flow.updated.v1', actor, flowData);
        this.emit('q.qflow.flow.updated.v1', event);
    }
    /**
     * Emit a flow deleted event
     */
    async emitFlowDeleted(actor, flowData) {
        const event = schemaRegistry.createEvent('q.qflow.flow.deleted.v1', actor, flowData);
        this.emit('q.qflow.flow.deleted.v1', event);
    }
    /**
     * Emit a flow ownership transferred event
     */
    async emitFlowOwnershipTransferred(actor, ownershipData) {
        const event = schemaRegistry.createEvent('q.qflow.flow.ownership.transferred.v1', actor, ownershipData);
        this.emit('q.qflow.flow.ownership.transferred.v1', event);
    }
    /**
     * Emit a flow access granted event
     */
    async emitFlowAccessGranted(actor, accessData) {
        const event = schemaRegistry.createEvent('q.qflow.flow.access.granted.v1', actor, accessData);
        this.emit('q.qflow.flow.access.granted.v1', event);
    }
    /**
     * Emit a flow access revoked event
     */
    async emitFlowAccessRevoked(actor, accessData) {
        const event = schemaRegistry.createEvent('q.qflow.flow.access.revoked.v1', actor, accessData);
        this.emit('q.qflow.flow.access.revoked.v1', event);
    }
    /**
     * Emit a flow sharing settings updated event
     */
    async emitFlowSharingSettingsUpdated(actor, sharingData) {
        const event = schemaRegistry.createEvent('q.qflow.flow.sharing.updated.v1', actor, sharingData);
        this.emit('q.qflow.flow.sharing.updated.v1', event);
    }
    /**
     * Subscribe to Qflow events
     */
    async subscribe(eventType, handler) {
        this.on(eventType, handler);
    }
    /**
     * Unsubscribe from Qflow events
     */
    async unsubscribe(eventType, handler) {
        this.off(eventType, handler);
    }
}
// Singleton instance
export const qflowEventEmitter = new QflowEventEmitter();
//# sourceMappingURL=EventEmitter.js.map