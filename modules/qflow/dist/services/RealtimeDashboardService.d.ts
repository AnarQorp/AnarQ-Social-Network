/**
 * Real-time Dashboard Service for Qflow
 * Provides WebSocket-based real-time metrics streaming and dashboard
 */
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { PerformanceIntegrationService } from './PerformanceIntegrationService.js';
import { AdaptivePerformanceService } from './AdaptivePerformanceService.js';
export interface DashboardClient {
    id: string;
    ws: WebSocket;
    subscriptions: Set<string>;
    filters: Record<string, any>;
    lastHeartbeat: number;
}
export interface MetricStream {
    name: string;
    interval: number;
    enabled: boolean;
    lastUpdate: number;
    subscribers: Set<string>;
}
export interface AlertRule {
    id: string;
    name: string;
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    channels: string[];
    enabled: boolean;
    cooldown: number;
    lastTriggered?: number;
}
export declare class RealtimeDashboardService extends EventEmitter {
    private wss;
    private clients;
    private metricStreams;
    private alertRules;
    private performanceService;
    private adaptiveService;
    private updateInterval;
    private config;
    constructor(performanceService: PerformanceIntegrationService, adaptiveService: AdaptivePerformanceService, options?: any);
    /**
     * Start the dashboard service
     */
    start(): void;
    /**
     * Stop the dashboard service
     */
    stop(): void;
    /**
     * Get dashboard configuration
     */
    getConfig(): typeof this.config;
    /**
     * Add metric stream
     */
    addMetricStream(stream: MetricStream): void;
    /**
     * Add alert rule
     */
    addAlertRule(rule: AlertRule): void;
    /**
     * Remove alert rule
     */
    removeAlertRule(id: string): void;
    /**
     * Broadcast message to all clients
     */
    broadcast(type: string, data: any, filter?: (client: DashboardClient) => boolean): void;
    /**
     * Send message to specific client
     */
    sendToClient(clientId: string, type: string, data: any): void;
    /**
     * Get dashboard statistics
     */
    getDashboardStats(): {
        connectedClients: number;
        activeStreams: number;
        alertRules: number;
        messagesSent: number;
        uptime: number;
    };
    /**
     * Get ecosystem-wide performance correlation for dashboard
     */
    getEcosystemDashboardData(): any;
    /**
     * Create interactive dashboard data with comprehensive metrics
     */
    getInteractiveDashboardData(): {
        realTimeMetrics: any;
        flowExecutions: any[];
        validationPipeline: any;
        systemHealth: any;
        alerts: any[];
        daoMetrics: Record<string, any>;
    };
    /**
     * Add customizable alert rule with notification channels
     */
    addCustomAlertRule(rule: AlertRule & {
        notificationChannels: {
            webhook?: {
                url: string;
                headers?: Record<string, string>;
            };
            email?: {
                recipients: string[];
                template?: string;
            };
            slack?: {
                channel: string;
                webhook: string;
            };
            sms?: {
                recipients: string[];
            };
            dashboard?: {
                priority: 'low' | 'medium' | 'high' | 'critical';
            };
        };
    }): void;
    /**
     * Send notification through multiple channels
     */
    private sendNotification;
    /**
     * Private methods
     */
    private setupWebSocketServer;
    private handleNewConnection;
    private handleClientMessage;
    private handleSubscription;
    private handleUnsubscription;
    private handleSetFilters;
    private handleClientDisconnect;
    private setupDefaultStreams;
    private setupDefaultAlerts;
    private setupEventHandlers;
    private startMetricStreaming;
    private stopMetricStreaming;
    private startHeartbeat;
    private updateMetricStreams;
    private updateStream;
    private broadcastToStream;
    private passesClientFilters;
    private checkAlertRules;
    private evaluateAlertCondition;
    private triggerAlert;
    private performHeartbeatCheck;
    private generateClientId;
    /**
     * Private helper methods for dashboard data
     */
    private getLatencyMetrics;
    private getThroughputMetrics;
    private getErrorRateMetrics;
    private getResourceMetrics;
    private getActiveFlowExecutions;
    private getValidationPipelineStatus;
    private getSystemHealthStatus;
    private getActiveAlerts;
    private getDAOSpecificMetrics;
    private setupNotificationChannels;
    private sendWebhookNotification;
    private sendEmailNotification;
    private sendSlackNotification;
    private sendSMSNotification;
}
export default RealtimeDashboardService;
//# sourceMappingURL=RealtimeDashboardService.d.ts.map