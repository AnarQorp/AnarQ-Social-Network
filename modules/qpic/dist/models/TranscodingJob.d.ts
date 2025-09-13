import mongoose, { Document } from 'mongoose';
export interface ITranscodingProfile {
    name: string;
    format: string;
    quality?: 'low' | 'medium' | 'high' | 'ultra';
    resolution?: string;
    bitrate?: string;
    options?: Record<string, any>;
}
export interface ITranscodingResult {
    profile: string;
    cid?: string;
    url?: string;
    size?: number;
    duration?: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
}
export interface ITranscodingJob extends Document {
    jobId: string;
    mediaId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    profiles: ITranscodingProfile[];
    results: ITranscodingResult[];
    requestedBy: string;
    workerId?: string;
    estimatedTime?: number;
    actualTime?: number;
    callback?: string;
    error?: {
        code: string;
        message: string;
        details?: Record<string, any>;
    };
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    updatedAt: Date;
}
export declare const TranscodingJob: mongoose.Model<ITranscodingJob, {}, {}, {}, mongoose.Document<unknown, {}, ITranscodingJob, {}, {}> & ITranscodingJob & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TranscodingJob.d.ts.map