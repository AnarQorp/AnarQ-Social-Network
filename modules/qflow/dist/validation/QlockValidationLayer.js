/**
 * Qlock Validation Layer for Universal Validation Pipeline
 *
 * Integrates with Qlock service for encryption/decryption validation
 * and key management for flow security.
 */
import { qflowEventEmitter } from '../events/EventEmitter.js';
/**
 * Mock Qlock Service for development/testing
 * In production, this would integrate with the actual Qlock service
 */
class MockQlockService {
    keys = new Map();
    config;
    constructor(config) {
        this.config = config;
        this.initializeDefaultKeys();
    }
    initializeDefaultKeys() {
        // Initialize with some default keys for testing
        this.keys.set('default-key-1', {
            key: 'mock-encryption-key-1',
            algorithm: 'AES-256-GCM',
            created: new Date().toISOString()
        });
        this.keys.set('default-key-2', {
            key: 'mock-encryption-key-2',
            algorithm: 'AES-256-GCM',
            created: new Date().toISOString()
        });
    }
    async encrypt(request) {
        const keyId = request.keyId || 'default-key-1';
        const keyInfo = this.keys.get(keyId);
        if (!keyInfo) {
            throw new Error(`Encryption key not found: ${keyId}`);
        }
        // Mock encryption - in reality this would use proper cryptographic functions
        const dataString = JSON.stringify(request.data);
        const mockEncryptedData = Buffer.from(dataString).toString('base64');
        const mockIV = Buffer.from('mock-iv-12345678').toString('base64');
        const mockSignature = this.generateMockSignature(mockEncryptedData, keyId);
        return {
            data: mockEncryptedData,
            keyId,
            algorithm: keyInfo.algorithm,
            iv: mockIV,
            timestamp: new Date().toISOString(),
            signature: mockSignature
        };
    }
    async decrypt(request) {
        const { encryptedData, keyId } = request;
        const keyInfo = this.keys.get(keyId);
        if (!keyInfo) {
            throw new Error(`Decryption key not found: ${keyId}`);
        }
        // Verify signature
        const expectedSignature = this.generateMockSignature(encryptedData.data, keyId);
        if (encryptedData.signature !== expectedSignature) {
            throw new Error('Invalid signature - data may have been tampered with');
        }
        // Mock decryption - in reality this would use proper cryptographic functions
        try {
            const decryptedString = Buffer.from(encryptedData.data, 'base64').toString('utf-8');
            return JSON.parse(decryptedString);
        }
        catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async validateEncryption(encryptedData) {
        const keyInfo = this.keys.get(encryptedData.keyId);
        if (!keyInfo) {
            return false;
        }
        // Validate signature
        const expectedSignature = this.generateMockSignature(encryptedData.data, encryptedData.keyId);
        if (encryptedData.signature !== expectedSignature) {
            return false;
        }
        // Validate algorithm
        if (encryptedData.algorithm !== keyInfo.algorithm) {
            return false;
        }
        // Validate timestamp (not too old)
        const encryptionTime = new Date(encryptedData.timestamp).getTime();
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (now - encryptionTime > maxAge) {
            return false;
        }
        return true;
    }
    async rotateKey(keyId) {
        const oldKey = this.keys.get(keyId);
        if (!oldKey) {
            throw new Error(`Key not found for rotation: ${keyId}`);
        }
        const newKeyId = `${keyId}-rotated-${Date.now()}`;
        this.keys.set(newKeyId, {
            key: `rotated-${oldKey.key}`,
            algorithm: oldKey.algorithm,
            created: new Date().toISOString()
        });
        return newKeyId;
    }
    async getKeyInfo(keyId) {
        const keyInfo = this.keys.get(keyId);
        if (!keyInfo) {
            return null;
        }
        return {
            algorithm: keyInfo.algorithm,
            created: keyInfo.created
        };
    }
    generateMockSignature(data, keyId) {
        // Mock signature generation - in reality this would use proper cryptographic signing
        const signatureInput = `${data}:${keyId}:mock-secret`;
        return Buffer.from(signatureInput).toString('base64').substring(0, 32);
    }
    isKeyRotationNeeded(keyId) {
        const keyInfo = this.keys.get(keyId);
        if (!keyInfo) {
            return true; // Unknown keys should be rotated
        }
        const keyAge = Date.now() - new Date(keyInfo.created).getTime();
        return keyAge > this.config.keyRotationInterval;
    }
}
/**
 * Qlock Validation Layer
 * Provides encryption/decryption validation for the Universal Validation Pipeline
 */
export class QlockValidationLayer {
    qlockService;
    config;
    constructor(config) {
        this.config = {
            endpoint: process.env.QLOCK_ENDPOINT || 'http://localhost:8080',
            timeout: 10000,
            retryAttempts: 3,
            keyRotationInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
            encryptionAlgorithm: 'AES-256-GCM',
            ...config
        };
        this.qlockService = new MockQlockService(this.config);
    }
    /**
     * Validate encrypted data
     */
    async validateEncryptedData(data, context) {
        const startTime = Date.now();
        try {
            // Check if data contains encrypted fields
            const encryptedFields = this.findEncryptedFields(data);
            if (encryptedFields.length === 0) {
                return {
                    layerId: 'qlock-validation',
                    status: 'passed',
                    message: 'No encrypted data found - validation skipped',
                    duration: Date.now() - startTime,
                    timestamp: new Date().toISOString(),
                    details: {
                        encryptionValid: true,
                        securityLevel: 'medium'
                    }
                };
            }
            // Validate each encrypted field
            const validationResults = await Promise.all(encryptedFields.map(field => this.validateEncryptedField(field)));
            const hasFailures = validationResults.some(result => !result.valid);
            const needsKeyRotation = validationResults.some(result => result.keyRotationNeeded);
            if (hasFailures) {
                return {
                    layerId: 'qlock-validation',
                    status: 'failed',
                    message: 'Encryption validation failed',
                    duration: Date.now() - startTime,
                    timestamp: new Date().toISOString(),
                    details: {
                        encryptionValid: false,
                        securityLevel: 'low',
                        error: 'One or more encrypted fields failed validation'
                    }
                };
            }
            const status = needsKeyRotation ? 'warning' : 'passed';
            const message = needsKeyRotation
                ? 'Encryption validation passed but key rotation recommended'
                : 'Encryption validation passed';
            return {
                layerId: 'qlock-validation',
                status,
                message,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                details: {
                    encryptionValid: true,
                    keyRotationNeeded: needsKeyRotation,
                    securityLevel: needsKeyRotation ? 'medium' : 'high'
                }
            };
        }
        catch (error) {
            return {
                layerId: 'qlock-validation',
                status: 'failed',
                message: `Qlock validation error: ${error instanceof Error ? error.message : String(error)}`,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                details: {
                    encryptionValid: false,
                    securityLevel: 'low',
                    error: error instanceof Error ? error.message : String(error)
                }
            };
        }
    }
    /**
     * Encrypt data using Qlock
     */
    async encryptData(data, context, keyId) {
        try {
            const encryptionRequest = {
                data,
                keyId,
                context
            };
            const encryptedData = await this.qlockService.encrypt(encryptionRequest);
            // Emit encryption event
            qflowEventEmitter.emit('q.qflow.qlock.encrypted.v1', {
                keyId: encryptedData.keyId,
                algorithm: encryptedData.algorithm,
                dataSize: JSON.stringify(data).length,
                context: context.requestId,
                timestamp: new Date().toISOString()
            });
            return encryptedData;
        }
        catch (error) {
            console.error('[QlockValidation] ❌ Encryption failed:', error);
            throw error;
        }
    }
    /**
     * Decrypt data using Qlock
     */
    async decryptData(encryptedData, context) {
        try {
            const decryptionRequest = {
                encryptedData,
                keyId: encryptedData.keyId,
                context
            };
            const decryptedData = await this.qlockService.decrypt(decryptionRequest);
            // Emit decryption event
            qflowEventEmitter.emit('q.qflow.qlock.decrypted.v1', {
                keyId: encryptedData.keyId,
                algorithm: encryptedData.algorithm,
                context: context.requestId,
                timestamp: new Date().toISOString()
            });
            return decryptedData;
        }
        catch (error) {
            console.error('[QlockValidation] ❌ Decryption failed:', error);
            throw error;
        }
    }
    /**
     * Rotate encryption key
     */
    async rotateKey(keyId) {
        try {
            const newKeyId = await this.qlockService.rotateKey(keyId);
            // Emit key rotation event
            qflowEventEmitter.emit('q.qflow.qlock.key.rotated.v1', {
                oldKeyId: keyId,
                newKeyId,
                timestamp: new Date().toISOString()
            });
            console.log(`[QlockValidation] 🔄 Key rotated: ${keyId} -> ${newKeyId}`);
            return newKeyId;
        }
        catch (error) {
            console.error('[QlockValidation] ❌ Key rotation failed:', error);
            throw error;
        }
    }
    /**
     * Find encrypted fields in data
     */
    findEncryptedFields(data) {
        const encryptedFields = [];
        const traverse = (obj, path = '') => {
            if (obj && typeof obj === 'object') {
                // Check if this object looks like encrypted data
                if (this.isEncryptedData(obj)) {
                    encryptedFields.push(obj);
                }
                else {
                    // Recursively check nested objects
                    for (const [key, value] of Object.entries(obj)) {
                        traverse(value, path ? `${path}.${key}` : key);
                    }
                }
            }
        };
        traverse(data);
        return encryptedFields;
    }
    /**
     * Check if an object looks like encrypted data
     */
    isEncryptedData(obj) {
        return obj &&
            typeof obj === 'object' &&
            typeof obj.data === 'string' &&
            typeof obj.keyId === 'string' &&
            typeof obj.algorithm === 'string' &&
            typeof obj.iv === 'string' &&
            typeof obj.signature === 'string';
    }
    /**
     * Validate a single encrypted field
     */
    async validateEncryptedField(encryptedData) {
        try {
            // Validate encryption integrity
            const isValid = await this.qlockService.validateEncryption(encryptedData);
            if (!isValid) {
                return {
                    valid: false,
                    keyRotationNeeded: false,
                    error: 'Encryption validation failed'
                };
            }
            // Check if key rotation is needed
            const keyRotationNeeded = this.qlockService.isKeyRotationNeeded(encryptedData.keyId);
            return {
                valid: true,
                keyRotationNeeded
            };
        }
        catch (error) {
            return {
                valid: false,
                keyRotationNeeded: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Get validation layer configuration for Universal Validation Pipeline
     */
    getValidationLayer() {
        return {
            layerId: 'qlock-validation',
            name: 'Qlock Encryption Validation',
            description: 'Validates encrypted data integrity and key management',
            priority: 1, // High priority for security
            required: true,
            timeout: this.config.timeout
        };
    }
    /**
     * Get validator function for Universal Validation Pipeline
     */
    getValidator() {
        return async (data, context) => {
            return await this.validateEncryptedData(data, context);
        };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        console.log('[QlockValidation] 📋 Configuration updated');
    }
}
// Export singleton instance
export const qlockValidationLayer = new QlockValidationLayer();
//# sourceMappingURL=QlockValidationLayer.js.map