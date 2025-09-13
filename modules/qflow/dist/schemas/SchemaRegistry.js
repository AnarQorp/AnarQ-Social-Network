import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Schema Registry for Qflow events
 * Manages versioned event schemas and provides validation capabilities
 */
export class SchemaRegistry {
    ajv;
    schemas = new Map();
    schemaVersions = new Map();
    constructor() {
        this.ajv = new Ajv({
            allErrors: true,
            verbose: true,
            strict: false // Allow additional properties for extensibility
        });
        addFormats(this.ajv);
        this.loadSchemas();
    }
    /**
     * Load all event schemas from the schemas/events directory
     */
    loadSchemas() {
        const schemasDir = join(__dirname, '../../schemas/events');
        const schemaFiles = [
            'q.qflow.flow.created.v1.json',
            'q.qflow.flow.updated.v1.json',
            'q.qflow.flow.deleted.v1.json',
            'q.qflow.flow.ownership.transferred.v1.json',
            'q.qflow.flow.access.granted.v1.json',
            'q.qflow.flow.access.revoked.v1.json',
            'q.qflow.flow.sharing.updated.v1.json',
            'q.qflow.exec.started.v1.json',
            'q.qflow.exec.step.dispatched.v1.json',
            'q.qflow.exec.step.completed.v1.json',
            'q.qflow.exec.completed.v1.json',
            'q.qflow.validation.pipeline.executed.v1.json',
            'q.qflow.external.event.received.v1.json'
        ];
        for (const schemaFile of schemaFiles) {
            try {
                const schemaPath = join(schemasDir, schemaFile);
                const schemaContent = readFileSync(schemaPath, 'utf-8');
                const schema = JSON.parse(schemaContent);
                this.registerSchema(schema);
            }
            catch (error) {
                console.error(`Failed to load schema ${schemaFile}:`, error);
            }
        }
    }
    /**
     * Register a new schema in the registry
     */
    registerSchema(schema) {
        const schemaId = schema.$id;
        const version = schema.version || '1.0.0';
        if (!schemaId) {
            throw new Error('Schema must have an $id property');
        }
        // Compile the schema for validation
        const validator = this.ajv.compile(schema);
        const schemaInfo = {
            id: schemaId,
            version,
            title: schema.title || schemaId,
            description: schema.description || '',
            schema,
            validator
        };
        this.schemas.set(schemaId, schemaInfo);
        // Track versions for backward compatibility
        const baseId = schemaId.replace(/\.v\d+$/, '');
        if (!this.schemaVersions.has(baseId)) {
            this.schemaVersions.set(baseId, []);
        }
        this.schemaVersions.get(baseId).push(schemaId);
        console.log(`Registered schema: ${schemaId} (${schemaInfo.title})`);
    }
    /**
     * Validate an event against its schema
     */
    validateEvent(eventType, event) {
        const schemaInfo = this.schemas.get(eventType);
        if (!schemaInfo) {
            return {
                valid: false,
                errors: [`Unknown event type: ${eventType}`]
            };
        }
        const valid = schemaInfo.validator(event);
        if (!valid && schemaInfo.validator.errors) {
            const errors = schemaInfo.validator.errors.map(error => `${error.instancePath}: ${error.message}`);
            return { valid: false, errors };
        }
        return { valid: true };
    }
    /**
     * Get schema information by ID
     */
    getSchema(schemaId) {
        return this.schemas.get(schemaId);
    }
    /**
     * Get all available schemas
     */
    getAllSchemas() {
        return Array.from(this.schemas.values());
    }
    /**
     * Get all versions of a schema
     */
    getSchemaVersions(baseSchemaId) {
        return this.schemaVersions.get(baseSchemaId) || [];
    }
    /**
     * Check if a schema supports backward compatibility with an older version
     */
    isBackwardCompatible(currentSchemaId, targetSchemaId) {
        // For now, we assume schemas with the same base ID are backward compatible
        // In a production system, this would involve more sophisticated compatibility checking
        const currentBase = currentSchemaId.replace(/\.v\d+$/, '');
        const targetBase = targetSchemaId.replace(/\.v\d+$/, '');
        return currentBase === targetBase;
    }
    /**
     * Create a validated event with proper structure
     */
    createEvent(eventType, actor, data, source = 'qflow') {
        const event = {
            eventId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source,
            actor,
            data
        };
        const validation = this.validateEvent(eventType, event);
        if (!validation.valid) {
            throw new Error(`Event validation failed: ${validation.errors?.join(', ')}`);
        }
        return event;
    }
}
// Singleton instance
export const schemaRegistry = new SchemaRegistry();
//# sourceMappingURL=SchemaRegistry.js.map