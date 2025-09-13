export interface IdentityInfo {
    squidId: string;
    subId?: string;
    daoId?: string;
    permissions?: string[];
    reputation?: number;
    verified: boolean;
}
export declare class SquidService {
    private baseUrl;
    constructor();
    verifyIdentity(token: string): Promise<IdentityInfo | null>;
    getActiveContext(squidId: string): Promise<any>;
    updateReputation(squidId: string, action: string, value: number): Promise<boolean>;
}
//# sourceMappingURL=SquidService.d.ts.map