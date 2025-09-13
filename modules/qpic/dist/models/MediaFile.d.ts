import mongoose, { Document } from 'mongoose';
export interface IMediaMetadata {
    technical: {
        format: string;
        dimensions?: {
            width: number;
            height: number;
        };
        fileSize: number;
        duration?: number;
        bitrate?: number;
        colorSpace?: string;
        compression?: string;
        fps?: number;
        sampleRate?: number;
        channels?: number;
    };
    descriptive: {
        title?: string;
        description?: string;
        tags: string[];
        category?: string;
        keywords: string[];
        creator?: string;
        copyright?: string;
        language?: string;
    };
    rights: {
        license: 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'CC-BY-NC' | 'CC-BY-ND' | 'CC-BY-NC-SA' | 'CC-BY-NC-ND' | 'PROPRIETARY';
        usage: ('commercial' | 'editorial' | 'personal' | 'educational' | 'non-profit')[];
        restrictions: string[];
        attribution?: {
            required: boolean;
            text?: string;
        };
    };
    provenance: {
        createdAt: Date;
        modifiedAt: Date;
        uploadedBy: string;
        originalFilename: string;
        source?: string;
        processingHistory: {
            operation: string;
            timestamp: Date;
            parameters?: Record<string, any>;
        }[];
    };
    extracted?: {
        exif?: Record<string, any>;
        id3?: Record<string, any>;
        xmp?: Record<string, any>;
        iptc?: Record<string, any>;
    };
}
export interface IMediaFormat {
    format: string;
    cid: string;
    url: string;
    size: number;
    quality?: string;
    resolution?: string;
    bitrate?: string;
    profile?: string;
    createdAt: Date;
}
export interface IMediaThumbnail {
    size: 'small' | 'medium' | 'large';
    cid: string;
    url: string;
    dimensions: {
        width: number;
        height: number;
    };
    format: string;
    fileSize: number;
}
export interface IMediaPrivacy {
    profileApplied?: string;
    fieldsRedacted: string[];
    riskScore: number;
    appliedAt: Date;
    rules: {
        field: string;
        action: 'REDACT' | 'REMOVE' | 'HASH' | 'ENCRYPT';
        applied: boolean;
    }[];
}
export interface IMediaAccess {
    public: boolean;
    permissions: string[];
    downloadable: boolean;
    streamable: boolean;
    viewCount: number;
    downloadCount: number;
    lastAccessed?: Date;
}
export interface IMediaMarketplace {
    listed: boolean;
    licenseId?: string;
    price?: {
        amount: number;
        currency: string;
    };
    sales: {
        count: number;
        revenue: number;
        lastSale?: Date;
    };
    featured: boolean;
    rating?: {
        average: number;
        count: number;
    };
}
export interface IMediaFile extends Document {
    id: string;
    cid: string;
    filename: string;
    originalFilename: string;
    format: string;
    size: number;
    status: 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
    uploadedBy: string;
    metadata: IMediaMetadata;
    thumbnails: IMediaThumbnail[];
    formats: IMediaFormat[];
    privacy?: IMediaPrivacy;
    access: IMediaAccess;
    marketplace?: IMediaMarketplace;
    ipfsHash: string;
    storageProvider: 'ipfs' | 'local' | 'cdn';
    backupCids: string[];
    processingJobs: string[];
    lastProcessed?: Date;
    auditLog: {
        action: string;
        actor: string;
        timestamp: Date;
        details?: Record<string, any>;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const MediaFile: mongoose.Model<IMediaFile, {}, {}, {}, mongoose.Document<unknown, {}, IMediaFile, {}, {}> & IMediaFile & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=MediaFile.d.ts.map