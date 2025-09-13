"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadataRoutes = metadataRoutes;
async function metadataRoutes(fastify) {
    // Get media metadata
    fastify.get('/media/:id/metadata', {
        schema: {
            description: 'Get media metadata',
            tags: ['Metadata'],
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
            message: 'Metadata retrieval not yet implemented',
            timestamp: new Date().toISOString()
        });
    });
    // Update media metadata
    fastify.put('/media/:id/metadata', {
        schema: {
            description: 'Update media metadata',
            tags: ['Metadata'],
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
            message: 'Metadata update not yet implemented',
            timestamp: new Date().toISOString()
        });
    });
}
//# sourceMappingURL=metadata.js.map