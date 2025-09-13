import mongoose, { Document } from 'mongoose';
export interface IMediaLicense extends Document {
    id: string;
    mediaId: string;
    type: 'exclusive' | 'non-exclusive' | 'royalty-free' | 'rights-managed' | 'creative-commons';
    status: 'active' | 'expired' | 'revoked' | 'pending';
    licensor: string;
    licensee?: string;
    usage: ('commercial' | 'editorial' | 'personal' | 'educational' | 'non-profit')[];
    territory: string;
    duration: string;
    price?: {
        amount: number;
        currency: string;
    };
    restrictions: string[];
    attribution?: {
        required: boolean;
        text?: string;
    };
    terms: {
        transferable: boolean;
        sublicensable: boolean;
        exclusive: boolean;
        revocable: boolean;
    };
    contractCid?: string;
    marketplaceListingId?: string;
    transactions: {
        type: 'purchase' | 'renewal' | 'transfer' | 'revocation';
        amount?: number;
        currency?: string;
        from?: string;
        to?: string;
        timestamp: Date;
        transactionId?: string;
    }[];
    usage_tracking: {
        downloads: number;
        views: number;
        lastUsed?: Date;
        usageReports: {
            period: string;
            usage: Record<string, number>;
            reportedAt: Date;
        }[];
    };
    createdAt: Date;
    expiresAt?: Date;
    revokedAt?: Date;
    updatedAt: Date;
}
export declare const MediaLicense: mongoose.Model<IMediaLicense, {}, {}, {}, mongoose.Document<unknown, {}, IMediaLicense, {}, {}> & IMediaLicense & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=MediaLicense.d.ts.map