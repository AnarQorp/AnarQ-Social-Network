import { IMediaFile } from '../models/MediaFile';
export declare class MediaService {
    constructor();
    uploadMedia(_file: Buffer, _filename: string, _uploadedBy: string, _metadata?: any, _options?: any): Promise<IMediaFile>;
    getMedia(id: string): Promise<IMediaFile | null>;
    updateMedia(id: string, updates: Partial<IMediaFile>): Promise<IMediaFile | null>;
    deleteMedia(id: string): Promise<boolean>;
    searchMedia(query: string, filters?: any, pagination?: {
        page: number;
        limit: number;
    }): Promise<{
        results: IMediaFile[];
        total: number;
        pages: number;
    }>;
}
//# sourceMappingURL=MediaService.d.ts.map