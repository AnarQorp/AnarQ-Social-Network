"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcodingRoutes = transcodingRoutes;
async function transcodingRoutes(fastify) {
    // Start transcoding job
    fastify.post('/media/:id/transcode', {
        schema: {
            description: 'Start transcoding job',
            tags: ['Transcoding'],
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
            message: 'Transcoding not yet implemented',
            timestamp: new Date().toISOString()
        });
    });
}
//# sourceMappingURL=transcoding.js.map