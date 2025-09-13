/**
 * Ecosystem Correlation Service for Qflow
 * Implements cross-module performance impact analysis and ecosystem health correlation
 */
import { EventEmitter } from 'events';
export class EcosystemCorrelationService extends EventEmitter {
    moduleMetrics;
    correlationMatrix;
    ecosystemTopology; // module -> dependencies
    healthHistory;
    predictionModels;
    config;
    constructor(options = {}) {
        super();
        this.moduleMetrics = new Map();
        this.correlationMatrix = new Map();
        this.ecosystemTopology = new Map();
        this.healthHistory = [];
        this.predictionModels = new Map();
        this.config = {
            metricsRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
            correlationWindowSize: 60 * 60 * 1000, // 1 hour
            minDataPointsForCorrelation: 30,
            predictionHorizon: 30 * 60 * 1000, // 30 minutes
            updateInterval: 60000, // 1 minute
            ...options
        };
        this.initializeEcosystemTopology();
        this.startCorrelationAnalysis();
    }
    /**
     * Update metrics for a specific module
     */
    updateModuleMetrics(moduleMetrics) {
        const moduleId = moduleMetrics.moduleId;
        if (!this.moduleMetrics.has(moduleId)) {
            this.moduleMetrics.set(moduleId, []);
        }
        const metrics = this.moduleMetrics.get(moduleId);
        metrics.push(moduleMetrics);
        // Clean up old metrics
        const cutoff = Date.now() - this.config.metricsRetentionPeriod;
        const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);
        this.moduleMetrics.set(moduleId, filteredMetrics);
        this.emit('module_metrics_updated', { moduleId, metricsCount: filteredMetrics.length });
    }
    /**
     * Get correlation analysis between two modules
     */
    getModuleCorrelation(moduleA, moduleB) {
        const correlations = this.correlationMatrix.get(moduleA);
        return correlations?.get(moduleB) || null;
    }
    /**
     * Get all correlations for a specific module
     */
    getModuleCorrelations(moduleId) {
        const correlations = this.correlationMatrix.get(moduleId);
        if (!correlations)
            return [];
        return Array.from(correlations.values());
    }
    /**
     * Get ecosystem health index
     */
    getEcosystemHealthIndex() {
        const currentHealth = this.calculateEcosystemHealth();
        // Store in history
        this.healthHistory.push(currentHealth);
        // Keep only recent history
        const cutoff = Date.now() - this.config.metricsRetentionPeriod;
        this.healthHistory = this.healthHistory.filter(h => h.timestamp > cutoff);
        return currentHealth;
    }
    /**
     * Get performance impact analysis
     */
    getPerformanceImpactAnalysis(sourceModule) {
        const directImpacts = this.calculateDirectImpacts(sourceModule);
        const cascadingEffects = this.calculateCascadingEffects(sourceModule);
        const recommendations = this.generateImpactRecommendations(sourceModule, directImpacts, cascadingEffects);
        return {
            directImpacts,
            cascadingEffects,
            recommendations
        };
    }
    /**
     * Generate performance predictions
     */
    generatePerformancePredictions(targetModule, timeHorizon) {
        const horizon = timeHorizon || this.config.predictionHorizon;
        const dependencies = this.getModuleDependencies(targetModule);
        const correlations = this.getModuleCorrelations(targetModule);
        // Get current metrics for dependent modules
        const dependentMetrics = dependencies.map(dep => {
            const metrics = this.moduleMetrics.get(dep);
            return metrics ? metrics[metrics.length - 1] : null;
        }).filter(m => m !== null);
        // Calculate predictions based on correlations and current state
        const prediction = this.calculatePredictions(targetModule, dependentMetrics, correlations, horizon);
        this.emit('performance_prediction_generated', {
            targetModule,
            prediction,
            timeHorizon: horizon
        });
        return prediction;
    }
    /**
     * Get ecosystem performance trends
     */
    getEcosystemTrends(timeRange = 3600000) {
        const cutoff = Date.now() - timeRange;
        // Calculate overall trend
        const recentHealth = this.healthHistory.filter(h => h.timestamp > cutoff);
        const overallTrend = this.calculateTrend(recentHealth.map(h => h.overall));
        // Calculate module trends
        const modulesTrends = {};
        for (const [moduleId, metrics] of this.moduleMetrics) {
            const recentMetrics = metrics.filter(m => m.timestamp > cutoff);
            if (recentMetrics.length >= 5) {
                const latencyTrend = this.calculateTrend(recentMetrics.map(m => m.metrics.latency.p95));
                const throughputTrend = this.calculateTrend(recentMetrics.map(m => m.metrics.throughput));
                modulesTrends[moduleId] = {
                    trend: this.combineTrends([latencyTrend, throughputTrend]),
                    changeRate: this.calculateChangeRate(recentMetrics),
                    confidence: Math.min(recentMetrics.length / 30, 1) // Confidence based on data points
                };
            }
        }
        // Identify critical correlations
        const criticalCorrelations = this.identifyCriticalCorrelations();
        // Detect emerging issues
        const emergingIssues = this.detectEmergingIssues(timeRange);
        return {
            overallTrend,
            modulesTrends,
            criticalCorrelations,
            emergingIssues
        };
    }
    /**
     * Get Qflow-specific ecosystem correlation
     */
    getQflowEcosystemCorrelation() {
        const qflowMetrics = this.moduleMetrics.get('qflow');
        const qflowHealth = qflowMetrics && qflowMetrics.length > 0
            ? qflowMetrics[qflowMetrics.length - 1].health
            : 'unknown';
        const ecosystemHealth = this.getEcosystemHealthIndex();
        const qflowCorrelations = this.getModuleCorrelations('qflow');
        const correlations = qflowCorrelations.map(corr => ({
            module: corr.moduleB,
            correlation: corr.correlationCoefficient,
            impact: corr.correlationType,
            criticalPath: this.isInCriticalPath('qflow', corr.moduleB)
        }));
        const performanceGates = this.evaluateQflowPerformanceGates();
        const recommendations = this.generateQflowRecommendations(correlations, performanceGates);
        return {
            qflowHealth,
            ecosystemHealth: this.mapHealthScore(ecosystemHealth.overall),
            correlations,
            performanceGates,
            recommendations
        };
    }
    /**
     * Private methods
     */
    initializeEcosystemTopology() {
        // Define ecosystem module dependencies
        this.ecosystemTopology.set('qflow', ['qindex', 'qonsent', 'qerberos', 'qlock', 'qnet']);
        this.ecosystemTopology.set('qindex', ['qlock', 'qnet']);
        this.ecosystemTopology.set('qonsent', ['qlock', 'qindex']);
        this.ecosystemTopology.set('qerberos', ['qlock', 'qindex', 'qonsent']);
        this.ecosystemTopology.set('qlock', ['qnet']);
        this.ecosystemTopology.set('qwallet', ['qlock', 'qindex', 'qonsent']);
        this.ecosystemTopology.set('qmarket', ['qwallet', 'qindex', 'qerberos']);
        this.ecosystemTopology.set('qmail', ['qwallet', 'qlock']);
        this.ecosystemTopology.set('qdrive', ['qlock', 'qindex']);
        this.ecosystemTopology.set('qpic', ['qdrive', 'qlock']);
        this.ecosystemTopology.set('qchat', ['qwallet', 'qlock']);
        this.ecosystemTopology.set('dao', ['qwallet', 'qerberos', 'qindex']);
        this.ecosystemTopology.set('squid', ['qlock', 'qindex']);
    }
    startCorrelationAnalysis() {
        setInterval(() => {
            this.updateCorrelationMatrix();
            this.updatePredictionModels();
        }, this.config.updateInterval);
    }
    updateCorrelationMatrix() {
        const modules = Array.from(this.moduleMetrics.keys());
        for (let i = 0; i < modules.length; i++) {
            for (let j = i + 1; j < modules.length; j++) {
                const moduleA = modules[i];
                const moduleB = modules[j];
                const correlation = this.calculateCorrelation(moduleA, moduleB);
                if (correlation) {
                    // Store bidirectional correlations
                    this.storeCorrelation(moduleA, moduleB, correlation);
                    this.storeCorrelation(moduleB, moduleA, {
                        ...correlation,
                        moduleA: moduleB,
                        moduleB: moduleA,
                        impactDirection: this.reverseImpactDirection(correlation.impactDirection)
                    });
                }
            }
        }
        this.emit('correlation_matrix_updated', {
            moduleCount: modules.length,
            correlationCount: this.getTotalCorrelations()
        });
    }
    calculateCorrelation(moduleA, moduleB) {
        const metricsA = this.getRecentMetrics(moduleA);
        const metricsB = this.getRecentMetrics(moduleB);
        if (metricsA.length < this.config.minDataPointsForCorrelation ||
            metricsB.length < this.config.minDataPointsForCorrelation) {
            return null;
        }
        // Calculate correlation for different metrics
        const latencyCorr = this.calculatePearsonCorrelation(metricsA.map(m => m.metrics.latency.p95), metricsB.map(m => m.metrics.latency.p95));
        const throughputCorr = this.calculatePearsonCorrelation(metricsA.map(m => m.metrics.throughput), metricsB.map(m => m.metrics.throughput));
        const errorRateCorr = this.calculatePearsonCorrelation(metricsA.map(m => m.metrics.errorRate), metricsB.map(m => m.metrics.errorRate));
        // Combine correlations (weighted average)
        const combinedCorrelation = (latencyCorr * 0.4 + throughputCorr * 0.4 + errorRateCorr * 0.2);
        const strength = this.categorizeCorrelationStrength(Math.abs(combinedCorrelation));
        const correlationType = combinedCorrelation > 0.1 ? 'positive' :
            combinedCorrelation < -0.1 ? 'negative' : 'neutral';
        // Calculate lag time (simplified)
        const lagTime = this.calculateLagTime(metricsA, metricsB);
        // Determine impact direction based on topology and correlation
        const impactDirection = this.determineImpactDirection(moduleA, moduleB, combinedCorrelation);
        return {
            moduleA,
            moduleB,
            correlationCoefficient: combinedCorrelation,
            correlationType,
            strength,
            confidence: Math.min(metricsA.length / 100, 1), // Confidence based on sample size
            impactDirection,
            lagTime
        };
    }
    calculatePearsonCorrelation(x, y) {
        const n = Math.min(x.length, y.length);
        if (n < 2)
            return 0;
        const sumX = x.slice(0, n).reduce((a, b) => a + b, 0);
        const sumY = y.slice(0, n).reduce((a, b) => a + b, 0);
        const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    categorizeCorrelationStrength(correlation) {
        if (correlation >= 0.8)
            return 'very_strong';
        if (correlation >= 0.6)
            return 'strong';
        if (correlation >= 0.3)
            return 'moderate';
        return 'weak';
    }
    calculateLagTime(metricsA, metricsB) {
        // Simplified lag calculation - would use cross-correlation in production
        return Math.random() * 5000; // Mock: 0-5 seconds
    }
    determineImpactDirection(moduleA, moduleB, correlation) {
        const depsA = this.ecosystemTopology.get(moduleA) || [];
        const depsB = this.ecosystemTopology.get(moduleB) || [];
        if (depsA.includes(moduleB)) {
            return 'b_affects_a'; // B is dependency of A
        }
        else if (depsB.includes(moduleA)) {
            return 'a_affects_b'; // A is dependency of B
        }
        else if (Math.abs(correlation) > 0.7) {
            return 'bidirectional'; // Strong correlation suggests bidirectional
        }
        else {
            return 'independent';
        }
    }
    calculateEcosystemHealth() {
        const modules = Array.from(this.moduleMetrics.keys());
        const currentTime = Date.now();
        // Calculate component scores
        const connectivity = this.calculateConnectivityScore();
        const performance = this.calculatePerformanceScore();
        const reliability = this.calculateReliabilityScore();
        const scalability = this.calculateScalabilityScore();
        // Overall health is weighted average
        const overall = (connectivity * 0.2 + performance * 0.4 + reliability * 0.3 + scalability * 0.1);
        // Identify critical paths
        const criticalPaths = this.identifyCriticalPaths();
        return {
            overall,
            components: {
                connectivity,
                performance,
                reliability,
                scalability
            },
            criticalPaths,
            timestamp: currentTime
        };
    }
    calculateConnectivityScore() {
        // Score based on module availability and communication health
        const modules = Array.from(this.moduleMetrics.keys());
        let totalScore = 0;
        let moduleCount = 0;
        for (const moduleId of modules) {
            const metrics = this.getRecentMetrics(moduleId, 1);
            if (metrics.length > 0) {
                const availability = metrics[0].metrics.availability;
                totalScore += availability;
                moduleCount++;
            }
        }
        return moduleCount > 0 ? totalScore / moduleCount : 0;
    }
    calculatePerformanceScore() {
        // Score based on latency and throughput across modules
        const modules = Array.from(this.moduleMetrics.keys());
        let totalScore = 0;
        let moduleCount = 0;
        for (const moduleId of modules) {
            const metrics = this.getRecentMetrics(moduleId, 1);
            if (metrics.length > 0) {
                const latencyScore = Math.max(0, 1 - (metrics[0].metrics.latency.p95 / 5000)); // Normalize to 5s max
                const throughputScore = Math.min(1, metrics[0].metrics.throughput / 100); // Normalize to 100 RPS max
                const moduleScore = (latencyScore + throughputScore) / 2;
                totalScore += moduleScore;
                moduleCount++;
            }
        }
        return moduleCount > 0 ? totalScore / moduleCount : 0;
    }
    calculateReliabilityScore() {
        // Score based on error rates and stability
        const modules = Array.from(this.moduleMetrics.keys());
        let totalScore = 0;
        let moduleCount = 0;
        for (const moduleId of modules) {
            const metrics = this.getRecentMetrics(moduleId, 1);
            if (metrics.length > 0) {
                const errorScore = Math.max(0, 1 - (metrics[0].metrics.errorRate / 0.1)); // Normalize to 10% max error rate
                totalScore += errorScore;
                moduleCount++;
            }
        }
        return moduleCount > 0 ? totalScore / moduleCount : 0;
    }
    calculateScalabilityScore() {
        // Score based on resource utilization and scaling capacity
        const modules = Array.from(this.moduleMetrics.keys());
        let totalScore = 0;
        let moduleCount = 0;
        for (const moduleId of modules) {
            const metrics = this.getRecentMetrics(moduleId, 1);
            if (metrics.length > 0) {
                const cpuScore = Math.max(0, 1 - metrics[0].metrics.resourceUtilization.cpu);
                const memoryScore = Math.max(0, 1 - metrics[0].metrics.resourceUtilization.memory);
                const moduleScore = (cpuScore + memoryScore) / 2;
                totalScore += moduleScore;
                moduleCount++;
            }
        }
        return moduleCount > 0 ? totalScore / moduleCount : 0;
    }
    identifyCriticalPaths() {
        const criticalPaths = [];
        // Identify paths from core modules (like qflow) to leaf modules
        const coreModules = ['qflow', 'qindex', 'qlock'];
        for (const coreModule of coreModules) {
            const paths = this.findPathsFromModule(coreModule, 3); // Max depth 3
            for (const path of paths) {
                const healthScore = this.calculatePathHealth(path);
                const bottlenecks = this.identifyBottlenecks(path);
                criticalPaths.push({
                    path,
                    healthScore,
                    bottlenecks
                });
            }
        }
        return criticalPaths.sort((a, b) => a.healthScore - b.healthScore).slice(0, 5); // Top 5 critical paths
    }
    findPathsFromModule(startModule, maxDepth) {
        const paths = [];
        const visited = new Set();
        const dfs = (currentModule, currentPath, depth) => {
            if (depth >= maxDepth || visited.has(currentModule)) {
                return;
            }
            visited.add(currentModule);
            currentPath.push(currentModule);
            const dependencies = this.ecosystemTopology.get(currentModule) || [];
            if (dependencies.length === 0 || depth === maxDepth - 1) {
                // Leaf node or max depth reached
                paths.push([...currentPath]);
            }
            else {
                for (const dep of dependencies) {
                    dfs(dep, [...currentPath], depth + 1);
                }
            }
            visited.delete(currentModule);
        };
        dfs(startModule, [], 0);
        return paths;
    }
    calculatePathHealth(path) {
        let totalHealth = 0;
        let moduleCount = 0;
        for (const moduleId of path) {
            const metrics = this.getRecentMetrics(moduleId, 1);
            if (metrics.length > 0) {
                const health = this.mapHealthToScore(metrics[0].health);
                totalHealth += health;
                moduleCount++;
            }
        }
        return moduleCount > 0 ? totalHealth / moduleCount : 0;
    }
    identifyBottlenecks(path) {
        const bottlenecks = [];
        for (const moduleId of path) {
            const metrics = this.getRecentMetrics(moduleId, 1);
            if (metrics.length > 0) {
                const m = metrics[0].metrics;
                // Check for bottleneck conditions
                if (m.latency.p95 > 2000 || // High latency
                    m.errorRate > 0.05 || // High error rate
                    m.resourceUtilization.cpu > 0.9 || // High CPU
                    m.resourceUtilization.memory > 0.9) { // High memory
                    bottlenecks.push(moduleId);
                }
            }
        }
        return bottlenecks;
    }
    getRecentMetrics(moduleId, count) {
        const metrics = this.moduleMetrics.get(moduleId) || [];
        const cutoff = Date.now() - this.config.correlationWindowSize;
        const recentMetrics = metrics.filter(m => m.timestamp > cutoff);
        return count ? recentMetrics.slice(-count) : recentMetrics;
    }
    storeCorrelation(moduleA, moduleB, correlation) {
        if (!this.correlationMatrix.has(moduleA)) {
            this.correlationMatrix.set(moduleA, new Map());
        }
        this.correlationMatrix.get(moduleA).set(moduleB, correlation);
    }
    reverseImpactDirection(direction) {
        switch (direction) {
            case 'a_affects_b': return 'b_affects_a';
            case 'b_affects_a': return 'a_affects_b';
            default: return direction;
        }
    }
    getTotalCorrelations() {
        let total = 0;
        for (const correlations of this.correlationMatrix.values()) {
            total += correlations.size;
        }
        return total;
    }
    mapHealthToScore(health) {
        switch (health) {
            case 'healthy': return 1.0;
            case 'warning': return 0.7;
            case 'critical': return 0.3;
            default: return 0.5;
        }
    }
    mapHealthScore(score) {
        if (score >= 0.8)
            return 'healthy';
        if (score >= 0.6)
            return 'warning';
        if (score >= 0.3)
            return 'critical';
        return 'unknown';
    }
    calculateDirectImpacts(sourceModule) {
        const correlations = this.getModuleCorrelations(sourceModule);
        return correlations
            .filter(corr => corr.strength !== 'weak')
            .map(corr => ({
            targetModule: corr.moduleB,
            impactScore: Math.abs(corr.correlationCoefficient),
            impactType: corr.correlationType === 'positive' ? 'positive' : 'negative',
            metrics: ['latency', 'throughput', 'errorRate'] // Simplified
        }))
            .sort((a, b) => b.impactScore - a.impactScore);
    }
    calculateCascadingEffects(sourceModule) {
        // Simplified cascading effect calculation
        const paths = this.findPathsFromModule(sourceModule, 3);
        return paths.map(path => ({
            path,
            totalImpact: this.calculatePathImpact(path),
            criticalNodes: this.identifyBottlenecks(path)
        })).sort((a, b) => b.totalImpact - a.totalImpact);
    }
    calculatePathImpact(path) {
        let totalImpact = 1.0;
        for (let i = 0; i < path.length - 1; i++) {
            const correlation = this.getModuleCorrelation(path[i], path[i + 1]);
            if (correlation) {
                totalImpact *= Math.abs(correlation.correlationCoefficient);
            }
            else {
                totalImpact *= 0.5; // Default impact if no correlation data
            }
        }
        return totalImpact;
    }
    generateImpactRecommendations(sourceModule, directImpacts, cascadingEffects) {
        const recommendations = [];
        if (directImpacts.length > 0) {
            const highImpact = directImpacts.filter(impact => impact.impactScore > 0.7);
            if (highImpact.length > 0) {
                recommendations.push(`Monitor ${sourceModule} closely as it has high impact on ${highImpact.length} modules`);
            }
        }
        if (cascadingEffects.length > 0) {
            const criticalCascades = cascadingEffects.filter(effect => effect.totalImpact > 0.5);
            if (criticalCascades.length > 0) {
                recommendations.push(`Performance issues in ${sourceModule} may cascade through ${criticalCascades.length} critical paths`);
            }
        }
        return recommendations;
    }
    getModuleDependencies(moduleId) {
        return this.ecosystemTopology.get(moduleId) || [];
    }
    calculatePredictions(targetModule, dependentMetrics, correlations, horizon) {
        // Simplified prediction model
        const currentMetrics = this.getRecentMetrics(targetModule, 1)[0];
        if (!currentMetrics) {
            return {
                targetModule,
                predictedMetrics: {
                    latency: { min: 0, max: 0, expected: 0 },
                    throughput: { min: 0, max: 0, expected: 0 },
                    errorRate: { min: 0, max: 0, expected: 0 }
                },
                confidence: 0,
                timeHorizon: horizon,
                basedOnModules: [],
                assumptions: ['No current metrics available']
            };
        }
        // Calculate prediction based on correlations and trends
        const latencyPrediction = this.predictMetric(currentMetrics.metrics.latency.p95, correlations, 'latency');
        const throughputPrediction = this.predictMetric(currentMetrics.metrics.throughput, correlations, 'throughput');
        const errorRatePrediction = this.predictMetric(currentMetrics.metrics.errorRate, correlations, 'errorRate');
        return {
            targetModule,
            predictedMetrics: {
                latency: latencyPrediction,
                throughput: throughputPrediction,
                errorRate: errorRatePrediction
            },
            confidence: Math.min(correlations.length / 5, 1), // Confidence based on correlation count
            timeHorizon: horizon,
            basedOnModules: correlations.map(c => c.moduleB),
            assumptions: [
                'Current correlation patterns will continue',
                'No major system changes will occur',
                'External load patterns remain similar'
            ]
        };
    }
    predictMetric(currentValue, correlations, metricType) {
        // Simplified prediction - would use more sophisticated models in production
        const variance = currentValue * 0.2; // 20% variance
        return {
            min: Math.max(0, currentValue - variance),
            max: currentValue + variance,
            expected: currentValue
        };
    }
    calculateTrend(values) {
        if (values.length < 2)
            return 'stable';
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const change = (secondAvg - firstAvg) / firstAvg;
        if (change > 0.05)
            return 'degrading'; // 5% worse
        if (change < -0.05)
            return 'improving'; // 5% better
        return 'stable';
    }
    combineTrends(trends) {
        const improving = trends.filter(t => t === 'improving').length;
        const degrading = trends.filter(t => t === 'degrading').length;
        if (degrading > improving)
            return 'degrading';
        if (improving > degrading)
            return 'improving';
        return 'stable';
    }
    calculateChangeRate(metrics) {
        if (metrics.length < 2)
            return 0;
        const first = metrics[0];
        const last = metrics[metrics.length - 1];
        const timeSpan = last.timestamp - first.timestamp;
        if (timeSpan === 0)
            return 0;
        const latencyChange = Math.abs(last.metrics.latency.p95 - first.metrics.latency.p95) / first.metrics.latency.p95;
        return latencyChange / (timeSpan / 3600000); // Change per hour
    }
    identifyCriticalCorrelations() {
        const allCorrelations = [];
        for (const correlations of this.correlationMatrix.values()) {
            allCorrelations.push(...correlations.values());
        }
        return allCorrelations
            .filter(corr => corr.strength === 'strong' || corr.strength === 'very_strong')
            .sort((a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient))
            .slice(0, 10); // Top 10 critical correlations
    }
    detectEmergingIssues(timeRange) {
        const issues = [];
        // Detect correlation degradation
        const degradingCorrelations = this.identifyCriticalCorrelations()
            .filter(corr => corr.correlationType === 'negative' && Math.abs(corr.correlationCoefficient) > 0.6);
        if (degradingCorrelations.length > 0) {
            issues.push({
                type: 'correlation_degradation',
                modules: degradingCorrelations.map(c => c.moduleA),
                severity: 'high',
                description: `Strong negative correlations detected between critical modules`
            });
        }
        // Detect performance cascade
        const cascadeRisk = this.detectCascadeRisk();
        if (cascadeRisk.length > 0) {
            issues.push({
                type: 'cascade_risk',
                modules: cascadeRisk,
                severity: 'medium',
                description: `Performance degradation cascade risk detected`
            });
        }
        return issues;
    }
    detectCascadeRisk() {
        const riskModules = [];
        for (const [moduleId, metrics] of this.moduleMetrics) {
            const recent = this.getRecentMetrics(moduleId, 5);
            if (recent.length >= 5) {
                const trend = this.calculateTrend(recent.map(m => m.metrics.latency.p95));
                if (trend === 'degrading') {
                    const correlations = this.getModuleCorrelations(moduleId);
                    const strongCorrelations = correlations.filter(c => c.strength === 'strong' || c.strength === 'very_strong');
                    if (strongCorrelations.length >= 2) {
                        riskModules.push(moduleId);
                    }
                }
            }
        }
        return riskModules;
    }
    evaluateQflowPerformanceGates() {
        const gates = [
            { name: 'execution_latency', threshold: 2000 },
            { name: 'validation_latency', threshold: 500 },
            { name: 'error_rate', threshold: 0.05 },
            { name: 'throughput', threshold: 10 }
        ];
        const qflowMetrics = this.getRecentMetrics('qflow', 1)[0];
        return gates.map(gate => {
            let status = 'pass';
            let ecosystemImpact = 0;
            if (qflowMetrics) {
                let value = 0;
                switch (gate.name) {
                    case 'execution_latency':
                        value = qflowMetrics.metrics.latency.p95;
                        break;
                    case 'validation_latency':
                        value = qflowMetrics.metrics.latency.p50; // Approximate validation latency
                        break;
                    case 'error_rate':
                        value = qflowMetrics.metrics.errorRate;
                        break;
                    case 'throughput':
                        value = qflowMetrics.metrics.throughput;
                        break;
                }
                if (gate.name === 'throughput') {
                    status = value < gate.threshold ? 'fail' : 'pass';
                }
                else {
                    status = value > gate.threshold ? 'fail' : 'pass';
                }
                // Calculate ecosystem impact based on Qflow correlations
                const qflowCorrelations = this.getModuleCorrelations('qflow');
                ecosystemImpact = qflowCorrelations.reduce((sum, corr) => sum + Math.abs(corr.correlationCoefficient), 0) / qflowCorrelations.length;
            }
            return {
                gate: gate.name,
                status,
                ecosystemImpact
            };
        });
    }
    generateQflowRecommendations(correlations, performanceGates) {
        const recommendations = [];
        const failedGates = performanceGates.filter(g => g.status === 'fail');
        if (failedGates.length > 0) {
            recommendations.push(`${failedGates.length} Qflow performance gates are failing - immediate attention required`);
        }
        const strongCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.7);
        if (strongCorrelations.length > 0) {
            recommendations.push(`Qflow has strong correlations with ${strongCorrelations.length} modules - monitor for cascade effects`);
        }
        const criticalPathModules = correlations.filter(c => c.criticalPath);
        if (criticalPathModules.length > 0) {
            recommendations.push(`Qflow performance directly impacts ${criticalPathModules.length} critical ecosystem paths`);
        }
        return recommendations;
    }
    isInCriticalPath(moduleA, moduleB) {
        const criticalPaths = this.identifyCriticalPaths();
        return criticalPaths.some(pathInfo => {
            const path = pathInfo.path;
            const indexA = path.indexOf(moduleA);
            const indexB = path.indexOf(moduleB);
            return indexA !== -1 && indexB !== -1 && Math.abs(indexA - indexB) === 1;
        });
    }
    updatePredictionModels() {
        // Update machine learning models for predictions
        // This would integrate with actual ML libraries in production
        this.emit('prediction_models_updated', {
            modelCount: this.predictionModels.size,
            timestamp: Date.now()
        });
    }
}
export default EcosystemCorrelationService;
//# sourceMappingURL=EcosystemCorrelationService.js.map