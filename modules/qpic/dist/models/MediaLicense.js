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
exports.MediaLicense = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MediaLicenseSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    mediaId: { type: String, required: true },
    type: {
        type: String,
        enum: ['exclusive', 'non-exclusive', 'royalty-free', 'rights-managed', 'creative-commons'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'revoked', 'pending'],
        default: 'pending'
    },
    licensor: { type: String, required: true },
    licensee: String,
    usage: [{
            type: String,
            enum: ['commercial', 'editorial', 'personal', 'educational', 'non-profit']
        }],
    territory: { type: String, required: true },
    duration: { type: String, required: true },
    price: {
        amount: Number,
        currency: String
    },
    restrictions: [String],
    attribution: {
        required: { type: Boolean, default: false },
        text: String
    },
    terms: {
        transferable: { type: Boolean, default: false },
        sublicensable: { type: Boolean, default: false },
        exclusive: { type: Boolean, default: false },
        revocable: { type: Boolean, default: true }
    },
    contractCid: String,
    marketplaceListingId: String,
    transactions: [{
            type: {
                type: String,
                enum: ['purchase', 'renewal', 'transfer', 'revocation'],
                required: true
            },
            amount: Number,
            currency: String,
            from: String,
            to: String,
            timestamp: { type: Date, default: Date.now },
            transactionId: String
        }],
    usage_tracking: {
        downloads: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        lastUsed: Date,
        usageReports: [{
                period: String,
                usage: mongoose_1.Schema.Types.Mixed,
                reportedAt: { type: Date, default: Date.now }
            }]
    },
    expiresAt: Date,
    revokedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes
MediaLicenseSchema.index({ id: 1 });
MediaLicenseSchema.index({ mediaId: 1 });
MediaLicenseSchema.index({ licensor: 1 });
MediaLicenseSchema.index({ licensee: 1 });
MediaLicenseSchema.index({ status: 1 });
MediaLicenseSchema.index({ type: 1 });
MediaLicenseSchema.index({ expiresAt: 1 });
MediaLicenseSchema.index({ createdAt: -1 });
// Virtual for checking if license is expired
MediaLicenseSchema.virtual('isExpired').get(function () {
    return this.expiresAt && this.expiresAt < new Date();
});
// Pre-save middleware to update status based on expiration
MediaLicenseSchema.pre('save', function (next) {
    if (this.expiresAt && this.expiresAt < new Date() && this.status === 'active') {
        this.status = 'expired';
    }
    next();
});
exports.MediaLicense = mongoose_1.default.model('MediaLicense', MediaLicenseSchema);
//# sourceMappingURL=MediaLicense.js.map