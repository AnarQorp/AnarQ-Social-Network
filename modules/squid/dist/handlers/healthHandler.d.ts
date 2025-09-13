/**
 * Health Check Handler
 * Provides health status and dependency monitoring
 */
import { Request, Response } from 'express';
export declare class HealthHandler {
    private startTime;
    private requestCount;
    private errorCount;
    private responseTimes;
    constructor();
    /**
     * Health check endpoint
     */
    getHealth: (req: Request, res: Response) => Promise<void>;
    /**
     * Record request metrics
     */
    recordRequest(responseTime: number, isError?: boolean): void;
    private checkHealth;
    private checkDependencies;
    private checkDatabase;
    private checkEventBus;
    private checkExternalService;
    private determineOverallStatus;
    private getUptime;
    private getErrorRate;
    private getAverageResponseTime;
}
//# sourceMappingURL=healthHandler.d.ts.map