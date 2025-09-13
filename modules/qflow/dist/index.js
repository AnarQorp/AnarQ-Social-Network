/**
 * Qflow Serverless Automation Engine
 * Entry point and initialization
 */
import { qflowMCPTools } from './mcp/QflowMCPTools.js';
import { schemaRegistry } from './schemas/SchemaRegistry.js';
import { ecosystemIntegration } from './services/EcosystemIntegration.js';
import { bootCheck } from './core/BootCheck.js';
import { executionLedger } from './core/ExecutionLedger.js';
import { universalValidationPipeline } from './validation/UniversalValidationPipeline.js';
import { PerformanceIntegrationService } from './services/PerformanceIntegrationService.js';
import { AdaptivePerformanceService } from './services/AdaptivePerformanceService.js';
import { RealtimeDashboardService } from './services/RealtimeDashboardService.js';
import { IntelligentCachingService } from './services/IntelligentCachingService.js';
import { createProfilingSystem, defaultProfilingConfig } from './profiling/index.js';
// Initialize profiling system
export const profilingSystem = createProfilingSystem(defaultProfilingConfig);
// Initialize performance and dashboard services
export const performanceIntegrationService = new PerformanceIntegrationService();
export const adaptivePerformanceService = new AdaptivePerformanceService(performanceIntegrationService);
export const intelligentCachingService = new IntelligentCachingService({
    maxSize: 200 * 1024 * 1024, // 200MB
    maxEntries: 50000,
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    enablePredictive: true,
    enableCompression: false
});
export const realtimeDashboardService = new RealtimeDashboardService(performanceIntegrationService, adaptivePerformanceService, {
    port: parseInt(process.env.QFLOW_DASHBOARD_PORT || '9090'),
    updateInterval: 5000,
    heartbeatInterval: 30000,
    maxClients: 100,
    compressionEnabled: true
});
/**
 * Initialize Qflow module
 */
export async function initializeQflow() {
    try {
        console.log('[Qflow] 🚀 Initializing Qflow Serverless Automation Engine...');
        // Perform distributed infrastructure boot check
        const bootCheckResult = await bootCheck.performBootCheck();
        if (!bootCheckResult.success) {
            console.error('[Qflow] ❌ Boot check failed - cannot start in centralized mode');
            bootCheckResult.errors.forEach(error => console.error(`[Qflow]   ${error}`));
            throw new Error('Qflow requires distributed infrastructure (IPFS + Libp2p)');
        }
        // Initialize ecosystem services integration
        await ecosystemIntegration.initialize();
        console.log('[Qflow] ✅ Ecosystem services integration initialized');
        // Initialize schema registry (already done in constructor)
        console.log('[Qflow] ✅ Schema registry initialized with', schemaRegistry.getAllSchemas().length, 'schemas');
        // Register MCP tools
        await qflowMCPTools.registerTools();
        console.log('[Qflow] ✅ MCP tools registered successfully');
        // Initialize event emitter (already done in constructor)
        console.log('[Qflow] ✅ Event emitter initialized');
        // Initialize deprecation manager (already done in constructor)
        console.log('[Qflow] ✅ Deprecation manager initialized');
        // Initialize execution ledger
        await executionLedger.initialize();
        console.log('[Qflow] ✅ Execution ledger initialized');
        // Initialize universal validation pipeline
        await universalValidationPipeline.initialize();
        console.log('[Qflow] ✅ Universal validation pipeline initialized');
        // Initialize performance services
        await performanceIntegrationService.initialize();
        console.log('[Qflow] ✅ Performance integration service initialized');
        await adaptivePerformanceService.initialize();
        console.log('[Qflow] ✅ Adaptive performance service initialized');
        // Initialize intelligent caching service
        console.log('[Qflow] ✅ Intelligent caching service initialized');
        // Initialize profiling system
        profilingSystem.dashboard.start();
        console.log('[Qflow] ✅ Performance profiling system initialized');
        // Initialize and start real-time dashboard
        realtimeDashboardService.start();
        console.log('[Qflow] ✅ Real-time WebSocket dashboard started on port', realtimeDashboardService.getConfig().port);
        // Initialize core components
        console.log('[Qflow] ✅ Flow parser initialized');
        console.log('[Qflow] ✅ Execution engine initialized');
        console.log('[Qflow] 🎉 Qflow initialization complete!');
    }
    catch (error) {
        console.error('[Qflow] ❌ Failed to initialize Qflow:', error);
        throw error;
    }
}
/**
 * Shutdown Qflow module
 */
