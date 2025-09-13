export interface TokenVerificationResult {
    valid: boolean;
    identity: {
        squidId: string;
        subId?: string;
        daoId?: string;
    };
    expiresAt?: string;
}
export interface SignatureVerificationParams {
    squidId: string;
    signature: string;
    timestamp: string;
    payload: string;
}
export declare class SquidClient {
    private baseUrl;
    private timeout;
    constructor();
    /**
     * Verify a JWT token with the sQuid service
     */
    verifyToken(token: string): Promise<TokenVerificationResult>;
    /**
     * Verify a signature with the sQuid service
     */
    verifySignature(params: SignatureVerificationParams): Promise<boolean>;
    /**
     * Verify that an identity exists
     */
    verifyIdentity(squidId: string): Promise<boolean>;
    /**
     * Mock token verification for development
     */
    private getMockTokenVerification;
    /**
     * Mock signature verification for development
     */
    private getMockSignatureVerification;
    /**
     * Mock identity verification for development
     */
    private getMockIdentityVerification;
}
//# sourceMappingURL=SquidClient.d.ts.map