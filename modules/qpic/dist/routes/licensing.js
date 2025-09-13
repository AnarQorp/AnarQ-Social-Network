"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.licensingRoutes = licensingRoutes;
async function licensingRoutes(fastify) {
    // Get media licenses
    fastify.get('/media/:id/license', {
        schema: {
            description: 'Get media licenses',
            tags: ['Licensing'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            }
        }
    }, async (_request, reply) => {
        return reply.code(501).send({
            status: 'error',
            code: 'NOT_IMPLEMENTED',
            message: 'License retrieval not yet implemented',
            timestamp: new Date().toISOString()
        });
    });
    // Create media license
    fastify.post('/media/:id/license', {
        schema: {
            description: 'Create media license',
            tags: ['Licensing'],
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            }
        }
    }, async (_request, reply) => {
        return reply.code(501).send({
            status: 'error',
            code: 'NOT_IMPLEMENTED',
            message: 'License creation not yet implemented',
            timestamp: new Date().toISOString()
        });
    });
}
//# sourceMappingURL=licensing.js.map