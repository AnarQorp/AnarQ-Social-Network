"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRoutes = jobRoutes;
async function jobRoutes(fastify) {
    // Get job status
    fastify.get('/jobs/:jobId', {
        schema: {
            description: 'Get transcoding job status',
            tags: ['Jobs'],
            params: {
                type: 'object',
                properties: {
                    jobId: { type: 'string' }
                },
                required: ['jobId']
            }
        }
    }, async (_request, reply) => {
        return reply.code(501).send({
            status: 'error',
            code: 'NOT_IMPLEMENTED',
            message: 'Job status not yet implemented',
            timestamp: new Date().toISOString()
        });
    });
    // Cancel job
    fastify.delete('/jobs/:jobId', {
        schema: {
            description: 'Cancel transcoding job',
            tags: ['Jobs'],
            params: {
                type: 'object',
                properties: {
                    jobId: { type: 'string' }
                },
                required: ['jobId']
            }
        }
    }, async (_request, reply) => {
        return reply.code(501).send({
            status: 'error',
            code: 'NOT_IMPLEMENTED',
            message: 'Job cancellation not yet implemented',
            timestamp: new Date().toISOString()
        });
    });
}
//# sourceMappingURL=jobs.js.map