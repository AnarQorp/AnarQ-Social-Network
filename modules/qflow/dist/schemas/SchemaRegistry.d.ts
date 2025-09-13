import { ValidateFunction } from 'ajv';
export interface QflowEvent {
    eventId: string;
    timestamp: string;
    version: string;
    source: string;
    actor: string;
    data: Record<string, any>;
}
export interface SchemaInfo {
    id: string;
    version: string;
    title: string;
    description: string;
    schema: any;
    validator: ValidateFunction;
}
/**
 * Schema Registry for Qflow events
 * Manages versioned event schemas and provides validation capabilities
 */
export declare class SchemaRegistry {
    private ajv;
    private schemas;
    private schemaVersions;
    constructor();
    /**
     * Load all event schemas from the schemas/events directory
     */
    private loadSchemas;
    /**
     * Register a new schema in the registry
     */
    registerSchema(schema: any): void;
    /**
     * Validate an event against its schema
     */
    validateEvent(eventType: string, event: QflowEvent): {
        valid: boolean;
        errors?: string[];
    };
    /**
     * Get schema information by ID
     */
    getSchema(schemaId: string): SchemaInfo | undefined;
    /**
     * Get all available schemas
     */
    getAllSchemas(): SchemaInfo[];
    /**
     * Get all versions of a schema
     */
    getSchemaVersions(baseSchemaId: string): string[];
    /**
     * Check if a schema supports backward compatibility with an older version
     */
    isBackwardCompatible(currentSchemaId: string, targetSchemaId: string): boolean;
    /**
     * Create a validated event with proper structure
     */
    createEvent(eventType: string, actor: string, data: Record<string, any>, source?: string): QflowEvent;
}
export declare const schemaRegistry: SchemaRegistry;
//# sourceMappingURL=SchemaRegistry.d.ts.map