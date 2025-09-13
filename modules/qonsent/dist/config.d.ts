export declare const config: {
    readonly env: "development" | "production" | "test";
    readonly port: number;
    readonly host: string;
    readonly database: {
        readonly uri: string;
        readonly options: {
            readonly maxPoolSize: 10;
            readonly serverSelectionTimeoutMS: 5000;
            readonly socketTimeoutMS: 45000;
        };
    };
    readonly services: {
        readonly squid: {
            readonly baseUrl: string;
            readonly timeout: 5000;
        };
        readonly qerberos: {
            readonly baseUrl: string;
            readonly timeout: 5000;
        };
        readonly qlock: {
            readonly baseUrl: string;
            readonly timeout: 5000;
        };
        readonly qindex: {
            readonly baseUrl: string;
            readonly timeout: 5000;
        };
    };
    readonly eventBus: {
        readonly url: string;
        readonly type: "redis" | "nats" | "mock";
        readonly options: {
            readonly retryAttempts: 3;
            readonly retryDelay: 1000;
        };
    };
    readonly cache: {
        readonly url: string;
        readonly ttl: number;
        readonly options: {
            readonly retryAttempts: 3;
            readonly retryDelay: 1000;
        };
    };
    readonly security: {
        readonly jwtSecret: string;
        readonly encryptionKey: string;
        readonly denyByDefault: true;
        readonly requireSignatures: boolean;
    };
    readonly logging: {
        readonly level: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
        readonly format: "json" | "pretty";
    };
    readonly cors: {
        readonly origin: true | string[];
    };
    readonly rateLimit: {
        readonly max: number;
        readonly window: number;
    };
    readonly features: {
        readonly ucanPolicies: boolean;
        readonly delegation: boolean;
        readonly auditLogging: boolean;
        readonly realTimeRevocation: boolean;
    };
    readonly isProduction: boolean;
    readonly isDevelopment: boolean;
    readonly isTest: boolean;
};
//# sourceMappingURL=config.d.ts.map