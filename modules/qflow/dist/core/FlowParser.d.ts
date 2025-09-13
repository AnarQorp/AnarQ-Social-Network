/**
 * Qflow Flow Parser and Validator
 *
 * Handles parsing and validation of flow definitions from JSON/YAML
 */
import { FlowDefinition, ValidationResult, ValidationError, ValidationWarning } from '../models/FlowDefinition.js';
export interface FlowParseResult {
    success: boolean;
    flow?: FlowDefinition;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
/**
 * Flow Parser and Validator
 * Parses JSON/YAML flow definitions and validates them against schema
 */
export declare class FlowParser {
    private ajv;
    constructor();
    /**
     * Parse flow definition from string (JSON or YAML)
     */
    parseFlow(flowData: string, format?: 'json' | 'yaml' | 'auto'): FlowParseResult;
    /**
     * Get cached flow definition
     */
    getCachedFlow(flowId: string): Promise<FlowDefinition | null>;
    /**
     * Invalidate cached flow
     */
    invalidateCachedFlow(flowId: string): Promise<void>;
    /**
     * Validate flow structure against JSON schema
     */
    validateFlowStructure(flow: any): ValidationResult;
    /**
     * Validate business logic rules
     */
    private validateBusinessLogic;
    /**
     * Detect format of flow data
     */
    private detectFormat;
    /**
     * Check for circular dependencies in step flow
     */
    private checkCircularDependencies;
    /**
     * Find unreachable steps
     */
    private findUnreachableSteps;
    /**
     * Find duplicate step IDs
     */
    private findDuplicateStepIds;
    /**
     * Normalize and enrich flow definition
     */
    private normalizeFlow;
}
export declare const flowParser: FlowParser;
//# sourceMappingURL=FlowParser.d.ts.map