/**
 * Billing Middleware
 *
 * Express middleware for tracking API usage and enforcing billing limits
 */
import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            billing?: {
                tenantId: string;
                startTime: number;
                tracked: boolean;
            };
        }
    }
}
export interface BillingMiddlewareOptions {
    trackUsage?: boolean;
    enforceQuotas?: boolean;
    exemptEndpoints?: string[];
}
/**
 * Billing tracking middleware
 */
export declare function billingTracker(options?: BillingMiddlewareOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to enforce tenant isolation
 */
export declare function tenantIsolation(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to add billing context to responses
 */
export declare function billingContext(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check resource limits before expensive operations
 */
export declare function resourceLimitCheck(resourceType: 'cpu' | 'memory' | 'storage' | 'executions'): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Get tenant billing summary
 */
export declare function getTenantBillingSummary(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=BillingMiddleware.d.ts.map