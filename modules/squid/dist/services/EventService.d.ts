/**
 * Event Service
 * Handles event publishing and subscription for sQuid module
 */
import { EventEmitter } from 'events';
import { IdentityEvent, EventService as IEventService } from '../types';
export declare class EventService extends EventEmitter implements IEventService {
    private mockMode;
    private eventBusUrl;
    private topics;
    constructor(config: any);
    publishEvent(event: IdentityEvent): Promise<void>;
    subscribeToEvents(topics: string[], handler: (event: IdentityEvent) => void): Promise<void>;
    private publishToEventBus;
    private subscribeToEventBus;
    private getTopicForEvent;
    createEvent(type: string, data: any, correlationId?: string): IdentityEvent;
    private generateEventId;
}
//# sourceMappingURL=EventService.d.ts.map