export declare function connectDatabase(): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
export declare function getDatabaseStatus(): {
    connected: boolean;
    readyState: number;
    host?: string;
    name?: string;
};
//# sourceMappingURL=database.d.ts.map