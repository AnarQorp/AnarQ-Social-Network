/**
 * Flow Burn-Rate Service for Qflow
 * Implements flow-level burn-rate actions and cost control
 */
import { EventEmitter } from 'events';
export class FlowBurnRateService extends EventEmitter {
    flowPriorities;
    burnRateHistory;
    flowCostAnalyses;
    costControlPolicies;
    gracefulDegradationLevels;
    currentDegradationLevel;
    pausedFlows;
    deferredSteps;
    coldNodes;
    config;
    constructor(options = {}) {
        super();
        this.flowPriorities = new Map();
        this.burnRateHistory = [];
        this.flowCostAnalyses = new Map();
        this.costControlPolicies = new Map();
        this.gracefulDegradationLevels = [];
        this.currentDegradationLevel = 0;
        this.pausedFlows = new Map();
        this.deferredSteps = new Map();
        this.coldNodes = new Set();
        this.config = {
            burnRateCalculationInterval: 30000, // 30 seconds
            costTrackingEnabled: true,
            maxBurnRateThreshold: 0.9, // 90%
            gracefulDegradationEnabled: true,
            costLimits: {
                hourly: 100, // $100/hour
                daily: 2000, // $2000/day
                monthly: 50000 // $50000/month
            },
            ...options
        };
        this.initializeGracefulDegradationLevels();
        this.initializeDefaultPolicies();
        this.initializeColdNodes();
        this.startBurnRateMonitoring();
    }
    /**
     * Set flow priority and cost parameters
     */
    setFlowPriority(flowPriority) {
        this.flowPriorities.set(flowPriority.flowId, flowPriority);
        this.emit('flow_priority_set', flowPriority);
    }
    /**
     * Calculate current burn rate
     */
    calculateBurnRate() {
        const timestamp = Date.now();
        // Calculate resource burn rate
        const resourceBurnRate = this.calculateResourceBurnRate();
        // Calculate cost burn rate
        const costBurnRate = this.calculateCostBurnRate();
        // Calculate performance burn rate
        const performanceBurnRate = this.calculatePerformanceBurnRate();
        // Calculate overall burn rate (weighted average)
        const overallBurnRate = (resourceBurnRate.cpu * 0.3 +
            resourceBurnRate.memory * 0.2 +
            performanceBurnRate.latencyBurn * 0.25 +
            performanceBurnRate.errorRateBurn * 0.15 +
            (costBurnRate.totalCost / this.config.costLimits.hourly) * 0.1);
        const burnRateMetrics = {
            timestamp,
            overallBurnRate: Math.min(1.0, overallBurnRate),
            resourceBurnRate,
            costBurnRate,
            performanceBurnRate
        };
        // Store in history
        this.burnRateHistory.push(burnRateMetrics);
        // Keep only recent history (last 24 hours)
        const cutoff = timestamp - (24 * 60 * 60 * 1000);
        this.burnRateHistory = this.burnRateHistory.filter(m => m.timestamp > cutoff);
        this.emit('burn_rate_calculated', burnRateMetrics);
        return burnRateMetrics;
    }
    /**
     * Handle burn rate threshold exceeded
     */
    async handleBurnRateExceeded(burnRate) {
        this.emit('burn_rate_exceeded', { burnRate, threshold: this.config.maxBurnRateThreshold });
        // Execute cost control policies
        await this.executeCostControlPolicies(burnRate);
        // Trigger graceful degradation if enabled
        if (this.config.gracefulDegradationEnabled) {
            await this.triggerGracefulDegradation(burnRate);
        }
    }
    /**
     * Pause low-priority flows
     */
    async pauseLowPriorityFlows(burnRate, maxFlowsToPause = 50) {
        const lowPriorityFlows = Array.from(this.flowPriorities.entries())
            .filter(([_, priority]) => priority.priority === 'low' || priority.priority === 'medium')
            .sort(([_, a], [__, b]) => this.calculateFlowCost(a.flowId) - this.calculateFlowCost(b.flowId))
            .slice(0, maxFlowsToPause)
            .map(([flowId]) => flowId);
        const pausedFlows = [];
        for (const flowId of lowPriorityFlows) {
            if (!this.pausedFlows.has(flowId)) {
                await this.pauseFlow(flowId, 'burn_rate_control', this.calculatePauseDuration(burnRate));
                pausedFlows.push(flowId);
            }
        }
        this.emit('low_priority_flows_paused', {
            burnRate,
            pausedFlows,
            reason: 'burn_rate_exceeded'
        });
        return pausedFlows;
    }
    /**
     * Defer heavy steps to cold nodes
     */
    async deferHeavySteps(burnRate) {
        const heavySteps = await this.identifyHeavySteps();
        const availableColdNodes = Array.from(this.coldNodes);
        if (availableColdNodes.length === 0) {
            this.emit('no_cold_nodes_available', { heavyStepsCount: heavySteps.length });
            return;
        }
        const deferredSteps = [];
        for (const step of heavySteps) {
            const targetNode = this.selectColdNode(availableColdNodes, step);
            if (targetNode) {
                this.deferredSteps.set(step.stepId, {
                    stepId: step.stepId,
                    flowId: step.flowId,
                    deferredAt: Date.now(),
                    targetNode
                });
                deferredSteps.push(step.stepId);
                // Execute step deferral
                await this.executeDeferredStep(step, targetNode);
            }
        }
        this.emit('heavy_steps_deferred', {
            burnRate,
            deferredSteps,
            coldNodesUsed: availableColdNodes.length
        });
    }
    /**
     * Reroute flows to cold nodes
     */
    async rerouteFlowsToColdNodes(burnRate, percentage = 30) {
        const activeFlows = await this.getActiveFlows();
        const flowsToReroute = Math.floor(activeFlows.length * (percentage / 100));
        const availableColdNodes = Array.from(this.coldNodes);
        if (availableColdNodes.length === 0) {
            this.emit('no_cold_nodes_for_rerouting', { activeFlowsCount: activeFlows.length });
            return;
        }
        // Select flows to reroute (prefer low priority, high cost)
        const selectedFlows = activeFlows
            .sort((a, b) => {
            const priorityA = this.flowPriorities.get(a.flowId)?.priority || 'medium';
            const priorityB = this.flowPriorities.get(b.flowId)?.priority || 'medium';
            const costA = this.calculateFlowCost(a.flowId);
            const costB = this.calculateFlowCost(b.flowId);
            const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 };
            return (priorityScore[priorityA] - priorityScore[priorityB]) || (costB - costA);
        })
            .slice(0, flowsToReroute);
        const reroutedFlows = [];
        for (const flow of selectedFlows) {
            const targetNode = this.selectColdNode(availableColdNodes, flow);
            if (targetNode) {
                await this.rerouteFlow(flow.flowId, targetNode);
                reroutedFlows.push(flow.flowId);
            }
        }
        this.emit('flows_rerouted_to_cold_nodes', {
            burnRate,
            reroutedFlows,
            percentage,
            coldNodesUsed: availableColdNodes.length
        });
    }
    /**
     * Analyze flow cost
     */
    analyzeFlowCost(flowId, executionMetrics) {
        const priority = this.flowPriorities.get(flowId);
        // Calculate resource consumption
        const resourceConsumption = {
            cpuHours: (executionMetrics.duration / 3600000) * executionMetrics.nodeCount,
            memoryGBHours: (executionMetrics.duration / 3600000) * executionMetrics.nodeCount * 2, // Assume 2GB per node
            networkGB: executionMetrics.stepCount * 0.1, // Assume 100MB per step
            storageGB: executionMetrics.stepCount * 0.05 // Assume 50MB per step
        };
        // Calculate estimated costs (simplified pricing model)
        const estimatedCost = {
            compute: resourceConsumption.cpuHours * 0.10 + resourceConsumption.memoryGBHours * 0.02,
            network: resourceConsumption.networkGB * 0.05,
            storage: resourceConsumption.storageGB * 0.01,
            total: 0
        };
        estimatedCost.total = estimatedCost.compute + estimatedCost.network + estimatedCost.storage;
        // Apply priority cost weight
        if (priority) {
            estimatedCost.total *= priority.costWeight;
        }
        const analysis = {
            flowId,
            estimatedCost,
            resourceConsumption,
            executionMetrics
        };
        this.flowCostAnalyses.set(flowId, analysis);
        this.emit('flow_cost_analyzed', analysis);
        return analysis;
    }
    /**
     * Get cost control status
     */
    getCostControlStatus() {
        const latestBurnRate = this.burnRateHistory[this.burnRateHistory.length - 1];
        const currentBurnRate = latestBurnRate?.overallBurnRate || 0;
        const currentCosts = this.calculateCurrentCosts();
        const projectedCosts = this.calculateProjectedCosts(currentCosts, currentBurnRate);
        const recommendations = this.generateCostRecommendations(currentCosts, projectedCosts, currentBurnRate);
        return {
            currentBurnRate,
            degradationLevel: this.currentDegradationLevel,
            pausedFlows: this.pausedFlows.size,
            deferredSteps: this.deferredSteps.size,
            costLimits: this.config.costLimits,
            currentCosts,
            projectedCosts,
            recommendations
        };
    }
    /**
     * Private methods
     */
    initializeGracefulDegradationLevels() {
        this.gracefulDegradationLevels = [
            {
                level: 0,
                name: 'Normal Operation',
                burnRateThreshold: 0.7,
                actions: {
                    pauseLowPriorityFlows: false,
                    deferHeavySteps: false,
                    rerouteToColdNodes: false,
                    reduceParallelism: 0,
                    disableNonEssentialFeatures: false,
                    enableAggressiveCaching: false
                },
                resourceLimits: {
                    maxCpuUtilization: 0.8,
                    maxMemoryUtilization: 0.8,
                    maxNetworkUtilization: 0.8
                }
            },
            {
                level: 1,
                name: 'Performance Optimization',
                burnRateThreshold: 0.8,
                actions: {
                    pauseLowPriorityFlows: false,
                    deferHeavySteps: true,
                    rerouteToColdNodes: true,
                    reduceParallelism: 10,
                    disableNonEssentialFeatures: false,
                    enableAggressiveCaching: true
                },
                resourceLimits: {
                    maxCpuUtilization: 0.75,
                    maxMemoryUtilization: 0.75,
                    maxNetworkUtilization: 0.75
                }
            },
            {
                level: 2,
                name: 'Cost Control',
                burnRateThreshold: 0.9,
                actions: {
                    pauseLowPriorityFlows: true,
                    deferHeavySteps: true,
                    rerouteToColdNodes: true,
                    reduceParallelism: 25,
                    disableNonEssentialFeatures: true,
                    enableAggressiveCaching: true
                },
                resourceLimits: {
                    maxCpuUtilization: 0.7,
                    maxMemoryUtilization: 0.7,
                    maxNetworkUtilization: 0.7
                }
            },
            {
                level: 3,
                name: 'Emergency Throttling',
                burnRateThreshold: 0.95,
                actions: {
                    pauseLowPriorityFlows: true,
                    deferHeavySteps: true,
                    rerouteToColdNodes: true,
                    reduceParallelism: 50,
                    disableNonEssentialFeatures: true,
                    enableAggressiveCaching: true
                },
                resourceLimits: {
                    maxCpuUtilization: 0.6,
                    maxMemoryUtilization: 0.6,
                    maxNetworkUtilization: 0.6
                }
            }
        ];
    }
    initializeDefaultPolicies() {
        const defaultPolicies = [
            {
                id: 'burn_rate_80',
                name: 'Burn Rate 80% Policy',
                burnRateThreshold: 0.8,
                actions: [
                    {
                        type: 'defer_steps',
                        priority: 'low',
                        parameters: { percentage: 20 }
                    },
                    {
                        type: 'reroute_cold',
                        priority: 'medium',
                        parameters: { percentage: 15 }
                    }
                ],
                enabled: true,
                cooldownPeriod: 300000 // 5 minutes
            },
            {
                id: 'burn_rate_90',
                name: 'Burn Rate 90% Policy',
                burnRateThreshold: 0.9,
                actions: [
                    {
                        type: 'pause_flows',
                        priority: 'low',
                        parameters: { maxFlows: 30 }
                    },
                    {
                        type: 'defer_steps',
                        priority: 'medium',
                        parameters: { percentage: 40 }
                    },
                    {
                        type: 'graceful_degradation',
                        priority: 'high',
                        parameters: { level: 2 }
                    }
                ],
                enabled: true,
                cooldownPeriod: 180000 // 3 minutes
            },
            {
                id: 'emergency_95',
                name: 'Emergency 95% Policy',
                burnRateThreshold: 0.95,
                actions: [
                    {
                        type: 'pause_flows',
                        priority: 'medium',
                        parameters: { maxFlows: 100 }
                    },
                    {
                        type: 'graceful_degradation',
                        priority: 'critical',
                        parameters: { level: 3 }
                    }
                ],
                enabled: true,
                cooldownPeriod: 60000 // 1 minute
            }
        ];
        defaultPolicies.forEach(policy => this.costControlPolicies.set(policy.id, policy));
    }
    initializeColdNodes() {
        // Initialize with mock cold nodes - would be populated from actual node discovery
        this.coldNodes.add('cold-node-1');
        this.coldNodes.add('cold-node-2');
        this.coldNodes.add('cold-node-3');
    }
    startBurnRateMonitoring() {
        setInterval(() => {
            const burnRate = this.calculateBurnRate();
            if (burnRate.overallBurnRate > this.config.maxBurnRateThreshold) {
                this.handleBurnRateExceeded(burnRate.overallBurnRate);
            }
            // Check for flow resumption
            this.checkFlowResumption();
            // Cleanup old deferred steps
            this.cleanupDeferredSteps();
        }, this.config.burnRateCalculationInterval);
    }
    calculateResourceBurnRate() {
        // Mock implementation - would get actual resource metrics
        return {
            cpu: 0.7 + Math.random() * 0.2,
            memory: 0.6 + Math.random() * 0.3,
            network: 0.5 + Math.random() * 0.2,
            storage: 0.4 + Math.random() * 0.1
        };
    }
    calculateCostBurnRate() {
        const currentHour = new Date().getHours();
        const totalFlows = this.flowPriorities.size;
        // Simplified cost calculation
        const computeCost = totalFlows * 0.5; // $0.50 per flow per hour
        const networkCost = totalFlows * 0.1; // $0.10 per flow per hour
        const storageCost = totalFlows * 0.05; // $0.05 per flow per hour
        const totalCost = computeCost + networkCost + storageCost;
        return {
            computeCost,
            networkCost,
            storageCost,
            totalCost
        };
    }
    calculatePerformanceBurnRate() {
        // Mock implementation - would get actual performance metrics
        return {
            latencyBurn: 0.6 + Math.random() * 0.3,
            errorRateBurn: 0.1 + Math.random() * 0.2,
            throughputBurn: 0.5 + Math.random() * 0.2
        };
    }
    async executeCostControlPolicies(burnRate) {
        const applicablePolicies = Array.from(this.costControlPolicies.values())
            .filter(policy => policy.enabled && burnRate >= policy.burnRateThreshold)
            .sort((a, b) => b.burnRateThreshold - a.burnRateThreshold);
        for (const policy of applicablePolicies) {
            // Check cooldown
            if (policy.lastTriggered && Date.now() - policy.lastTriggered < policy.cooldownPeriod) {
                continue;
            }
            policy.lastTriggered = Date.now();
            for (const action of policy.actions) {
                await this.executeAction(action, burnRate);
            }
            this.emit('cost_control_policy_executed', {
                policyId: policy.id,
                burnRate,
                actionsCount: policy.actions.length
            });
        }
    }
    async executeAction(action, burnRate) {
        switch (action.type) {
            case 'pause_flows':
                await this.pauseLowPriorityFlows(burnRate, action.parameters.maxFlows);
                break;
            case 'defer_steps':
                await this.deferHeavySteps(burnRate);
                break;
            case 'reroute_cold':
                await this.rerouteFlowsToColdNodes(burnRate, action.parameters.percentage);
                break;
            case 'reduce_parallelism':
                await this.reduceParallelism(action.parameters.percentage);
                break;
            case 'graceful_degradation':
                await this.setGracefulDegradationLevel(action.parameters.level);
                break;
        }
    }
    async triggerGracefulDegradation(burnRate) {
        const targetLevel = this.gracefulDegradationLevels.findIndex(level => burnRate >= level.burnRateThreshold);
        if (targetLevel > this.currentDegradationLevel) {
            await this.setGracefulDegradationLevel(targetLevel);
        }
    }
    async setGracefulDegradationLevel(level) {
        if (level < 0 || level >= this.gracefulDegradationLevels.length) {
            return;
        }
        const degradationLevel = this.gracefulDegradationLevels[level];
        this.currentDegradationLevel = level;
        this.emit('graceful_degradation_level_changed', {
            previousLevel: this.currentDegradationLevel,
            newLevel: level,
            levelName: degradationLevel.name
        });
        // Execute degradation actions
        if (degradationLevel.actions.pauseLowPriorityFlows) {
            await this.pauseLowPriorityFlows(degradationLevel.burnRateThreshold);
        }
        if (degradationLevel.actions.deferHeavySteps) {
            await this.deferHeavySteps(degradationLevel.burnRateThreshold);
        }
        if (degradationLevel.actions.rerouteToColdNodes) {
            await this.rerouteFlowsToColdNodes(degradationLevel.burnRateThreshold, 30);
        }
        if (degradationLevel.actions.reduceParallelism > 0) {
            await this.reduceParallelism(degradationLevel.actions.reduceParallelism);
        }
    }
    async pauseFlow(flowId, reason, duration) {
        const resumeAt = duration ? Date.now() + duration : undefined;
        this.pausedFlows.set(flowId, {
            timestamp: Date.now(),
            reason,
            resumeAt
        });
        this.emit('flow_paused', { flowId, reason, resumeAt });
    }
    async resumeFlow(flowId) {
        this.pausedFlows.delete(flowId);
        this.emit('flow_resumed', { flowId });
    }
    calculatePauseDuration(burnRate) {
        // Calculate pause duration based on burn rate severity
        const baseDuration = 5 * 60 * 1000; // 5 minutes
        const severityMultiplier = Math.max(1, burnRate * 2);
        return baseDuration * severityMultiplier;
    }
    async identifyHeavySteps() {
        // Mock implementation - would analyze actual step metrics
        const heavySteps = [];
        for (const [flowId] of this.flowPriorities) {
            const stepCount = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < stepCount; i++) {
                const cost = Math.random() * 100;
                if (cost > 70) { // Heavy step threshold
                    heavySteps.push({
                        stepId: `${flowId}_step_${i}`,
                        flowId,
                        cost
                    });
                }
            }
        }
        return heavySteps.sort((a, b) => b.cost - a.cost);
    }
    selectColdNode(availableNodes, workload) {
        if (availableNodes.length === 0)
            return null;
        // Simple round-robin selection - would use more sophisticated logic in production
        return availableNodes[Math.floor(Math.random() * availableNodes.length)];
    }
    async executeDeferredStep(step, targetNode) {
        this.emit('step_deferred', {
            stepId: step.stepId,
            flowId: step.flowId,
            targetNode,
            originalCost: step.cost
        });
    }
    async rerouteFlow(flowId, targetNode) {
        this.emit('flow_rerouted', { flowId, targetNode });
    }
    async reduceParallelism(percentage) {
        this.emit('parallelism_reduced', { percentage });
    }
    async getActiveFlows() {
        // Mock implementation
        return Array.from(this.flowPriorities.keys()).map(flowId => ({ flowId }));
    }
    calculateFlowCost(flowId) {
        const analysis = this.flowCostAnalyses.get(flowId);
        return analysis?.estimatedCost.total || 0;
    }
    checkFlowResumption() {
        const now = Date.now();
        for (const [flowId, pauseInfo] of this.pausedFlows) {
            if (pauseInfo.resumeAt && now >= pauseInfo.resumeAt) {
                this.resumeFlow(flowId);
            }
        }
    }
    cleanupDeferredSteps() {
        const now = Date.now();
        const maxDeferralTime = 30 * 60 * 1000; // 30 minutes
        for (const [stepId, deferInfo] of this.deferredSteps) {
            if (now - deferInfo.deferredAt > maxDeferralTime) {
                this.deferredSteps.delete(stepId);
                this.emit('deferred_step_expired', { stepId, flowId: deferInfo.flowId });
            }
        }
    }
    calculateCurrentCosts() {
        const latestBurnRate = this.burnRateHistory[this.burnRateHistory.length - 1];
        const hourlyCost = latestBurnRate?.costBurnRate.totalCost || 0;
        return {
            hourly: hourlyCost,
            daily: hourlyCost * 24,
            monthly: hourlyCost * 24 * 30
        };
    }
    calculateProjectedCosts(currentCosts, burnRate) {
        const projectionMultiplier = 1 + (burnRate * 0.5); // Increase based on burn rate
        return {
            hourly: currentCosts.hourly * projectionMultiplier,
            daily: currentCosts.daily * projectionMultiplier,
            monthly: currentCosts.monthly * projectionMultiplier
        };
    }
    generateCostRecommendations(currentCosts, projectedCosts, burnRate) {
        const recommendations = [];
        if (projectedCosts.hourly > this.config.costLimits.hourly) {
            recommendations.push(`Projected hourly cost ($${projectedCosts.hourly.toFixed(2)}) exceeds limit ($${this.config.costLimits.hourly})`);
        }
        if (projectedCosts.daily > this.config.costLimits.daily) {
            recommendations.push(`Projected daily cost ($${projectedCosts.daily.toFixed(2)}) exceeds limit ($${this.config.costLimits.daily})`);
        }
        if (burnRate > 0.8) {
            recommendations.push('High burn rate detected - consider pausing low-priority flows');
        }
        if (this.pausedFlows.size > 10) {
            recommendations.push(`${this.pausedFlows.size} flows currently paused - monitor for impact on SLAs`);
        }
        if (this.deferredSteps.size > 20) {
            recommendations.push(`${this.deferredSteps.size} steps deferred - ensure cold nodes have sufficient capacity`);
        }
        return recommendations;
    }
}
export default FlowBurnRateService;
//# sourceMappingURL=FlowBurnRateService.js.map