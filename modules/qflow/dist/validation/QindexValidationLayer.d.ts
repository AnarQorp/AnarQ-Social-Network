/**
 * Qindex Validation Layer for Universal Validation Pipeline
 *
 * Integrates with Qindex service for metadata validation and indexing
 * ensuring proper data structure and searchability.
 */
import { ValidationResult, ValidationContext } from './UniversalValidationPipeline.js';
export interface QindexValidationConfig {
    endpoint: string;
    timeout: number;
    retryAttempts: number;
    enableIndexing: boolean;
    validateSchema: boolean;
    schemaVersion: string;
}
export interface MetadataSchema {
    id: string;
    version: string;
    name: string;
    description: string;
    properties: Record<string, SchemaProperty>;
    required: string[];
    additionalProperties: boolean;
}
export interface SchemaProperty {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    format?: string;
    enum?: any[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    items?: SchemaProperty;
    properties?: Record<string, SchemaProperty>;
}
export interface IndexRequest {
    id: string;
    type: string;
    metadata: Record<string, any>;
    content?: any;
    tags?: string[];
    context: ValidationContext;
}
export interface IndexResponse {
    indexed: boolean;
    id: string;
    version: number;
    searchable: boolean;
    metadata: Record<string, any>;
    extractedTags: string[];
    timestamp: string;
}
export interface QindexValidationResult extends ValidationResult {
    details: {
        schemaValidation: boolean;
        metadataComplete: boolean;
        indexingStatus: 'indexed' | 'pending' | 'failed' | 'skipped';
        missingFields?: string[];
        invalidFields?: string[];
        extractedMetadata?: Record<string, any>;
        searchTags?: string[];
        schemaVersion?: string;
        error?: string;
    };
}
/**
 * Qindex Validation Layer
 * Provides metadata validation and indexing for the Universal Validation Pipeline
 */
export declare class QindexValidationLayer {
    private qindexService;
    private config;
    constructor(config?: Partial<QindexValidationConfig>);
    /**
     * Validate metadata and optionally index data
     */
    validateMetadata(data: any, context: ValidationContext): Promise<QindexValidationResult>;
    /**
     * Search indexed data
     */
    searchIndex(query: string, filters?: Record<string, any>): Promise<IndexResponse[]>;
    /**
     * Get index entry by ID
     */
    getIndexEntry(id: string): Promise<IndexResponse | null>;
    /**
     * Delete index entry
     */
    deleteIndexEntry(id: string): Promise<boolean>;
    /**
     * Register a new metadata schema
     */
    registerSchema(schema: MetadataSchema): Promise<void>;
    /**
     * Get schema by ID
     */
    getSchema(schemaId: string): Promise<MetadataSchema | null>;
    /**
     * Determine which schema to use for validation
     */
    private determineSchema;
    /**
     * Determine data type for indexing
     */
    private getDataType;
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
    getConfig(): QindexValidationConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<QindexValidationConfig>): void;
    /**
     * Get indexing statistics
     */
    getIndexStats(): {
        totalEntries: number;
        schemas: number;
    };
}
export declare const qindexValidationLayer: QindexValidationLayer;
//# sourceMappingURL=QindexValidationLayer.d.ts.map