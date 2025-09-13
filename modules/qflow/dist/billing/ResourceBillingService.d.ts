/**
 * Resource Billing and Multi-Tenant Management Service
 *
 * Manages resource usage tracking, billing boundaries, and tenant isolation
 */
import { EventEmitter } from 'events';
export interface TenantResourceUsage {
    tenantId: string;
    period: string;
    usage: {
        cpu: ResourceMetric;
        memory: ResourceMetric;
        storage: ResourceMetric;
        network: ResourceMetric;
        executions: ResourceMetric;
        apiCalls: ResourceMetric;
    };
    costs: {
        compute: number;
        storage: number;
        network: number;
        operations: number;
        total: number;
    };
    limits: TenantResourceLimits;
    alerts: ResourceAlert[];
}
export interface ResourceMetric {
    current: number;
    peak: number;
    average: number;
    total: number;
    unit: string;
    samples: number;
    lastUpdated: string;
}
export interface TenantResourceLimits {
    tenantId: string;
    limits: {
        maxCpuHours: number;
        maxMemoryGBHours: number;
        maxStorageGB: number;
        maxNetworkGB: number;
        maxExecutions: number;
        maxApiCalls: number;
        maxMonthlyCost: number;
    };
    softLimits: {
        cpuWarningThreshold: number;
        memoryWarningThreshold: number;
        costWarningThreshold: number;
    };
    billingTier: 'free' | 'basic' | 'premium' | 'enterprise';
    effectiveFrom: string;
    effectiveUntil?: string;
}
export interface ResourceAlert {
    id: string;
    tenantId: string;
    type: 'warning' | 'limit_exceeded' | 'cost_threshold';
    resource: 'cpu' | 'memory' | 'storage' | 'network' | 'executions' | 'cost';
    message: string;
    threshold: number;
    currentValue: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: string;
}
export interface BillingPeriod {
    tenantId: string;
    period: string;
    startDate: string;
    endDate: string;
    usage: TenantResourceUsage['usage'];
    costs: TenantResourceUsage['costs'];
    status: 'active' | 'closed' | 'disputed';
    invoiceId?: string;
    paidAt?: string;
}
export interface ResourcePricing {
    tier: 'free' | 'basic' | 'premium' | 'enterprise';
    pricing: {
        cpuPerHour: number;
        memoryPerGBHour: number;
        storagePerGBMonth: number;
        networkPerGB: number;
        executionBase: number;
        apiCallPer1000: number;
    };
    includedQuotas: {
        cpuHours: number;
        memoryGBHours: number;
        storageGB: number;
        networkGB: number;
        executions: number;
        apiCalls: number;
    };
    effectiveFrom: string;
}
export interface TenantIsolationConfig {
    tenantId: string;
    isolation: {
        networkSegmentation: boolean;
        storageEncryption: boolean;
        computeIsolation: boolean;
        logIsolation: boolean;
        metricIsolation: boolean;
    };
    dataResidency: {
        region: string;
        allowCrossRegion: boolean;
        encryptionAtRest: boolean;
        encryptionInTransit: boolean;
    };
    compliance: {
        gdprCompliant: boolean;
        hipaaCompliant: boolean;
        soc2Compliant: boolean;
        customCompliance: string[];
    };
}
export declare class ResourceBillingService extends EventEmitter {
    private usageCache;
    private limitsCache;
    private alertsCache;
    private billingPeriodsCache;
    private isolationConfigCache;
    private pricingTiers;
    private cacheExpiry;
    constructor();
    /**
     * Initialize tenant resource tracking
     */
    initializeTenant(tenantId: string, billingTier?: TenantResourceLimits['billingTier']): Promise<TenantResourceLimits>;
    /**
     * Track resource usage for execution
     */
    trackExecutionUsage(tenantId: string, executionId: string, resourceUsage: {
        cpuTime: number;
        memoryUsage: number;
        storageUsed: number;
        networkTransfer: number;
        duration: number;
    }): Promise<void>;
    /**
     * Track API call usage
     */
    trackAPIUsage(tenantId: string, endpoint: string, responseTime: number, statusCode: number): Promise<void>;
    /**
     * Check if tenant can allocate resources
     */
    canAllocateResources(tenantId: string, requestedResources: {
        cpu?: number;
        memory?: number;
        storage?: number;
        executions?: number;
    }): Promise<{
        allowed: boolean;
        reason?: string;
        limits?: any;
    }>;
    /**
     * Get tenant resource usage
     */
    getTenantUsage(tenantId: string, period?: string): Promise<TenantResourceUsage | null>;
    /**
     * Get tenant alerts
     */
    getTenantAlerts(tenantId: string, unacknowledgedOnly?: boolean): Promise<ResourceAlert[]>;
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean>;
    /**
     * Update tenant billing tier
     */
    updateBillingTier(tenantId: string, newTier: TenantResourceLimits['billingTier'], updatedBy: string): Promise<boolean>;
    /**
     * Generate billing report
     */
    generateBillingReport(tenantId: string, period: string): Promise<BillingPeriod | null>;
    /**
     * Get tenant isolation config
     */
    getTenantIsolationConfig(tenantId: string): Promise<TenantIsolationConfig | null>;
    private setupEventHandlers;
    private initializePricingTiers;
    private startUsageTracking;
    private getDefaultLimitsForTier;
    private getDefaultIsolationConfig;
    private getCurrentPeriod;
    private createEmptyUsage;
    private updateMetric;
    private updateCosts;
    private checkLimitsAndAlert;
    private createAlert;
    private calculateProjectedCost;
    private aggregateUsageMetrics;
    private checkAllTenantsLimits;
    private cleanupOldData;
    private generateEventId;
}
export declare const resourceBillingService: ResourceBillingService;
//# sourceMappingURL=ResourceBillingService.d.ts.map