export async function shutdownQflow() {
    try {
        console.log('[Qflow] 🛑 Shutting down Qflow...');
        // Unregister MCP tools
        await qflowMCPTools.unregisterTools();
        console.log('[Qflow] ✅ MCP tools unregistered');
        // Shutdown universal validation pipeline
        await universalValidationPipeline.shutdown();
        console.log('[Qflow] ✅ Universal validation pipeline shutdown');
        // Shutdown execution ledger
        await executionLedger.shutdown();
        console.log('[Qflow] ✅ Execution ledger shutdown');
        // Shutdown intelligent caching service
        await intelligentCachingService.shutdown();
        console.log('[Qflow] ✅ Intelligent caching service shutdown');
        // Shutdown profiling system
        profilingSystem.dashboard.stop();
        console.log('[Qflow] ✅ Performance profiling system shutdown');
        // Shutdown real-time dashboard
        realtimeDashboardService.stop();
        console.log('[Qflow] ✅ Real-time dashboard stopped');
        // Shutdown performance services
        await adaptivePerformanceService.shutdown();
        console.log('[Qflow] ✅ Adaptive performance service shutdown');
        await performanceIntegrationService.shutdown();
        console.log('[Qflow] ✅ Performance integration service shutdown');
        // Shutdown ecosystem integration
        await ecosystemIntegration.shutdown();
        console.log('[Qflow] ✅ Ecosystem services integration shutdown');
        console.log('[Qflow] ✅ Qflow shutdown complete');
    }
    catch (error) {
        console.error('[Qflow] ❌ Error during Qflow shutdown:', error);
        throw error;
    }
}
// Export main components
export { schemaRegistry } from './schemas/SchemaRegistry.js';
export { qflowEventEmitter } from './events/EventEmitter.js';
export { qflowMCPTools } from './mcp/QflowMCPTools.js';
export { qflowDeprecationManager } from './deprecation/QflowDeprecationManager.js';
export { ecosystemIntegration } from './services/EcosystemIntegration.js';
export { flowParser } from './core/FlowParser.js';
export { executionEngine } from './core/ExecutionEngine.js';
export { bootCheck } from './core/BootCheck.js';
export { executionLedger } from './core/ExecutionLedger.js';
export { universalValidationPipeline } from './validation/UniversalValidationPipeline.js';
export { signedValidationCache } from './validation/SignedValidationCache.js';
export { qflowServer, QflowServer } from './api/QflowServer.js';
export { qflowCLI, QflowCLI } from './cli/QflowCLI.js';
export { squidIdentityService, SquidIdentityService } from './auth/SquidIdentityService.js';
export { webhookService, WebhookService } from './webhooks/WebhookService.js';
export { webhookController, WebhookController } from './webhooks/WebhookController.js';
export { externalIntegrationService, ExternalIntegrationService } from './webhooks/ExternalIntegrationService.js';
export { externalIntegrationController, ExternalIntegrationController } from './webhooks/ExternalIntegrationController.js';
// Export adaptive performance components
export { PerformanceIntegrationService } from './services/PerformanceIntegrationService.js';
export { AdaptivePerformanceService } from './services/AdaptivePerformanceService.js';
export { RealtimeDashboardService } from './services/RealtimeDashboardService.js';
export { default as EcosystemCorrelationService } from './services/EcosystemCorrelationService.js';
export { default as PredictivePerformanceService } from './services/PredictivePerformanceService.js';
export { default as FlowBurnRateService } from './services/FlowBurnRateService.js';
export { default as GracefulDegradationIntegration } from './services/GracefulDegradationIntegration.js';
export { default as ComprehensiveMetricsService } from './services/ComprehensiveMetricsService.js';
export { default as AutoScalingEngine } from './core/AutoScalingEngine.js';
export { default as ProactiveOptimizer } from './core/ProactiveOptimizer.js';
export { default as AdaptiveResponseCoordinator } from './core/AdaptiveResponseCoordinator.js';
export { createAuthMiddleware, requireAuth, requireFlowPermissions, requireFlowOwnership, optionalAuth, requireAdmin } from './auth/AuthMiddleware.js';
// Export types
export * from './models/FlowDefinition.js';
export * from './validation/SignedValidationCache.js';
// Export optimization services
export { ExecutionOptimizationService, LazyLoadingManager, ResourcePoolManager, ParallelExecutionEngine } from './optimization/index.js';
// Export profiling services
export { PerformanceProfiler, OptimizationEngine, AdvancedRegressionDetector, PerformanceDashboard, createProfilingSystem, defaultProfilingConfig } from './profiling/index.js';
// Auto-initialize if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    initializeQflow().catch(error => {
        console.error('[Qflow] ❌ Failed to initialize:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map