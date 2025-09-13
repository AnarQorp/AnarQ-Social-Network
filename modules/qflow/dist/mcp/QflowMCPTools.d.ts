/**
 * Qflow MCP Tools Registration
 * Auto-registers Qflow MCP tools with the MCPToolDiscoveryService
 */
export declare class QflowMCPTools {
    private mcpDiscovery;
    private registrationId?;
    constructor();
    /**
     * Register all Qflow MCP tools
     */
    registerTools(): Promise<void>;
    /**
     * Get Qflow MCP tool definitions
     */
    private getQflowTools;
    /**
     * Get Qflow capabilities
     */
    private getQflowCapabilities;
    /**
     * Get compatibility information
     */
    private getCompatibilityInfo;
    /**
     * Hash registration for validation
     */
    private hashRegistration;
    /**
     * Unregister tools (cleanup)
     */
    unregisterTools(): Promise<void>;
}
export declare const qflowMCPTools: QflowMCPTools;
//# sourceMappingURL=QflowMCPTools.d.ts.map