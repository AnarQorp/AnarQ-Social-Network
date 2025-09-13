import { EventEmitter } from 'events';
import { EventPayload } from '../types';
export declare class EventBus extends EventEmitter {
    private static instance;
    private redisClient;
    private connected;
    private constructor();
    static getInstance(): EventBus;
    connect(): Promise<void>;
    private connectRedis;
    private connectMock;
    disconnect(): Promise<void>;
    publish(topic: string, payload: EventPayload): Promise<void>;
    private publishToRedis;
    private publishToMock;
    subscribe(pattern: string, callback: (payload: EventPayload) => void): Promise<void>;
    private subscribeToRedis;
    private subscribeToMock;
    private matchesPattern;
    private validateEventPayload;
    isConnected(): boolean;
    getStatus(): {
        connected: boolean;
        type: string;
        url?: string;
    };
}
export declare const eventBus: EventBus;
export declare function connectEventBus(): Promise<void>;
//# sourceMappingURL=eventBus.d.ts.map