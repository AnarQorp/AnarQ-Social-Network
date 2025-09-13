"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyModel = void 0;
const mongoose_1 = require("mongoose");
const PolicyRuleSchema = new mongoose_1.Schema({
    audience: {
        type: String,
        required: true,
        index: true,
    },
    resource: {
        type: String,
        required: true,
        index: true,
    },
    actions: {
        type: [String],
        required: true,
        validate: {
            validator: function (actions) {
                const validActions = ['read', 'write', 'delete', 'admin', 'share', 'execute', '*'];
                return actions.every(a => validActions.includes(a));
            },
            message: 'Invalid action type',
        },
    },
    conditions: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, { _id: false });
const PolicySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
        default: '',
    },
    scope: {
        type: String,
        required: true,
        enum: ['global', 'dao', 'resource'],
        index: true,
    },
    rules: {
        type: [PolicyRuleSchema],
        required: true,
        validate: {
            validator: function (rules) {
                return rules.length > 0;
            },
            message: 'Policy must have at least one rule',
        },
    },
    createdBy: {
        type: String,
        required: true,
        index: true,
    },
    updatedBy: {
        type: String,
        index: true,
    },
    expiresAt: {
        type: Date,
        index: true,
        sparse: true,
    },
    active: {
        type: Boolean,
        default: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    collection: 'policies',
});
// Compound indexes for efficient queries
PolicySchema.index({ scope: 1, active: 1, expiresAt: 1 });
PolicySchema.index({ 'rules.audience': 1, active: 1 });
PolicySchema.index({ 'rules.resource': 1, active: 1 });
PolicySchema.index({ createdBy: 1, createdAt: -1 });
// TTL index for expired policies
PolicySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.PolicyModel = (0, mongoose_1.model)('Policy', PolicySchema);
//# sourceMappingURL=Policy.js.map