/**
 * Parallel Execution Engine
 *
 * Handles parallel execution of independent flow steps to optimize
 * execution time and resource utilization.
 */
import { EventEmitter } from 'events';
export class ParallelExecutionEngine extends EventEmitter {
    config;
    resourceManager;
    activeExecutions;
    executionQueue;
    semaphore;
    constructor(config, resourceManager) {
        super();
        this.config = config;
        this.resourceManager = resourceManager;
        this.activeExecutions = new Map();
        this.executionQueue = [];
        this.semaphore = config.maxConcurrentSteps;
    }
    /**
     * Analyze steps for parallel execution opportunities
     */
    analyzeSteps(steps) {
        const dependencyGraph = this.buildDependencyGraph(steps);
        const groups = this.identifyParallelGroups(steps, dependencyGraph);
        const totalSteps = steps.length;
        const parallelizableSteps = groups.reduce((sum, group) => sum + group.steps.length, 0);
        const parallelizationRatio = parallelizableSteps / totalSteps;
        const estimatedDuration = this.estimateExecutionDuration(groups);
        const plan = {
            groups,
            totalSteps,
            estimatedDuration,
            parallelizationRatio
        };
        this.emit('execution_plan_created', {
            groupCount: groups.length,
            parallelizationRatio,
            estimatedDuration
        });
        return plan;
    }
    /**
     * Execute steps in parallel according to the execution plan
     */
    async executeParallel(steps, context) {
        const startTime = Date.now();
        const plan = this.analyzeSteps(steps);
        const results = new Map();
        const errors = new Map();
        try {
            // Execute groups in dependency order
            for (const group of plan.groups) {
                const groupResult = await this.executeGroup(group, context);
                // Merge results
                for (const [stepId, result] of groupResult.results.entries()) {
                    results.set(stepId, result);
                }
                // Merge errors
                for (const [stepId, error] of groupResult.errors.entries()) {
                    errors.set(stepId, error);
                }
                // Handle failure strategy
                if (groupResult.errors.size > 0) {
                    if (this.config.failureStrategy === 'fail-fast') {
                        throw new Error(`Group ${group.id} failed with ${groupResult.errors.size} errors`);
                    }
                }
            }
            const executionTime = Date.now() - startTime;
            const parallelEfficiency = this.calculateParallelEfficiency(plan, executionTime);
            const resourceUtilization = this.calculateResourceUtilization();
            const result = {
                success: errors.size === 0,
                results,
                errors,
                executionTime,
                parallelEfficiency,
                resourceUtilization
            };
            this.emit('parallel_execution_completed', {
                success: result.success,
                stepCount: steps.length,
                executionTime,
                parallelEfficiency,
                errorCount: errors.size
            });
            return result;
        }
        catch (error) {
            this.emit('parallel_execution_failed', {
                error: error.message,
                executionTime: Date.now() - startTime,
                completedSteps: results.size
            });
            throw error;
        }
    }
    /**
     * Execute a single group of parallel steps
     */
    async executeGroup(group, context) {
        const startTime = Date.now();
        const results = new Map();
        const errors = new Map();
        // Create step executions
        const executions = group.steps.map(step => ({
            stepId: step.id,
            status: 'pending',
            retryCount: 0
        }));
        // Execute steps with concurrency control
        const concurrency = Math.min(group.maxConcurrency, this.config.maxConcurrentSteps);
        const semaphore = new Array(concurrency).fill(null);
        const executeStep = async (execution) => {
            const step = group.steps.find(s => s.id === execution.stepId);
            try {
                execution.status = 'running';
                execution.startTime = Date.now();
                this.activeExecutions.set(execution.stepId, execution);
                const result = await this.executeStepWithRetry(step, context, execution);
                execution.status = 'completed';
                execution.endTime = Date.now();
                execution.result = result;
                results.set(step.id, result);
                this.emit('step_completed', {
                    stepId: step.id,
                    groupId: group.id,
                    duration: execution.endTime - execution.startTime,
                    retryCount: execution.retryCount
                });
            }
            catch (error) {
                execution.status = 'failed';
                execution.endTime = Date.now();
                execution.error = error.message;
                errors.set(step.id, error.message);
                this.emit('step_failed', {
                    stepId: step.id,
                    groupId: group.id,
                    error: error.message,
                    retryCount: execution.retryCount
                });
            }
            finally {
                this.activeExecutions.delete(execution.stepId);
            }
        };
        // Execute all steps with concurrency control
        const promises = executions.map(execution => executeStep(execution));
        await Promise.allSettled(promises);
        const executionTime = Date.now() - startTime;
        const parallelEfficiency = group.steps.length > 1 ?
            (group.estimatedDuration / executionTime) : 1;
        this.emit('group_completed', {
            groupId: group.id,
            stepCount: group.steps.length,
            successCount: results.size,
            errorCount: errors.size,
            executionTime,
            parallelEfficiency
        });
        return {
            success: errors.size === 0,
            results,
            errors,
            executionTime,
            parallelEfficiency,
            resourceUtilization: this.calculateResourceUtilization()
        };
    }
    /**
     * Execute a single step with retry logic
     */
    async executeStepWithRetry(step, context, execution) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                execution.retryCount = attempt;
                // Acquire resource for execution
                const resource = await this.acquireExecutionResource(step);
                execution.resourceId = resource?.id;
                try {
                    const result = await this.executeStepOnResource(step, context, resource);
                    // Release resource
                    if (resource) {
                        await this.releaseExecutionResource(step, resource);
                    }
                    return result;
                }
                catch (error) {
                    // Release resource on error
                    if (resource) {
                        await this.releaseExecutionResource(step, resource);
                    }
                    throw error;
                }
            }
            catch (error) {
                lastError = error;
                if (attempt < this.config.retryAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                    this.emit('step_retry', {
                        stepId: step.id,
                        attempt: attempt + 1,
                        error: error.message,
                        delay
                    });
                }
            }
        }
        throw lastError || new Error('Step execution failed after all retries');
    }
    /**
     * Build dependency graph for steps
     */
    buildDependencyGraph(steps) {
        const dependencies = new Map();
        for (const step of steps) {
            const deps = [];
            // Analyze step parameters for variable references
            if (step.params) {
                const paramStr = JSON.stringify(step.params);
                // Look for references to other step outputs
                const variablePattern = /\$\{([^}]+)\}/g;
                let match;
                while ((match = variablePattern.exec(paramStr)) !== null) {
                    const variable = match[1];
                    // Check if variable references another step
                    for (const otherStep of steps) {
                        if (otherStep.id !== step.id && variable.includes(otherStep.id)) {
                            deps.push(otherStep.id);
                        }
                    }
                }
            }
            // Check explicit dependencies
            if (step.onSuccess && steps.find(s => s.id === step.onSuccess)) {
                // This step depends on its success handler
            }
            if (step.onFailure && steps.find(s => s.id === step.onFailure)) {
                // This step depends on its failure handler
            }
            dependencies.set(step.id, deps);
        }
        return dependencies;
    }
    /**
     * Identify groups of steps that can be executed in parallel
     */
    identifyParallelGroups(steps, dependencies) {
        const groups = [];
        const processed = new Set();
        const levels = this.topologicalSort(steps, dependencies);
        for (let level = 0; level < levels.length; level++) {
            const levelSteps = levels[level];
            if (levelSteps.length === 1) {
                // Single step, create individual group
                const step = levelSteps[0];
                groups.push({
                    id: `group_${groups.length + 1}`,
                    steps: [step],
                    dependencies: dependencies.get(step.id) || [],
                    priority: this.calculateStepPriority(step),
                    estimatedDuration: step.timeout || 30000,
                    maxConcurrency: 1
                });
            }
            else {
                // Multiple steps at same level, can be parallelized
                const independentGroups = this.partitionIndependentSteps(levelSteps, dependencies);
                for (const groupSteps of independentGroups) {
                    groups.push({
                        id: `group_${groups.length + 1}`,
                        steps: groupSteps,
                        dependencies: this.getGroupDependencies(groupSteps, dependencies),
                        priority: Math.max(...groupSteps.map(s => this.calculateStepPriority(s))),
                        estimatedDuration: Math.max(...groupSteps.map(s => s.timeout || 30000)),
                        maxConcurrency: Math.min(groupSteps.length, this.config.maxConcurrentSteps)
                    });
                }
            }
            levelSteps.forEach(step => processed.add(step.id));
        }
        return groups;
    }
    /**
     * Perform topological sort to determine execution levels
     */
    topologicalSort(steps, dependencies) {
        const levels = [];
        const remaining = new Set(steps);
        const completed = new Set();
        while (remaining.size > 0) {
            const currentLevel = [];
            for (const step of remaining) {
                const deps = dependencies.get(step.id) || [];
                const canExecute = deps.every(dep => completed.has(dep));
                if (canExecute) {
                    currentLevel.push(step);
                }
            }
            if (currentLevel.length === 0) {
                // Circular dependency detected
                throw new Error('Circular dependency detected in flow steps');
            }
            levels.push(currentLevel);
            for (const step of currentLevel) {
                remaining.delete(step);
                completed.add(step.id);
            }
        }
        return levels;
    }
    /**
     * Partition steps into independent groups
     */
    partitionIndependentSteps(steps, dependencies) {
        const groups = [];
        const remaining = new Set(steps);
        while (remaining.size > 0) {
            const group = [];
            const step = remaining.values().next().value;
            group.push(step);
            remaining.delete(step);
            // Find other steps that don't conflict with this one
            for (const otherStep of remaining) {
                if (this.areStepsIndependent(step, otherStep, dependencies)) {
                    group.push(otherStep);
                    remaining.delete(otherStep);
                }
            }
            groups.push(group);
        }
        return groups;
    }
    /**
     * Check if two steps are independent and can run in parallel
     */
    areStepsIndependent(step1, step2, dependencies) {
        const deps1 = dependencies.get(step1.id) || [];
        const deps2 = dependencies.get(step2.id) || [];
        // Check for direct dependencies
        if (deps1.includes(step2.id) || deps2.includes(step1.id)) {
            return false;
        }
        // Check for resource conflicts
        if (this.haveResourceConflicts(step1, step2)) {
            return false;
        }
        // Check for shared mutable state
        if (this.haveStateConflicts(step1, step2)) {
            return false;
        }
        return true;
    }
    /**
     * Check for resource conflicts between steps
     */
    haveResourceConflicts(step1, step2) {
        // Check if both steps require exclusive resources
        const step1Resources = this.getStepResources(step1);
        const step2Resources = this.getStepResources(step2);
        return step1Resources.some(r1 => step2Resources.some(r2 => r1.type === r2.type && r1.exclusive));
    }
    /**
     * Check for state conflicts between steps
     */
    haveStateConflicts(step1, step2) {
        // Analyze if steps modify the same state
        const step1Writes = this.getStepWrites(step1);
        const step2Writes = this.getStepWrites(step2);
        const step1Reads = this.getStepReads(step1);
        const step2Reads = this.getStepReads(step2);
        // Write-write conflict
        if (step1Writes.some(w => step2Writes.includes(w))) {
            return true;
        }
        // Read-write conflict
        if (step1Reads.some(r => step2Writes.includes(r)) ||
            step2Reads.some(r => step1Writes.includes(r))) {
            return true;
        }
        return false;
    }
    // Helper methods for resource and state analysis
    getStepResources(step) {
        const resources = [];
        // Analyze step type and parameters to determine resource requirements
        if (step.type === 'task' && step.action.includes('wasm')) {
            resources.push({ type: 'wasm-runtime', exclusive: false });
        }
        if (step.params?.database) {
            resources.push({ type: 'database', exclusive: false });
        }
        if (step.params?.exclusive) {
            resources.push({ type: 'exclusive-lock', exclusive: true });
        }
        return resources;
    }
    getStepWrites(step) {
        const writes = [];
        // Analyze step parameters for write operations
        if (step.params?.output) {
            writes.push(step.params.output);
        }
        if (step.params?.modify) {
            writes.push(...(Array.isArray(step.params.modify) ? step.params.modify : [step.params.modify]));
        }
        return writes;
    }
    getStepReads(step) {
        const reads = [];
        // Analyze step parameters for read operations
        if (step.params?.input) {
            reads.push(...(Array.isArray(step.params.input) ? step.params.input : [step.params.input]));
        }
        return reads;
    }
    getGroupDependencies(steps, dependencies) {
        const allDeps = new Set();
        const stepIds = new Set(steps.map(s => s.id));
        for (const step of steps) {
            const stepDeps = dependencies.get(step.id) || [];
            for (const dep of stepDeps) {
                if (!stepIds.has(dep)) {
                    allDeps.add(dep);
                }
            }
        }
        return Array.from(allDeps);
    }
    calculateStepPriority(step) {
        let priority = 5; // Default priority
        // Higher priority for shorter timeouts (faster steps)
        if (step.timeout) {
            priority += Math.max(0, 10 - (step.timeout / 1000));
        }
        // Higher priority for critical steps
        if (step.params?.critical) {
            priority += 5;
        }
        return Math.round(priority);
    }
    estimateExecutionDuration(groups) {
        // Estimate total duration assuming groups execute sequentially
        // but steps within groups execute in parallel
        return groups.reduce((total, group) => total + group.estimatedDuration, 0);
    }
    calculateParallelEfficiency(plan, actualTime) {
        const sequentialTime = plan.groups.reduce((total, group) => total + (group.steps.length * group.estimatedDuration), 0);
        return sequentialTime > 0 ? Math.min(1, sequentialTime / actualTime) : 0;
    }
    calculateResourceUtilization() {
        const totalResources = this.config.maxConcurrentSteps;
        const usedResources = this.activeExecutions.size;
        return totalResources > 0 ? usedResources / totalResources : 0;
    }
    async acquireExecutionResource(step) {
        // Determine resource type needed for step
        if (step.type === 'task' && step.action.includes('wasm')) {
            const wasmPool = this.resourceManager.getPool('wasm');
            return wasmPool ? await wasmPool.acquire() : null;
        }
        // For other step types, return a mock resource
        return { id: `resource_${Date.now()}`, type: 'generic' };
    }
    async releaseExecutionResource(step, resource) {
        if (step.type === 'task' && step.action.includes('wasm')) {
            const wasmPool = this.resourceManager.getPool('wasm');
            if (wasmPool && resource) {
                await wasmPool.release(resource);
            }
        }
        // For other resources, no action needed
    }
    async executeStepOnResource(step, context, resource) {
        // Simulate step execution
        const executionTime = Math.random() * (step.timeout || 30000) * 0.1; // 10% of timeout
        await new Promise(resolve => setTimeout(resolve, executionTime));
        return {
            stepId: step.id,
            result: `Executed ${step.action} on ${resource?.type || 'generic'} resource`,
            executionTime,
            resourceId: resource?.id,
            timestamp: Date.now()
        };
    }
}
//# sourceMappingURL=ParallelExecutionEngine.js.map