/**
 * sQuid Server
 * Main server entry point for the sQuid identity module
 */
declare class SquidServer {
    private app;
    private config;
    private identityService;
    private eventService;
    private storageService;
    private identityHandlers;
    private healthHandler;
    private authMiddleware;
    private rateLimitMiddleware;
    private mcpTools;
    constructor();
    private loadConfig;
    private initializeServices;
    private initializeMiddleware;
    private initializeRoutes;
    private initializeErrorHandling;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export default SquidServer;
//# sourceMappingURL=server.d.ts.map