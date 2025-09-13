/**
 * Qlock Validation Layer for Universal Validation Pipeline
 *
 * Integrates with Qlock service for encryption/decryption validation
 * and key management for flow security.
 */
import { ValidationResult, ValidationContext } from './UniversalValidationPipeline.js';
export interface QlockValidationConfig {
    endpoint: string;
    timeout: number;
    retryAttempts: number;
    keyRotationInterval: number;
    encryptionAlgorithm: string;
}
export interface EncryptedData {
    data: string;
    keyId: string;
    algorithm: string;
    iv: string;
    timestamp: string;
    signature: string;
}
export interface DecryptionRequest {
    encryptedData: EncryptedData;
    keyId: string;
    context: ValidationContext;
}
export interface EncryptionRequest {
    data: any;
    keyId?: string;
    context: ValidationContext;
}
export interface QlockValidationResult extends ValidationResult {
    details: {
        keyId?: string;
        algorithm?: string;
        encryptionValid?: boolean;
        decryptionValid?: boolean;
        keyRotationNeeded?: boolean;
        securityLevel?: 'low' | 'medium' | 'high';
        error?: string;
    };
}
/**
 * Qlock Validation Layer
 * Provides encryption/decryption validation for the Universal Validation Pipeline
 */
export declare class QlockValidationLayer {
    private qlockService;
    private config;
    constructor(config?: Partial<QlockValidationConfig>);
    /**
     * Validate encrypted data
     */
    validateEncryptedData(data: any, context: ValidationContext): Promise<QlockValidationResult>;
    /**
     * Encrypt data using Qlock
     */
    encryptData(data: any, context: ValidationContext, keyId?: string): Promise<EncryptedData>;
    /**
     * Decrypt data using Qlock
     */
    decryptData(encryptedData: EncryptedData, context: ValidationContext): Promise<any>;
    /**
     * Rotate encryption key
     */
    rotateKey(keyId: string): Promise<string>;
    /**
     * Find encrypted fields in data
     */
    private findEncryptedFields;
    /**
     * Check if an object looks like encrypted data
     */
    private isEncryptedData;
    /**
     * Validate a single encrypted field
     */
    private validateEncryptedField;
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
    getConfig(): QlockValidationConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<QlockValidationConfig>): void;
}
export declare const qlockValidationLayer: QlockValidationLayer;
//# sourceMappingURL=QlockValidationLayer.d.ts.map