/**
 * Qflow Flow Definition Models
 *
 * Core data models for flow definitions, steps, and metadata
 */
export var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION_ERROR"] = "validation_error";
    ErrorType["EXECUTION_ERROR"] = "execution_error";
    ErrorType["NODE_FAILURE"] = "node_failure";
    ErrorType["NETWORK_ERROR"] = "network_error";
    ErrorType["PERMISSION_DENIED"] = "permission_denied";
    ErrorType["RESOURCE_EXHAUSTED"] = "resource_exhausted";
    ErrorType["TIMEOUT_ERROR"] = "timeout_error";
    ErrorType["DAO_POLICY_VIOLATION"] = "dao_policy_violation";
})(ErrorType || (ErrorType = {}));
/**
 * Flow Definition Validation Schema
 */
export const FLOW_DEFINITION_SCHEMA = {
    type: 'object',
    required: ['id', 'name', 'version', 'owner', 'steps', 'metadata'],
    properties: {
        id: {
            type: 'string',
            pattern: '^[a-zA-Z0-9_-]+$',
            minLength: 1,
            maxLength: 100
        },
        name: {
            type: 'string',
            minLength: 1,
            maxLength: 200
        },
        version: {
            type: 'string',
            pattern: '^\\d+\\.\\d+\\.\\d+$'
        },
        owner: {
            type: 'string',
            minLength: 1
        },
        description: {
            type: 'string',
            maxLength: 1000
        },
        steps: {
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                required: ['id', 'type', 'action'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^[a-zA-Z0-9_-]+$'
                    },
                    type: {
                        type: 'string',
                        enum: ['task', 'condition', 'parallel', 'event-trigger', 'module-call']
                    },
                    action: {
                        type: 'string',
                        minLength: 1
                    },
                    params: {
                        type: 'object'
                    },
                    onSuccess: {
                        type: 'string'
                    },
                    onFailure: {
                        type: 'string'
                    },
                    timeout: {
                        type: 'number',
                        minimum: 1000,
                        maximum: 3600000
                    }
                }
            }
        },
        metadata: {
            type: 'object',
            required: ['tags', 'category', 'visibility', 'requiredPermissions'],
            properties: {
                tags: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                category: {
                    type: 'string',
                    minLength: 1
                },
                visibility: {
                    type: 'string',
                    enum: ['public', 'dao-only', 'private']
                },
                requiredPermissions: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                }
            }
        }
    }
};
//# sourceMappingURL=FlowDefinition.js.map