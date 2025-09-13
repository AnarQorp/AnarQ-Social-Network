/**
 * Qflow Deprecation Manager
 * Integrates with the ecosystem's DeprecationManagementService to handle
 * deprecation of flows, templates, and features with proper sunset paths
 */
export declare class QflowDeprecationManager {
    private deprecationService;
    private deprecatedFeatures;
    private migrationNotifications;
    constructor();
    /**
     * Set up event listeners for deprecation events
     */
    private setupEventListeners;
    /**
     * Deprecate a flow template or feature
     */
    deprecateFeature(featureId: string, deprecationInfo: {
        feature: string;
        version: string;
        deprecationDate: string;
        sunsetDate: string;
        migrationDeadline?: string;
        replacementFeature?: string;
        migrationGuide?: string;
        reason: string;
        impactAssessment?: any;
    }): Promise<void>;
    /**
     * Track usage of deprecated features
     */
    trackDeprecatedFeatureUsage(featureId: string, usageData: {
        flowId?: string;
        executionId?: string;
        actor: string;
        context?: any;
    }): Promise<void>;
    /**
     * Get deprecation status for a feature
     */
    getDeprecationStatus(featureId: string): any;
    /**
     * Get migration recommendations for deprecated features
     */
    getMigrationRecommendations(featureId: string): Promise<any>;
    /**
     * Create compatibility warnings for deprecated features
     */
    createCompatibilityWarning(featureId: string): string;
    /**
     * Handle deprecation announced event
     */
    private handleDeprecationAnnounced;
    /**
     * Handle deprecation warning event
     */
    private handleDeprecationWarning;
    /**
     * Handle deprecation sunset event
     */
    private handleDeprecationSunset;
    /**
     * Estimate affected flows for a feature
     */
    private estimateAffectedFlows;
    /**
     * Assess migration complexity
     */
    private assessMigrationComplexity;
    /**
     * Get affected flow templates
     */
    private getAffectedFlowTemplates;
    /**
     * Generate migration tools
     */
    private generateMigrationTools;
    /**
     * Create compatibility layer
     */
    private createCompatibilityLayer;
    /**
     * Check migration notifications
     */
    private checkMigrationNotifications;
    /**
     * Create migration notifications
     */
    private createMigrationNotifications;
    /**
     * Send targeted migration notifications
     */
    private sendTargetedMigrationNotifications;
    /**
     * Send migration notification
     */
    private sendMigrationNotification;
    /**
     * Activate compatibility layer
     */
    private activateCompatibilityLayer;
    /**
     * Estimate migration effort
     */
    private estimateMigrationEffort;
    /**
     * Check if automated migration is available
     */
    private checkAutomatedMigrationAvailable;
    /**
     * Hash deprecation info for validation
     */
    private hashDeprecationInfo;
}
export declare const qflowDeprecationManager: QflowDeprecationManager;
//# sourceMappingURL=QflowDeprecationManager.d.ts.map