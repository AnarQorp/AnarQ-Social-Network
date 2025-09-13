"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("../config");
const loggerOptions = {
    level: config_1.config.nodeEnv === 'test' ? 'silent' : 'info',
    formatters: {
        level: (label) => {
            return { level: label };
        }
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    base: {
        service: 'qpic',
        version: '2.0.0'
    }
};
if (config_1.config.nodeEnv === 'development') {
    loggerOptions.transport = {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
        }
    };
}
exports.logger = (0, pino_1.default)(loggerOptions);
//# sourceMappingURL=logger.js.map