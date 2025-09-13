/**
 * Auditable Historical Persistence Service
 *
 * Implements immutable execution history with cryptographic signatures
 * and comprehensive audit trail generation
 */
import { EventEmitter } from 'events';
import { qflowEventEmitter } from '../events/EventEmitter.js';
import { ipfsStateStorage } from './IPFSStateStorage.js';
import { ecosystemIntegration } from '../services/EcosystemIntegration.js';
/**
 * Auditable Historical Persistence Service
 */
export class AuditableHistoryService extends EventEmitter {
    historicalRecords = new Map();
    auditTrails = new Map();
    recordChains = new Map(); // executionId -> lastRecordHash
    complianceReports = [];
    constructor() {
        super();
        this.setupEventListeners();
    }
    /**
     * Record execution event in immutable history
     */
    async recordExecutionEvent(executionId, flowId, recordType, data, actor, stepId, daoSubnet) {
        try {
            const recordId = `record_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const timestamp = new Date().toISOString();
            // Get previous record hash for chain integrity
            const previousRecordHash = this.recordChains.get(executionId);
            // Create historical record
            const record = {
                recordId,
                executionId,
                flowId,
                stepId,
                recordType,
                timestamp,
                actor,
                data,
                previousRecordHash,
                signature: '',
                ipfsCid: '',
                metadata: {
                    version: '1.0.0',
                    nodeId: await this.getNodeId(),
                    daoSubnet,
                    correlationId: `corr_${executionId}_${Date.now()}`
                }
            };
            // Sign the record
            record.signature = await this.signRecord(record);
            // Store in IPFS
            record.ipfsCid = await this.storeRecordInIPFS(record);
            // Update record chain
            const recordHash = await this.calculateRecordHash(record);
            this.recordChains.set(executionId, recordHash);
            // Add to historical records
            if (!this.historicalRecords.has(executionId)) {
                this.historicalRecords.set(executionId, []);
            }
            this.historicalRecords.get(executionId).push(record);
            // Update audit trail
            await this.updateAuditTrail(executionId, record);
            // Emit historical record created event
            await qflowEventEmitter.emit('q.qflow.history.recorded.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-auditable-history',
                actor,
                data: {
                    recordId,
                    executionId,
                    flowId,
                    recordType,
                    ipfsCid: record.ipfsCid
                }
            });
            console.log(`[AuditableHistory] Recorded ${recordType} for execution ${executionId}: ${recordId}`);
            return recordId;
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to record execution event: ${error}`);
            throw error;
        }
    }
    /**
     * Get complete audit trail for execution
     */
    async getAuditTrail(executionId) {
        try {
            const auditTrail = this.auditTrails.get(executionId);
            if (!auditTrail) {
                return null;
            }
            // Verify integrity
            const integrityCheck = await this.verifyAuditTrailIntegrity(auditTrail);
            auditTrail.integrity = {
                chainValid: integrityCheck.chainValid,
                signaturesValid: integrityCheck.signaturesValid,
                lastVerified: new Date().toISOString()
            };
            return auditTrail;
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to get audit trail: ${error}`);
            return null;
        }
    }
    /**
     * Query historical records
     */
    async queryHistoricalRecords(query) {
        try {
            let allRecords = [];
            // Collect records from all executions
            for (const records of this.historicalRecords.values()) {
                allRecords = allRecords.concat(records);
            }
            // Apply filters
            let filteredRecords = allRecords;
            if (query.executionId) {
                filteredRecords = filteredRecords.filter(r => r.executionId === query.executionId);
            }
            if (query.flowId) {
                filteredRecords = filteredRecords.filter(r => r.flowId === query.flowId);
            }
            if (query.actor) {
                filteredRecords = filteredRecords.filter(r => r.actor === query.actor);
            }
            if (query.recordType) {
                filteredRecords = filteredRecords.filter(r => r.recordType === query.recordType);
            }
            if (query.daoSubnet) {
                filteredRecords = filteredRecords.filter(r => r.metadata.daoSubnet === query.daoSubnet);
            }
            if (query.dateRange) {
                const fromDate = new Date(query.dateRange.from);
                const toDate = new Date(query.dateRange.to);
                filteredRecords = filteredRecords.filter(r => {
                    const recordDate = new Date(r.timestamp);
                    return recordDate >= fromDate && recordDate <= toDate;
                });
            }
            // Sort by timestamp (newest first)
            filteredRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            // Apply pagination
            const offset = query.offset || 0;
            const limit = query.limit || 100;
            return filteredRecords.slice(offset, offset + limit);
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to query historical records: ${error}`);
            return [];
        }
    }
    /**
     * Generate compliance report
     */
    async generateComplianceReport(period, scope) {
        try {
            const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const generatedAt = new Date().toISOString();
            // Query records for the period
            const query = {
                dateRange: period,
                limit: 10000 // Large limit for comprehensive report
            };
            if (scope?.flowIds) {
                // For multiple flow IDs, we'll need to query each separately
                // This is a simplified implementation
                query.flowId = scope.flowIds[0];
            }
            if (scope?.daoSubnets) {
                query.daoSubnet = scope.daoSubnets[0];
            }
            const records = await this.queryHistoricalRecords(query);
            // Calculate statistics
            const executionIds = new Set(records.map(r => r.executionId));
            const successfulExecutions = new Set();
            const failedExecutions = new Set();
            const totalSteps = records.filter(r => r.recordType === 'step-completed' || r.recordType === 'step-failed').length;
            const executionTimes = [];
            // Analyze executions
            for (const executionId of executionIds) {
                const executionRecords = records.filter(r => r.executionId === executionId);
                const startRecord = executionRecords.find(r => r.recordType === 'execution-started');
                const endRecord = executionRecords.find(r => r.recordType === 'execution-completed' || r.recordType === 'execution-failed');
                if (endRecord) {
                    if (endRecord.recordType === 'execution-completed') {
                        successfulExecutions.add(executionId);
                    }
                    else {
                        failedExecutions.add(executionId);
                    }
                    if (startRecord) {
                        const duration = new Date(endRecord.timestamp).getTime() - new Date(startRecord.timestamp).getTime();
                        executionTimes.push(duration);
                    }
                }
            }
            const averageExecutionTime = executionTimes.length > 0
                ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
                : 0;
            // Detect compliance violations
            const violations = await this.detectComplianceViolations(records);
            // Generate audit trails for included executions
            const auditTrails = [];
            for (const executionId of executionIds) {
                const trail = await this.getAuditTrail(executionId);
                if (trail) {
                    auditTrails.push(trail);
                }
            }
            // Create compliance report
            const report = {
                reportId,
                generatedAt,
                period,
                scope: scope || {},
                statistics: {
                    totalExecutions: executionIds.size,
                    successfulExecutions: successfulExecutions.size,
                    failedExecutions: failedExecutions.size,
                    totalSteps,
                    averageExecutionTime,
                    complianceViolations: violations.length
                },
                violations,
                auditTrails,
                ipfsCid: '',
                signature: ''
            };
            // Store report in IPFS
            report.ipfsCid = await this.storeReportInIPFS(report);
            // Sign the report
            report.signature = await this.signReport(report);
            // Store report
            this.complianceReports.push(report);
            // Emit compliance report generated event
            await qflowEventEmitter.emit('q.qflow.compliance.report.generated.v1', {
                eventId: this.generateEventId(),
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                source: 'qflow-auditable-history',
                actor: 'system',
                data: {
                    reportId,
                    period,
                    totalExecutions: report.statistics.totalExecutions,
                    violations: report.statistics.complianceViolations,
                    ipfsCid: report.ipfsCid
                }
            });
            console.log(`[AuditableHistory] Generated compliance report: ${reportId}`);
            return report;
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to generate compliance report: ${error}`);
            throw error;
        }
    }
    /**
     * Verify audit trail integrity
     */
    async verifyAuditTrailIntegrity(auditTrail) {
        try {
            let chainValid = true;
            let signaturesValid = true;
            const records = auditTrail.records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            // Verify chain integrity
            for (let i = 1; i < records.length; i++) {
                const currentRecord = records[i];
                const previousRecord = records[i - 1];
                const expectedPreviousHash = await this.calculateRecordHash(previousRecord);
                if (currentRecord.previousRecordHash !== expectedPreviousHash) {
                    chainValid = false;
                    console.warn(`[AuditableHistory] Chain integrity violation at record ${currentRecord.recordId}`);
                    break;
                }
            }
            // Verify signatures
            for (const record of records) {
                const signatureValid = await this.verifyRecordSignature(record);
                if (!signatureValid) {
                    signaturesValid = false;
                    console.warn(`[AuditableHistory] Invalid signature for record ${record.recordId}`);
                    break;
                }
            }
            return { chainValid, signaturesValid };
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to verify audit trail integrity: ${error}`);
            return { chainValid: false, signaturesValid: false };
        }
    }
    /**
     * Get compliance reports
     */
    getComplianceReports(limit) {
        const reports = [...this.complianceReports].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
        return limit ? reports.slice(0, limit) : reports;
    }
    /**
     * Export audit data for external compliance systems
     */
    async exportAuditData(format, query) {
        try {
            const records = await this.queryHistoricalRecords(query);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            switch (format) {
                case 'json':
                    return {
                        data: JSON.stringify(records, null, 2),
                        contentType: 'application/json',
                        filename: `qflow-audit-${timestamp}.json`
                    };
                case 'csv':
                    const csvData = this.convertToCSV(records);
                    return {
                        data: csvData,
                        contentType: 'text/csv',
                        filename: `qflow-audit-${timestamp}.csv`
                    };
                case 'xml':
                    const xmlData = this.convertToXML(records);
                    return {
                        data: xmlData,
                        contentType: 'application/xml',
                        filename: `qflow-audit-${timestamp}.xml`
                    };
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to export audit data: ${error}`);
            throw error;
        }
    }
    // Private helper methods
    setupEventListeners() {
        // Listen for execution events to automatically create historical records
        qflowEventEmitter.on('q.qflow.exec.started.v1', async (event) => {
            await this.recordExecutionEvent(event.data.executionId, event.data.flowId, 'execution-started', event.data, event.actor);
        });
        qflowEventEmitter.on('q.qflow.exec.step.completed.v1', async (event) => {
            await this.recordExecutionEvent(event.data.executionId, event.data.flowId, 'step-completed', event.data, event.actor, event.data.stepId);
        });
        qflowEventEmitter.on('q.qflow.exec.step.failed.v1', async (event) => {
            await this.recordExecutionEvent(event.data.executionId, event.data.flowId, 'step-failed', event.data, event.actor, event.data.stepId);
        });
        qflowEventEmitter.on('q.qflow.exec.completed.v1', async (event) => {
            await this.recordExecutionEvent(event.data.executionId, event.data.flowId, 'execution-completed', event.data, event.actor);
        });
        qflowEventEmitter.on('q.qflow.exec.failed.v1', async (event) => {
            await this.recordExecutionEvent(event.data.executionId, event.data.flowId, 'execution-failed', event.data, event.actor);
        });
        qflowEventEmitter.on('q.qflow.checkpoint.created.v1', async (event) => {
            await this.recordExecutionEvent(event.data.executionId, event.data.flowId || 'unknown', 'checkpoint-created', event.data, event.actor);
        });
    }
    async updateAuditTrail(executionId, record) {
        let auditTrail = this.auditTrails.get(executionId);
        if (!auditTrail) {
            auditTrail = {
                executionId,
                flowId: record.flowId,
                records: [],
                summary: {
                    totalRecords: 0,
                    startTime: record.timestamp,
                    status: 'running',
                    stepsCompleted: 0,
                    stepsFailed: 0,
                    checkpointsCreated: 0
                },
                integrity: {
                    chainValid: true,
                    signaturesValid: true,
                    lastVerified: new Date().toISOString()
                }
            };
        }
        auditTrail.records.push(record);
        auditTrail.summary.totalRecords++;
        // Update summary based on record type
        switch (record.recordType) {
            case 'step-completed':
                auditTrail.summary.stepsCompleted++;
                break;
            case 'step-failed':
                auditTrail.summary.stepsFailed++;
                break;
            case 'execution-completed':
                auditTrail.summary.status = 'completed';
                auditTrail.summary.endTime = record.timestamp;
                auditTrail.summary.duration = new Date(record.timestamp).getTime() - new Date(auditTrail.summary.startTime).getTime();
                break;
            case 'execution-failed':
                auditTrail.summary.status = 'failed';
                auditTrail.summary.endTime = record.timestamp;
                auditTrail.summary.duration = new Date(record.timestamp).getTime() - new Date(auditTrail.summary.startTime).getTime();
                break;
            case 'checkpoint-created':
                auditTrail.summary.checkpointsCreated++;
                break;
        }
        this.auditTrails.set(executionId, auditTrail);
    }
    async signRecord(record) {
        try {
            const qlockService = ecosystemIntegration.getService('qlock');
            if (!qlockService) {
                console.warn('[AuditableHistory] Qlock service not available, skipping signing');
                return '';
            }
            const dataToSign = JSON.stringify({
                recordId: record.recordId,
                executionId: record.executionId,
                recordType: record.recordType,
                timestamp: record.timestamp,
                actor: record.actor,
                previousRecordHash: record.previousRecordHash
            });
            const signResult = await qlockService.sign({
                data: dataToSign,
                algorithm: 'ed25519'
            });
            return signResult.signature;
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to sign record: ${error}`);
            return '';
        }
    }
    async verifyRecordSignature(record) {
        try {
            if (!record.signature) {
                return true; // Allow unsigned records for backward compatibility
            }
            const qlockService = ecosystemIntegration.getService('qlock');
            if (!qlockService) {
                return true; // Allow if service not available
            }
            const dataToVerify = JSON.stringify({
                recordId: record.recordId,
                executionId: record.executionId,
                recordType: record.recordType,
                timestamp: record.timestamp,
                actor: record.actor,
                previousRecordHash: record.previousRecordHash
            });
            const verifyResult = await qlockService.verify({
                data: dataToVerify,
                signature: record.signature,
                algorithm: 'ed25519'
            });
            return verifyResult.valid;
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to verify record signature: ${error}`);
            return false;
        }
    }
    async calculateRecordHash(record) {
        const crypto = await import('crypto');
        const dataToHash = JSON.stringify({
            recordId: record.recordId,
            executionId: record.executionId,
            timestamp: record.timestamp,
            recordType: record.recordType,
            actor: record.actor
        });
        return crypto.createHash('sha256').update(dataToHash, 'utf8').digest('hex');
    }
    async storeRecordInIPFS(record) {
        try {
            const recordData = JSON.stringify(record);
            return await ipfsStateStorage.saveState(`record_${record.recordId}`, recordData);
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to store record in IPFS: ${error}`);
            return '';
        }
    }
    async storeReportInIPFS(report) {
        try {
            const reportData = JSON.stringify(report);
            return await ipfsStateStorage.saveState(`report_${report.reportId}`, reportData);
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to store report in IPFS: ${error}`);
            return '';
        }
    }
    async signReport(report) {
        try {
            const qlockService = ecosystemIntegration.getService('qlock');
            if (!qlockService) {
                return '';
            }
            const dataToSign = JSON.stringify({
                reportId: report.reportId,
                generatedAt: report.generatedAt,
                period: report.period,
                statistics: report.statistics
            });
            const signResult = await qlockService.sign({
                data: dataToSign,
                algorithm: 'ed25519'
            });
            return signResult.signature;
        }
        catch (error) {
            console.error(`[AuditableHistory] Failed to sign report: ${error}`);
            return '';
        }
    }
    async detectComplianceViolations(records) {
        const violations = [];
        // Check for unauthorized access patterns
        const actorCounts = new Map();
        for (const record of records) {
            actorCounts.set(record.actor, (actorCounts.get(record.actor) || 0) + 1);
        }
        // Detect suspicious activity patterns
        for (const [actor, count] of actorCounts.entries()) {
            if (count > 1000) { // Threshold for suspicious activity
                violations.push({
                    violationId: `violation_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                    executionId: 'multiple',
                    flowId: 'multiple',
                    violationType: 'unauthorized-access',
                    description: `Actor ${actor} performed ${count} actions, exceeding normal threshold`,
                    severity: 'medium',
                    timestamp: new Date().toISOString(),
                    actor,
                    remediation: 'Review actor permissions and activity patterns'
                });
            }
        }
        // Check for failed executions with sensitive data
        const failedRecords = records.filter(r => r.recordType === 'execution-failed' || r.recordType === 'step-failed');
        for (const record of failedRecords) {
            if (record.data && JSON.stringify(record.data).includes('sensitive')) {
                violations.push({
                    violationId: `violation_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                    executionId: record.executionId,
                    flowId: record.flowId,
                    violationType: 'data-breach',
                    description: 'Failed execution contained sensitive data',
                    severity: 'high',
                    timestamp: record.timestamp,
                    actor: record.actor,
                    remediation: 'Review data handling procedures and access controls'
                });
            }
        }
        return violations;
    }
    async getNodeId() {
        try {
            const nodeInfo = await ipfsStateStorage.getNodeInfo();
            return nodeInfo?.id || 'unknown';
        }
        catch (error) {
            return 'unknown';
        }
    }
    convertToCSV(records) {
        const headers = ['recordId', 'executionId', 'flowId', 'recordType', 'timestamp', 'actor', 'stepId', 'ipfsCid'];
        const rows = records.map(record => [
            record.recordId,
            record.executionId,
            record.flowId,
            record.recordType,
            record.timestamp,
            record.actor,
            record.stepId || '',
            record.ipfsCid
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    convertToXML(records) {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditRecords>\n';
        for (const record of records) {
            xml += '  <record>\n';
            xml += `    <recordId>${record.recordId}</recordId>\n`;
            xml += `    <executionId>${record.executionId}</executionId>\n`;
            xml += `    <flowId>${record.flowId}</flowId>\n`;
            xml += `    <recordType>${record.recordType}</recordType>\n`;
            xml += `    <timestamp>${record.timestamp}</timestamp>\n`;
            xml += `    <actor>${record.actor}</actor>\n`;
            if (record.stepId) {
                xml += `    <stepId>${record.stepId}</stepId>\n`;
            }
            xml += `    <ipfsCid>${record.ipfsCid}</ipfsCid>\n`;
            xml += '  </record>\n';
        }
        xml += '</auditRecords>';
        return xml;
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.historicalRecords.clear();
        this.auditTrails.clear();
        this.recordChains.clear();
        this.complianceReports.length = 0;
        this.removeAllListeners();
    }
}
// Export singleton instance
export const auditableHistoryService = new AuditableHistoryService();
//# sourceMappingURL=AuditableHistoryService.js.map