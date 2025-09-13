"use strict";
/**
 * Identity Service
 * Core business logic for identity management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityService = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../types");
class IdentityService {
    constructor(storageService, eventService, config) {
        this.storageService = storageService;
        this.eventService = eventService;
        this.config = config;
    }
    async createIdentity(request, context) {
        // Generate cryptographic key pair
        const keyPair = this.generateKeyPair();
        const identity = {
            did: (0, uuid_1.v4)(),
            name: request.name,
            type: types_1.IdentityType.ROOT,
            rootId: '', // Will be set to self
            children: [],
            depth: 0,
            path: [],
            status: types_1.IdentityStatus.ACTIVE,
            verificationLevel: types_1.VerificationLevel.UNVERIFIED,
            reputation: 100, // Starting reputation
            governanceType: types_1.GovernanceType.SELF,
            privacyLevel: request.privacyLevel || types_1.PrivacyLevel.PUBLIC,
            publicKey: keyPair.publicKey,
            qindexRegistered: false,
            kyc: {
                required: false,
                submitted: false,
                approved: false
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUsed: new Date(),
            metadata: {
                ...request.metadata,
                creator: {
                    ip: context.ip,
                    userAgent: context.userAgent,
                    sessionId: context.sessionId,
                    deviceFingerprint: context.deviceFingerprint
                }
            }
        };
        // Set rootId to self for root identities
        identity.rootId = identity.did;
        identity.path = [identity.did];
        // Store the identity
        await this.storageService.storeIdentity(identity);
        // Publish identity created event
        await this.eventService.publishEvent({
            eventId: (0, uuid_1.v4)(),
            timestamp: new Date(),
            version: 'v1',
            source: 'squid',
            type: 'identity.created',
            correlationId: context.requestId,
            data: {
                identity,
                creator: {
                    ip: context.ip,
                    userAgent: context.userAgent,
                    sessionId: context.sessionId,
                    deviceFingerprint: context.deviceFingerprint
                }
            }
        });
        return identity;
    }
    async createSubidentity(parentId, request, context) {
        // Get parent identity
        const parent = await this.storageService.retrieveIdentity(parentId);
        if (!parent) {
            throw new Error('Parent identity not found');
        }
        // Validate parent can create subidentities
        if (parent.type !== types_1.IdentityType.ROOT || parent.verificationLevel === types_1.VerificationLevel.UNVERIFIED) {
            throw new Error('Parent identity must be a verified ROOT identity');
        }
        // Check subidentity limits
        if (parent.children.length >= this.config.security.maxSubidentities) {
            throw new Error(`Maximum number of subidentities (${this.config.security.maxSubidentities}) reached`);
        }
        // Validate subidentity type
        if (!Object.values(types_1.IdentityType).includes(request.type) || request.type === types_1.IdentityType.ROOT) {
            throw new Error('Invalid subidentity type');
        }
        // Generate key pair for subidentity
        const keyPair = this.generateKeyPair();
        const subidentity = {
            did: (0, uuid_1.v4)(),
            name: request.name,
            type: request.type,
            parentId: parent.did,
            rootId: parent.rootId,
            children: [],
            depth: parent.depth + 1,
            path: [...parent.path, (0, uuid_1.v4)()], // Will be updated with actual DID
            status: types_1.IdentityStatus.ACTIVE,
            verificationLevel: types_1.VerificationLevel.UNVERIFIED,
            reputation: Math.floor(parent.reputation * 0.8), // Inherit 80% of parent reputation
            governanceType: this.getGovernanceType(request.type),
            privacyLevel: request.privacyLevel || this.getDefaultPrivacyLevel(request.type),
            publicKey: keyPair.publicKey,
            qindexRegistered: false,
            kyc: {
                required: this.isKycRequired(request.type),
                submitted: false,
                approved: false,
                level: request.kycLevel
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            lastUsed: new Date(),
            metadata: {
                ...request.metadata,
                purpose: request.purpose,
                parentIdentity: parent.did,
                creator: {
                    identityId: context.identityId,
                    ip: context.ip,
                    userAgent: context.userAgent,
                    sessionId: context.sessionId,
                    deviceFingerprint: context.deviceFingerprint
                }
            }
        };
        // Update path with actual DID
        subidentity.path = [...parent.path, subidentity.did];
        // Store the subidentity
        await this.storageService.storeIdentity(subidentity);
        // Update parent's children list
        parent.children.push(subidentity.did);
        parent.updatedAt = new Date();
        await this.storageService.updateIdentity(parent.did, {
            children: parent.children,
            updatedAt: parent.updatedAt
        });
        // Publish subidentity created event
        await this.eventService.publishEvent({
            eventId: (0, uuid_1.v4)(),
            timestamp: new Date(),
            version: 'v1',
            source: 'squid',
            type: 'subidentity.created',
            correlationId: context.requestId,
            data: {
                identity: subidentity,
                parentId: parent.did,
                creator: {
                    identityId: context.identityId,
                    ip: context.ip,
                    sessionId: context.sessionId,
                    deviceFingerprint: context.deviceFingerprint
                }
            }
        });
        return subidentity;
    }
    async getIdentity(identityId) {
        return await this.storageService.retrieveIdentity(identityId);
    }
    async updateIdentity(identityId, updates, context) {
        const identity = await this.storageService.retrieveIdentity(identityId);
        if (!identity) {
            throw new Error('Identity not found');
        }
        // Validate updates
        const allowedUpdates = ['name', 'description', 'avatar', 'tags', 'privacyLevel', 'metadata'];
        const updateKeys = Object.keys(updates);
        const invalidUpdates = updateKeys.filter(key => !allowedUpdates.includes(key));
        if (invalidUpdates.length > 0) {
            throw new Error(`Invalid update fields: ${invalidUpdates.join(', ')}`);
        }
        // Apply updates
        const updatedIdentity = {
            ...identity,
            ...updates,
            updatedAt: new Date()
        };
        await this.storageService.updateIdentity(identityId, updatedIdentity);
        return updatedIdentity;
    }
    async deleteIdentity(identityId, context) {
        const identity = await this.storageService.retrieveIdentity(identityId);
        if (!identity) {
            throw new Error('Identity not found');
        }
        // Cannot delete root identity if it has children
        if (identity.type === types_1.IdentityType.ROOT && identity.children.length > 0) {
            throw new Error('Cannot delete root identity with existing subidentities');
        }
        // Mark as deleted instead of hard delete for audit purposes
        await this.storageService.updateIdentity(identityId, {
            status: types_1.IdentityStatus.DELETED,
            updatedAt: new Date()
        });
        // If this is a subidentity, remove from parent's children list
        if (identity.parentId) {
            const parent = await this.storageService.retrieveIdentity(identity.parentId);
            if (parent) {
                parent.children = parent.children.filter(childId => childId !== identityId);
                parent.updatedAt = new Date();
                await this.storageService.updateIdentity(identity.parentId, {
                    children: parent.children,
                    updatedAt: parent.updatedAt
                });
            }
        }
    }
    async submitVerification(identityId, request, context) {
        const identity = await this.storageService.retrieveIdentity(identityId);
        if (!identity) {
            throw new Error('Identity not found');
        }
        if (identity.kyc.submitted) {
            throw new Error('Verification already submitted');
        }
        // Update KYC status
        const updatedIdentity = await this.storageService.updateIdentity(identityId, {
            kyc: {
                ...identity.kyc,
                submitted: true,
                submittedAt: new Date()
            },
            status: types_1.IdentityStatus.PENDING_VERIFICATION,
            updatedAt: new Date(),
            metadata: {
                ...identity.metadata,
                verification: {
                    submittedAt: Date.now(),
                    type: request.documentType,
                    documentIdentifier: request.documentNumber.slice(-4) // Only store last 4 digits
                }
            }
        });
        return updatedIdentity;
    }
    async updateReputation(update) {
        const identity = await this.storageService.retrieveIdentity(update.identityId);
        if (!identity) {
            throw new Error('Identity not found');
        }
        const previousScore = identity.reputation;
        const newScore = Math.max(0, Math.min(1000, identity.reputation + update.delta));
        const updatedIdentity = await this.storageService.updateIdentity(update.identityId, {
            reputation: newScore,
            updatedAt: new Date()
        });
        // Publish reputation updated event
        await this.eventService.publishEvent({
            eventId: (0, uuid_1.v4)(),
            timestamp: new Date(),
            version: 'v1',
            source: 'squid',
            type: 'reputation.updated',
            data: {
                identityId: update.identityId,
                previousScore,
                newScore,
                delta: update.delta,
                reason: update.reason,
                metadata: {
                    module: update.module,
                    action: update.action,
                    details: update.metadata
                }
            }
        });
        return updatedIdentity;
    }
    async getReputation(identityId) {
        const identity = await this.storageService.retrieveIdentity(identityId);
        if (!identity) {
            throw new Error('Identity not found');
        }
        return {
            score: identity.reputation,
            level: this.getReputationLevel(identity.reputation),
            lastUpdated: identity.updatedAt
        };
    }
    generateKeyPair() {
        // In a real implementation, this would use proper cryptographic libraries
        // For now, we'll generate mock keys
        const keyId = (0, uuid_1.v4)();
        return {
            publicKey: `pub_${keyId}`,
            privateKey: `priv_${keyId}`
        };
    }
    getGovernanceType(identityType) {
        switch (identityType) {
            case types_1.IdentityType.DAO:
            case types_1.IdentityType.ENTERPRISE:
                return types_1.GovernanceType.DAO;
            case types_1.IdentityType.CONSENTIDA:
                return types_1.GovernanceType.PARENT;
            case types_1.IdentityType.AID:
                return types_1.GovernanceType.SELF;
            default:
                return types_1.GovernanceType.SELF;
        }
    }
    getDefaultPrivacyLevel(identityType) {
        switch (identityType) {
            case types_1.IdentityType.AID:
                return types_1.PrivacyLevel.ANONYMOUS;
            case types_1.IdentityType.CONSENTIDA:
                return types_1.PrivacyLevel.PRIVATE;
            case types_1.IdentityType.ENTERPRISE:
                return types_1.PrivacyLevel.DAO_ONLY;
            default:
                return types_1.PrivacyLevel.PUBLIC;
        }
    }
    isKycRequired(identityType) {
        return [types_1.IdentityType.DAO, types_1.IdentityType.ENTERPRISE, types_1.IdentityType.AID].includes(identityType);
    }
    getReputationLevel(score) {
        if (score >= 800)
            return 'AUTHORITY';
        if (score >= 600)
            return 'EXPERT';
        if (score >= 300)
            return 'TRUSTED';
        return 'NOVICE';
    }
}
exports.IdentityService = IdentityService;
//# sourceMappingURL=IdentityService.js.map