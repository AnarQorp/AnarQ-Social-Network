"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = void 0;
const app_1 = require("./app");
Object.defineProperty(exports, "buildApp", { enumerable: true, get: function () { return app_1.buildApp; } });
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const database_1 = require("./utils/database");
const eventBus_1 = require("./utils/eventBus");
async function start() {
    try {
        // Connect to database
        await (0, database_1.connectDatabase)();
        logger_1.logger.info('Database connected successfully');
        // Connect to event bus
        await (0, eventBus_1.connectEventBus)();
        logger_1.logger.info('Event bus connected successfully');
        // Build and start the application
        const app = await (0, app_1.buildApp)();
        await app.listen({
            port: config_1.config.port,
            host: config_1.config.host,
        });
        logger_1.logger.info(`Qonsent service started on ${config_1.config.host}:${config_1.config.port}`);
        logger_1.logger.info(`Environment: ${config_1.config.env}`);
        logger_1.logger.info(`API Documentation: http://${config_1.config.host}:${config_1.config.port}/docs`);
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}, shutting down gracefully`);
            try {
                await app.close();
                logger_1.logger.info('HTTP server closed');
                // Close database connection
                const mongoose = await Promise.resolve().then(() => __importStar(require('mongoose')));
                await mongoose.connection.close();
                logger_1.logger.info('Database connection closed');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Start the server if this file is run directly
if (require.main === module) {
    start();
}
//# sourceMappingURL=index.js.map