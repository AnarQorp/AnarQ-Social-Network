"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const connection_1 = require("./database/connection");
const redis_1 = require("./database/redis");
async function start() {
    try {
        // Connect to databases
        await (0, connection_1.connectDatabase)();
        await (0, redis_1.connectRedis)();
        // Create and start server
        const server = await (0, server_1.createServer)();
        await server.listen({
            port: config_1.config.port,
            host: '0.0.0.0'
        });
        logger_1.logger.info(`QpiC server started on port ${config_1.config.port}`);
        logger_1.logger.info(`Environment: ${config_1.config.nodeEnv}`);
        logger_1.logger.info(`API Documentation: http://localhost:${config_1.config.port}/docs`);
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', async () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Start the server
start();
//# sourceMappingURL=index.js.map