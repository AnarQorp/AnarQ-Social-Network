/**
 * MCP Tools for sQuid Module
 * Implements squid.verifyIdentity and squid.activeContext tools
 */
import { VerifyIdentityInput, VerifyIdentityOutput, ActiveContextInput, ActiveContextOutput, IdentityService } from '../types';
export declare class SquidMCPTools {
    private identityService;
    constructor(identityService: IdentityService);
    /**
     * Verify identity ownership and authenticity
     */
    verifyIdentity(input: VerifyIdentityInput): Promise<VerifyIdentityOutput>;
    /**
     * Get active identity context for current session
     */
    activeContext(input: ActiveContextInput): Promise<ActiveContextOutput>;
    private verifySignature;
    private createMockSignature;
    private getSessionInfo;
    private getIdentityPermissions;
}
//# sourceMappingURL=tools.d.ts.map