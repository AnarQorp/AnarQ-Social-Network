"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRoutes = searchRoutes;
async function searchRoutes(fastify) {
    // Search media files
    fastify.get('/search', {
        schema: {
            description: 'Search media files',
            tags: ['Search'],
            querystring: {
                type: 'object',
                properties: {
                    q: { type: 'string' },
                    format: { type: 'string' },
                    tags: { type: 'string' },
                    category: { type: 'string' },
                    license: { type: 'string' },
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
                    sort: {
                        type: 'string',
                        enum: ['created', 'modified', 'size', 'name', 'relevance'],
                        default: 'relevance'
                    }
                }
            }
        }
    }, async (_request, reply) => {
        return reply.code(501).send({
            status: 'error',
            code: 'NOT_IMPLEMENTED',
            message: 'Media search not yet implemented',
            timestamp: new Date().toISOString()
        });
    });
}
//# sourceMappingURL=search.js.map