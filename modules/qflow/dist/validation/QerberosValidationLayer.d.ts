/**
 * Qerberos Validation Layer for Universal Validation Pipeline
 *
 * Integrates with Qerberos service for security validation and anomaly detection
 * ensuring integrity checks and security violation detection.
 */
import { ValidationResult, ValidationContext } from './UniversalValidationPipeline.js';
export interface QerberosValidationConfig {
    endpoint: string;
    timeout: number;
    retryAttempts: number;
    enableAnomalyDetection: boolean;
    enableIntegrityChecks: boolean;
    riskThreshold: number;
    blockHighRisk: boolean;
}
export interface SecurityPolicy {
    id: string;
    name: string;
    version: string;
    rules: SecurityRule[];
    riskWeights: Record<string, number>;
    thresholds: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
}
export interface SecurityRule {
    id: string;
    name: string;
    type: 'pattern' | 'behavior' | 'integrity' | 'anomaly';
    severity: 'low' | 'medium' | 'high' | 'critical';
    pattern?: string;
    description: string;
    enabled: boolean;
    weight: number;
}
export interface SecurityViolation {
    ruleId: string;
    ruleName: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence: any;
    riskScore: number;
    timestamp: string;
}
export interface AnomalyDetectionResult {
    anomalous: boolean;
    anomalyScore: number;
    anomalyType: string[];
    baseline: Record<string, any>;
    deviations: Record<string, any>;
    confidence: number;
}
export interface IntegrityCheckResult {
    valid: boolean;
    checksPerformed: string[];
    violations: string[];
    hashVerification: boolean;
    signatureVerification: boolean;
    timestampVerification: boolean;
}
export interface QerberosValidationResult extends ValidationResult {
    details: {
        securityScore: number;
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        violations: SecurityViolation[];
        anomalyDetection?: AnomalyDetectionResult;
        integrityCheck?: IntegrityCheckResult;
        policyVersion: string;
        blocked: boolean;
        recommendations: string[];
        error?: string;
    };
}
/**
 * Qerberos Validation Layer
 * Provides security validation and anomaly detection for the Universal Validation Pipeline
 */
export declare class QerberosValidationLayer {
    private qerberosService;
    private config;
    constructor(config?: Partial<QerberosValidationConfig>);
    /**
     * Validate security and detect anomalies
     */
    validateSecurity(data: any, context: ValidationContext): Promise<QerberosValidationResult>;
    /**
     * Get security policy
     */
    getPolicy(policyId?: string): Promise<SecurityPolicy | null>;
    /**
     * Update security policy
     */
    updatePolicy(policy: SecurityPolicy): Promise<void>;
    /**
     * Get validation layer configuration for Universal Validation Pipeline
     */
    getValidationLayer(): {
        layerId: string;
        name: string;
        description: string;
        priority: number;
        required: boolean;
        timeout: number;
    };
    /**
     * Get validator function for Universal Validation Pipeline
     */
    getValidator(): (data: any, context: ValidationContext) => Promise<ValidationResult>;
    /**
     * Get current configuration
     */
    getConfig(): QerberosValidationConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<QerberosValidationConfig>): void;
    /**
     * Get security statistics
     */
    getSecurityStats(): {
        policiesLoaded: number;
        rulesEnabled: number;
        anomalyDetectionEnabled: boolean;
        integrityChecksEnabled: boolean;
    };
}
export declare const qerberosValidationLayer: QerberosValidationLayer;
//# sourceMappingURL=QerberosValidationLayer.d.ts.map