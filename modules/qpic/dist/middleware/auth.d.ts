import { FastifyInstance } from 'fastify';
declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            squidId: string;
            subId?: string;
            daoId?: string;
            permissions?: string[];
        };
    }
}
declare function authMiddleware(fastify: FastifyInstance): Promise<void>;
export { authMiddleware };
declare const _default: typeof authMiddleware;
export default _default;
//# sourceMappingURL=auth.d.ts.map