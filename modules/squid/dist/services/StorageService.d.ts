/**
 * Storage Service
 * Handles identity data persistence and retrieval
 */
import { Identity, StorageService as IStorageService } from '../types';
export declare class StorageService implements IStorageService {
    private mockMode;
    private databaseUrl;
    private mockStorage;
    constructor(config: any);
    storeIdentity(identity: Identity): Promise<string>;
    retrieveIdentity(identityId: string): Promise<Identity | null>;
    updateIdentity(identityId: string, updates: Partial<Identity>): Promise<Identity>;
    deleteIdentity(identityId: string): Promise<void>;
    findIdentitiesByParent(parentId: string): Promise<Identity[]>;
    findIdentitiesByRoot(rootId: string): Promise<Identity[]>;
    initializeMockData(): Promise<void>;
    private storeInDatabase;
    private retrieveFromDatabase;
    private updateInDatabase;
    private deleteFromDatabase;
    private findInDatabase;
}
//# sourceMappingURL=StorageService.d.ts.map