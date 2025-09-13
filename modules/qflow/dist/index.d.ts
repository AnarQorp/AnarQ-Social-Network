/**
 * Qflow Serverless Automation Engine
 * Entry point and initialization
 */
import { PerformanceIntegrationService } from './services/PerformanceIntegrationService.js';
import { AdaptivePerformanceService } from './services/AdaptivePerformanceService.js';
import { RealtimeDashboardService } from './services/RealtimeDashboardService.js';
import { IntelligentCachingService } from './services/IntelligentCachingService.js';
export declare const profilingSystem: {
    profiler: any;
    regressionDetector: any;
    optimizationEngine: any;
    dashboard: any;
};
export declare const performanceIntegrationService: PerformanceIntegrationService;
export declare const adaptivePerformanceService: AdaptivePerformanceService;
export declare const intelligentCachingService: IntelligentCachingService;
export declare const realtimeDashboardService: RealtimeDashboardService;
/**
 * Initialize Qflow module
 */
export declare function initializeQflow(): Promise<void>;
/**
 * Shutdown Qflow module
 */
export declare function shutdownQflow(): Promise<void>;
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
export * from './models/FlowDefinition.js';
export type { ValidationRequest, ValidationContext, PipelineResult, ValidationLayer, ValidationResult } from './validation/UniversalValidationPipeline.js';
export * from './validation/SignedValidationCache.js';
export type { QflowServerConfig, ApiResponse, FlowCreateRequest, FlowUpdateRequest, ExecutionStartRequest } from './api/QflowServer.js';
export type { CLIConfig } from './cli/QflowCLI.js';
export type { SquidIdentity, IdentityToken, IdentityValidationResult, SubIdentitySignature } from './auth/SquidIdentityService.js';
export type { AuthOptions } from './auth/AuthMiddleware.js';
export type { WebhookEvent, WebhookConfig, WebhookValidationResult, ProcessedWebhookEvent, ExternalEventSchema } from './webhooks/WebhookService.js';
export type { WebhookCreateRequest, WebhookUpdateRequest } from './webhooks/WebhookController.js';
export type { ExternalSystemConfig, IntegrationTemplate } from './webhooks/ExternalIntegrationService.js';
export type { ExternalSystemCreateRequest, ExternalCallRequest } from './webhooks/ExternalIntegrationController.js';
export type { PerformanceMetrics, PerformanceGate, AdaptiveResponse } from './services/PerformanceIntegrationService.js';
export type { ScalingPolicy, LoadRedirectionRule, FlowPausingPolicy } from './services/AdaptivePerformanceService.js';
export type { DashboardClient, MetricStream, AlertRule } from './services/RealtimeDashboardService.js';
export type { ModuleMetrics, CorrelationAnalysis, EcosystemHealthIndex, PerformancePrediction } from './services/EcosystemCorrelationService.js';
export type { PredictionModel, PerformanceForecast, AnomalyPrediction, CapacityForecast } from './services/PredictivePerformanceService.js';
export type { FlowPriority, BurnRateMetrics, FlowCostAnalysis, CostControlPolicy, GracefulDegradationLevel } from './services/FlowBurnRateService.js';
export type { DegradationLadder, DegradationLevel, QflowDegradationActions, EcosystemDegradationActions } from './services/GracefulDegradationIntegration.js';
export type { MetricPoint, MetricSeries, PercentileMetrics, ErrorBudgetMetrics, CacheMetrics, ThroughputMetrics, FlowExecutionMetrics, ValidationPipelineMetrics } from './services/ComprehensiveMetricsService.js';
export type { ScalingTrigger, LoadRedirectionPolicy, FlowPausingPolicy as FlowPausingPolicyType } from './core/AutoScalingEngine.js';
export type { OptimizationRule, CacheOptimization, ConnectionPoolOptimization, ValidationOptimization } from './core/ProactiveOptimizer.js';
export type { AdaptiveResponseConfig, SystemState } from './core/AdaptiveResponseCoordinator.js';
export { ExecutionOptimizationService, LazyLoadingManager, ResourcePoolManager, ParallelExecutionEngine } from './optimization/index.js';
export type { OptimizationConfig, ParallelExecutionGroup, LazyLoadableComponent, OptimizationMetrics, LazyLoadConfig, ComponentMetadata, LoadingStrategy, CacheEntry, PoolConfig, ResourceHealth, PoolStats, ResourceFactory, ParallelExecutionConfig, ExecutionGroup, StepExecution, ExecutionPlan, ExecutionResult } from './optimization/index.js';
export { PerformanceProfiler, OptimizationEngine, AdvancedRegressionDetector, PerformanceDashboard, createProfilingSystem, defaultProfilingConfig } from './profiling/index.js';
export type { ProfilerConfig, PerformanceThresholds, ExecutionTrace, StepTrace, Bottleneck, PerformanceBaseline, FlowPerformanceAnalysis, PerformanceTrend, OptimizationRecommendation, RegressionDetector, OptimizationConfig as ProfilingOptimizationConfig, OptimizationResult, PerformanceMetrics as ProfilingPerformanceMetrics, OptimizationStrategy, RegressionConfig, RegressionAlert, StatisticalAnalysis, AnomalyDetectionResult, DashboardConfig, AlertThresholds, DashboardMetrics, SystemMetrics, FlowMetrics, DashboardAlert, PerformanceTrends, TrendData, DataPoint } from './profiling/index.js';
//# sourceMappingURL=index.d.ts.map