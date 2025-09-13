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
exports.MediaFile = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MediaMetadataSchema = new mongoose_1.Schema({
    technical: {
        format: { type: String, required: true },
        dimensions: {
            width: Number,
            height: Number
        },
        fileSize: { type: Number, required: true },
        duration: Number,
        bitrate: Number,
        colorSpace: String,
        compression: String,
        fps: Number,
        sampleRate: Number,
        channels: Number
    },
    descriptive: {
        title: String,
        description: String,
        tags: [String],
        category: String,
        keywords: [String],
        creator: String,
        copyright: String,
        language: String
    },
    rights: {
        license: {
            type: String,
            enum: ['CC0', 'CC-BY', 'CC-BY-SA', 'CC-BY-NC', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC-ND', 'PROPRIETARY'],
            default: 'PROPRIETARY'
        },
        usage: [{
                type: String,
                enum: ['commercial', 'editorial', 'personal', 'educational', 'non-profit']
            }],
        restrictions: [String],
        attribution: {
            required: { type: Boolean, default: false },
            text: String
        }
    },
    provenance: {
        createdAt: { type: Date, default: Date.now },
        modifiedAt: { type: Date, default: Date.now },
        uploadedBy: { type: String, required: true },
        originalFilename: { type: String, required: true },
        source: String,
        processingHistory: [{
                operation: String,
                timestamp: { type: Date, default: Date.now },
                parameters: mongoose_1.Schema.Types.Mixed
            }]
    },
    extracted: {
        exif: mongoose_1.Schema.Types.Mixed,
        id3: mongoose_1.Schema.Types.Mixed,
        xmp: mongoose_1.Schema.Types.Mixed,
        iptc: mongoose_1.Schema.Types.Mixed
    }
}, { _id: false });
const MediaFormatSchema = new mongoose_1.Schema({
    format: { type: String, required: true },
    cid: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    quality: String,
    resolution: String,
    bitrate: String,
    profile: String,
    createdAt: { type: Date, default: Date.now }
}, { _id: false });
const MediaThumbnailSchema = new mongoose_1.Schema({
    size: {
        type: String,
        enum: ['small', 'medium', 'large'],
        required: true
    },
    cid: { type: String, required: true },
    url: { type: String, required: true },
    dimensions: {
        width: { type: Number, required: true },
        height: { type: Number, required: true }
    },
    format: { type: String, required: true },
    fileSize: { type: Number, required: true }
}, { _id: false });
const MediaPrivacySchema = new mongoose_1.Schema({
    profileApplied: String,
    fieldsRedacted: [String],
    riskScore: { type: Number, min: 0, max: 1, default: 0 },
    appliedAt: { type: Date, default: Date.now },
    rules: [{
            field: String,
            action: {
                type: String,
                enum: ['REDACT', 'REMOVE', 'HASH', 'ENCRYPT']
            },
            applied: Boolean
        }]
}, { _id: false });
const MediaAccessSchema = new mongoose_1.Schema({
    public: { type: Boolean, default: false },
    permissions: [String],
    downloadable: { type: Boolean, default: true },
    streamable: { type: Boolean, default: true },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
    lastAccessed: Date
}, { _id: false });
const MediaMarketplaceSchema = new mongoose_1.Schema({
    listed: { type: Boolean, default: false },
    licenseId: String,
    price: {
        amount: Number,
        currency: String
    },
    sales: {
        count: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        lastSale: Date
    },
    featured: { type: Boolean, default: false },
    rating: {
        average: Number,
        count: { type: Number, default: 0 }
    }
}, { _id: false });
const MediaFileSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    cid: { type: String, required: true, unique: true },
    filename: { type: String, required: true },
    originalFilename: { type: String, required: true },
    format: { type: String, required: true },
    size: { type: Number, required: true },
    status: {
        type: String,
        enum: ['uploading', 'processing', 'ready', 'failed', 'deleted'],
        default: 'uploading'
    },
    uploadedBy: { type: String, required: true },
    metadata: { type: MediaMetadataSchema, required: true },
    thumbnails: [MediaThumbnailSchema],
    formats: [MediaFormatSchema],
    privacy: MediaPrivacySchema,
    access: { type: MediaAccessSchema, required: true },
    marketplace: MediaMarketplaceSchema,
    ipfsHash: { type: String, required: true },
    storageProvider: {
        type: String,
        enum: ['ipfs', 'local', 'cdn'],
        default: 'ipfs'
    },
    backupCids: [String],
    processingJobs: [String],
    lastProcessed: Date,
    auditLog: [{
            action: { type: String, required: true },
            actor: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            details: mongoose_1.Schema.Types.Mixed
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes
MediaFileSchema.index({ id: 1 });
MediaFileSchema.index({ cid: 1 });
MediaFileSchema.index({ uploadedBy: 1 });
MediaFileSchema.index({ status: 1 });
MediaFileSchema.index({ 'metadata.descriptive.tags': 1 });
MediaFileSchema.index({ 'metadata.descriptive.category': 1 });
MediaFileSchema.index({ 'metadata.rights.license': 1 });
MediaFileSchema.index({ 'marketplace.listed': 1 });
MediaFileSchema.index({ createdAt: -1 });
// Text search index
MediaFileSchema.index({
    'metadata.descriptive.title': 'text',
    'metadata.descriptive.description': 'text',
    'metadata.descriptive.tags': 'text',
    'metadata.descriptive.keywords': 'text'
});
exports.MediaFile = mongoose_1.default.model('MediaFile', MediaFileSchema);
//# sourceMappingURL=MediaFile.js.map