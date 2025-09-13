/**
 * Qflow Flow Definition Models
 *
 * Core data models for flow definitions, steps, and metadata
 */
export interface FlowDefinition {
    id: string;
    name: string;
    version: string;
    owner: string;
    description?: string;
    steps: FlowStep[];
    metadata: FlowMetadata;
    daoPolicy?: string;
    createdAt: string;
    updatedAt: string;
}
export interface FlowStep {
    id: string;
    type: 'task' | 'condition' | 'parallel' | 'event-trigger' | 'module-call';
    action: string;
    params: Record<string, any>;
    onSuccess?: string;
    onFailure?: string;
    timeout?: number;
    retryPolicy?: RetryPolicy;
    resourceLimits?: ResourceLimits;
}
export interface FlowMetadata {
    tags: string[];
    category: string;
    visibility: 'public' | 'dao-only' | 'private';
    daoSubnet?: string;
    requiredPermissions: string[];
    estimatedDuration?: number;
    resourceRequirements?: ResourceRequirements;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    initialDelay: number;
    maxDelay: number;
    retryableErrors?: string[];
}
export interface ResourceLimits {
    maxMemoryMB: number;
    maxExecutionTimeMs: number;
    maxCpuPercent?: number;
    maxNetworkRequests?: number;
}
export interface ResourceRequirements {
    minMemoryMB: number;
    minCpuCores: number;
    requiredCapabilities: string[];
    networkAccess: boolean;
    storageAccess: boolean;
}
export interface ExecutionState {
    executionId: string;
    flowId: string;
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'aborted';
    currentStep: string;
    completedSteps: string[];
    failedSteps: string[];
    context: ExecutionContext;
    startTime: string;
    endTime?: string;
    error?: ExecutionError;
    checkpoints: Checkpoint[];
    nodeAssignments: Record<string, string>;
}
export interface ExecutionContext {
    triggeredBy: string;
    triggerType: 'manual' | 'webhook' | 'event' | 'schedule';
    inputData: Record<string, any>;
    variables: Record<string, any>;
    daoSubnet?: string;
    permissions: string[];
}
export interface ExecutionError {
    type: ErrorType;
    message: string;
    stepId?: string;
    nodeId?: string;
    retryable: boolean;
    details: Record<string, any>;
    timestamp: string;
}
export declare enum ErrorType {
    VALIDATION_ERROR = "validation_error",
    EXECUTION_ERROR = "execution_error",
    NODE_FAILURE = "node_failure",
    NETWORK_ERROR = "network_error",
    PERMISSION_DENIED = "permission_denied",
    RESOURCE_EXHAUSTED = "resource_exhausted",
    TIMEOUT_ERROR = "timeout_error",
    DAO_POLICY_VIOLATION = "dao_policy_violation"
}
export interface Checkpoint {
    checkpointId: string;
    executionId: string;
    stepId: string;
    state: Record<string, any>;
    timestamp: string;
    signature: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    metadata?: Record<string, any>;
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}
export interface ValidationWarning {
    field: string;
    message: string;
    code: string;
    value?: any;
}
/**
 * Flow Definition Validation Schema
 */
export declare const FLOW_DEFINITION_SCHEMA: {
    readonly type: "object";
    readonly required: readonly ["id", "name", "version", "owner", "steps", "metadata"];
    readonly properties: {
        readonly id: {
            readonly type: "string";
            readonly pattern: "^[a-zA-Z0-9_-]+$";
            readonly minLength: 1;
            readonly maxLength: 100;
        };
        readonly name: {
            readonly type: "string";
            readonly minLength: 1;
            readonly maxLength: 200;
        };
        readonly version: {
            readonly type: "string";
            readonly pattern: "^\\d+\\.\\d+\\.\\d+$";
        };
        readonly owner: {
            readonly type: "string";
            readonly minLength: 1;
        };
        readonly description: {
            readonly type: "string";
            readonly maxLength: 1000;
        };
        readonly steps: {
            readonly type: "array";
            readonly minItems: 1;
            readonly items: {
                readonly type: "object";
                readonly required: readonly ["id", "type", "action"];
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly pattern: "^[a-zA-Z0-9_-]+$";
                    };
                    readonly type: {
                        readonly type: "string";
                        readonly enum: readonly ["task", "condition", "parallel", "event-trigger", "module-call"];
                    };
                    readonly action: {
                        readonly type: "string";
                        readonly minLength: 1;
                    };
                    readonly params: {
                        readonly type: "object";
                    };
                    readonly onSuccess: {
                        readonly type: "string";
                    };
                    readonly onFailure: {
                        readonly type: "string";
                    };
                    readonly timeout: {
                        readonly type: "number";
                        readonly minimum: 1000;
                        readonly maximum: 3600000;
                    };
                };
            };
        };
        readonly metadata: {
            readonly type: "object";
            readonly required: readonly ["tags", "category", "visibility", "requiredPermissions"];
            readonly properties: {
                readonly tags: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
                readonly category: {
                    readonly type: "string";
                    readonly minLength: 1;
                };
                readonly visibility: {
                    readonly type: "string";
                    readonly enum: readonly ["public", "dao-only", "private"];
                };
                readonly requiredPermissions: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=FlowDefinition.d.ts.map