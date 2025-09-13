"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.getDatabaseStatus = getDatabaseStatus;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const logger_1 = require("./logger");
let isConnected = false;
async function connectDatabase() {
    if (isConnected) {
        logger_1.logger.debug('Database already connected');
        return;
    }
    try {
        logger_1.logger.info('Connecting to MongoDB...', { uri: config_1.config.database.uri.replace(/\/\/.*@/, '//***:***@') });
        await mongoose_1.default.connect(config_1.config.database.uri, {
            ...config_1.config.database.options,
            bufferCommands: false,
        });
        isConnected = true;
        logger_1.logger.info('Successfully connected to MongoDB');
        // Handle connection events
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.logger.error('MongoDB connection error:', error);
            isConnected = false;
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
            isConnected = false;
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB reconnected');
            isConnected = true;
        });
        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                await mongoose_1.default.connection.close();
                logger_1.logger.info('MongoDB connection closed through app termination');
                process.exit(0);
            }
            catch (error) {
                logger_1.logger.error('Error closing MongoDB connection:', error);
                process.exit(1);
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}
async function disconnectDatabase() {
    if (!isConnected) {
        return;
    }
    try {
        await mongoose_1.default.connection.close();
        isConnected = false;
        logger_1.logger.info('Disconnected from MongoDB');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
}
function getDatabaseStatus() {
    return {
        connected: isConnected && mongoose_1.default.connection.readyState === 1,
        readyState: mongoose_1.default.connection.readyState,
        host: mongoose_1.default.connection.host,
        name: mongoose_1.default.connection.name,
    };
}
//# sourceMappingURL=database.js.map