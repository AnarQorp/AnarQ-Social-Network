"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscodingJob = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TranscodingProfileSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    format: { type: String, required: true },
    quality: {
        type: String,
        enum: ['low', 'medium', 'high', 'ultra']
    },
    resolution: String,
    bitrate: String,
    options: mongoose_1.Schema.Types.Mixed
}, { _id: false });
const TranscodingResultSchema = new mongoose_1.Schema({
    profile: { type: String, required: true },
    cid: String,
    url: String,
    size: Number,
    duration: Number,
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    error: String,
    startedAt: Date,
    completedAt: Date
}, { _id: false });
const TranscodingJobSchema = new mongoose_1.Schema({
    jobId: { type: String, required: true, unique: true },
    mediaId: { type: String, required: true },
    status: {
        type: String,
        enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'queued'
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    profiles: { type: [TranscodingProfileSchema], required: true },
    results: [TranscodingResultSchema],
    requestedBy: { type: String, required: true },
    workerId: String,
    estimatedTime: Number,
    actualTime: Number,
    callback: String,
    error: {
        code: String,
        message: String,
        details: mongoose_1.Schema.Types.Mixed
    },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    startedAt: Date,
    completedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes
TranscodingJobSchema.index({ jobId: 1 });
TranscodingJobSchema.index({ mediaId: 1 });
TranscodingJobSchema.index({ status: 1 });
TranscodingJobSchema.index({ priority: 1, createdAt: 1 });
TranscodingJobSchema.index({ requestedBy: 1 });
TranscodingJobSchema.index({ workerId: 1 });
TranscodingJobSchema.index({ createdAt: -1 });
exports.TranscodingJob = mongoose_1.default.model('TranscodingJob', TranscodingJobSchema);
//# sourceMappingURL=TranscodingJob.js.map