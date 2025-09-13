/**
 * Identity Service
 * Core business logic for identity management
 */
import { Identity, CreateIdentityRequest, CreateSubidentityRequest, VerificationRequest, ReputationUpdate, RequestContext, IdentityService as IIdentityService, StorageService, EventService } from '../types';
export declare class IdentityService implements IIdentityService {
    private storageService;
    private eventService;
    private config;
    constructor(storageService: StorageService, eventService: EventService, config: any);
    createIdentity(request: CreateIdentityRequest, context: RequestContext): Promise<Identity>;
    createSubidentity(parentId: string, request: CreateSubidentityRequest, context: RequestContext): Promise<Identity>;
    getIdentity(identityId: string): Promise<Identity | null>;
    updateIdentity(identityId: string, updates: Partial<Identity>, context: RequestContext): Promise<Identity>;
    deleteIdentity(identityId: string, context: RequestContext): Promise<void>;
    submitVerification(identityId: string, request: VerificationRequest, context: RequestContext): Promise<Identity>;
    updateReputation(update: ReputationUpdate): Promise<Identity>;
    getReputation(identityId: string): Promise<{
        score: number;
        level: string;
        lastUpdated: Date;
    }>;
    private generateKeyPair;
    private getGovernanceType;
    private getDefaultPrivacyLevel;
    private isKycRequired;
    private getReputationLevel;
}
//# sourceMappingURL=IdentityService.d.ts.map