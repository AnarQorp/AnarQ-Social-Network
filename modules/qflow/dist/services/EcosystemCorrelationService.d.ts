/**
 * Ecosystem Correlation Service for Qflow
 * Implements cross-module performance impact analysis and ecosystem health correlation
 */
import { EventEmitter } from 'events';
export interface ModuleMetrics {
    moduleId: string;
    moduleName: string;
    health: 'healthy' | 'warning' | 'critical' | 'unknown';
    metrics: {
        latency: {
            p50: number;
            p95: number;
            p99: number;
        };
        throughput: number;
        errorRate: number;
        availability: number;
        resourceUtilization: {
            cpu: number;
            memory: number;
            network: number;
        };
    };
    timestamp: number;
}
export interface CorrelationAnalysis {
    moduleA: string;
    moduleB: string;
    correlationCoefficient: number;
    correlationType: 'positive' | 'negative' | 'neutral';
    strength: 'weak' | 'moderate' | 'strong' | 'very_strong';
    confidence: number;
    impactDirection: 'a_affects_b' | 'b_affects_a' | 'bidirectional' | 'independent';
    lagTime: number;
}
export interface EcosystemHealthIndex {
    overall: number;
    components: {
        connectivity: number;
        performance: number;
        reliability: number;
        scalability: number;
    };
    criticalPaths: Array<{
        path: string[];
        healthScore: number;
        bottlenecks: string[];
    }>;
    timestamp: number;
}
export interface PerformancePrediction {
    targetModule: string;
    predictedMetrics: {
        latency: {
            min: number;
            max: number;
            expected: number;
        };
        throughput: {
            min: number;
            max: number;
            expected: number;
        };
        errorRate: {
            min: number;
            max: number;
            expected: number;
        };
    };
    confidence: number;
    timeHorizon: number;
    basedOnModules: string[];
    assumptions: string[];
}
export declare class EcosystemCorrelationService extends EventEmitter {
    private moduleMetrics;
    private correlationMatrix;
    private ecosystemTopology;
    private healthHistory;
    private predictionModels;
    private config;
    constructor(options?: any);
    /**
     * Update metrics for a specific module
     */
    updateModuleMetrics(moduleMetrics: ModuleMetrics): void;
    /**
     * Get correlation analysis between two modules
     */
    getModuleCorrelation(moduleA: string, moduleB: string): CorrelationAnalysis | null;
    /**
     * Get all correlations for a specific module
     */
    getModuleCorrelations(moduleId: string): CorrelationAnalysis[];
    /**
     * Get ecosystem health index
     */
    getEcosystemHealthIndex(): EcosystemHealthIndex;
    /**
     * Get performance impact analysis
     */
    getPerformanceImpactAnalysis(sourceModule: string): {
        directImpacts: Array<{
            targetModule: string;
            impactScore: number;
            impactType: 'positive' | 'negative';
            metrics: string[];
        }>;
        cascadingEffects: Array<{
            path: string[];
            totalImpact: number;
            criticalNodes: string[];
        }>;
        recommendations: string[];
    };
    /**
     * Generate performance predictions
     */
    generatePerformancePredictions(targetModule: string, timeHorizon?: number): PerformancePrediction;
    /**
     * Get ecosystem performance trends
     */
    getEcosystemTrends(timeRange?: number): {
        overallTrend: 'improving' | 'stable' | 'degrading';
        modulesTrends: Record<string, {
            trend: 'improving' | 'stable' | 'degrading';
            changeRate: number;
            confidence: number;
        }>;
        criticalCorrelations: CorrelationAnalysis[];
        emergingIssues: Array<{
            type: string;
            modules: string[];
            severity: 'low' | 'medium' | 'high' | 'critical';
            description: string;
        }>;
    };
    /**
     * Get Qflow-specific ecosystem correlation
     */
    getQflowEcosystemCorrelation(): {
        qflowHealth: string;
        ecosystemHealth: string;
        correlations: Array<{
            module: string;
            correlation: number;
            impact: 'positive' | 'negative' | 'neutral';
            criticalPath: boolean;
        }>;
        performanceGates: Array<{
            gate: string;
            status: 'pass' | 'fail' | 'warning';
            ecosystemImpact: number;
        }>;
        recommendations: string[];
    };
    /**
     * Private methods
     */
    private initializeEcosystemTopology;
    private startCorrelationAnalysis;
    private updateCorrelationMatrix;
    private calculateCorrelation;
    private calculatePearsonCorrelation;
    private categorizeCorrelationStrength;
    private calculateLagTime;
    private determineImpactDirection;
    private calculateEcosystemHealth;
    private calculateConnectivityScore;
    private calculatePerformanceScore;
    private calculateReliabilityScore;
    private calculateScalabilityScore;
    private identifyCriticalPaths;
    private findPathsFromModule;
    private calculatePathHealth;
    private identifyBottlenecks;
    private getRecentMetrics;
    private storeCorrelation;
    private reverseImpactDirection;
    private getTotalCorrelations;
    private mapHealthToScore;
    private mapHealthScore;
    private calculateDirectImpacts;
    private calculateCascadingEffects;
    private calculatePathImpact;
    private generateImpactRecommendations;
    private getModuleDependencies;
    private calculatePredictions;
    private predictMetric;
    private calculateTrend;
    private combineTrends;
    private calculateChangeRate;
    private identifyCriticalCorrelations;
    private detectEmergingIssues;
    private detectCascadeRisk;
    private evaluateQflowPerformanceGates;
    private generateQflowRecommendations;
    private isInCriticalPath;
    private updatePredictionModels;
}
export default EcosystemCorrelationService;
//# sourceMappingURL=EcosystemCorrelationService.d.ts.map