export interface PermissionCheck {
    resource: string;
    action: string;
    context?: Record<string, any>;
}
export interface PermissionResult {
    allowed: boolean;
    reason?: string;
    conditions?: string[];
}
export declare class QonsentService {
    private baseUrl;
    constructor();
    checkPermission(squidId: string, permission: PermissionCheck, subId?: string, daoId?: string): Promise<PermissionResult>;
    grantPermission(squidId: string, resource: string, action: string, conditions?: string[], expiresAt?: Date): Promise<boolean>;
    revokePermission(squidId: string, resource: string, action: string): Promise<boolean>;
}
//# sourceMappingURL=QonsentService.d.ts.map