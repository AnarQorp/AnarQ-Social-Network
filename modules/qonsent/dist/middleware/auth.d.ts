import { FastifyPluginAsync } from 'fastify';
declare module 'fastify' {
    interface FastifyRequest {
        identity?: {
            squidId: string;
            subId?: string;
            daoId?: string;
            verified: boolean;
        };
    }
}
declare const authMiddleware: FastifyPluginAsync;
export { authMiddleware };
declare const _default: FastifyPluginAsync;
export default _default;
//# sourceMappingURL=auth.d.ts.map