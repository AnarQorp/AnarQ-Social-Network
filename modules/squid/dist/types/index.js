"use strict";
/**
 * sQuid Module Types
 * Core types and interfaces for identity management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyLevel = exports.GovernanceType = exports.VerificationLevel = exports.IdentityStatus = exports.IdentityType = void 0;
var IdentityType;
(function (IdentityType) {
    IdentityType["ROOT"] = "ROOT";
    IdentityType["DAO"] = "DAO";
    IdentityType["ENTERPRISE"] = "ENTERPRISE";
    IdentityType["CONSENTIDA"] = "CONSENTIDA";
    IdentityType["AID"] = "AID";
})(IdentityType || (exports.IdentityType = IdentityType = {}));
var IdentityStatus;
(function (IdentityStatus) {
    IdentityStatus["ACTIVE"] = "ACTIVE";
    IdentityStatus["INACTIVE"] = "INACTIVE";
    IdentityStatus["SUSPENDED"] = "SUSPENDED";
    IdentityStatus["DELETED"] = "DELETED";
    IdentityStatus["PENDING_VERIFICATION"] = "PENDING_VERIFICATION";
})(IdentityStatus || (exports.IdentityStatus = IdentityStatus = {}));
var VerificationLevel;
(function (VerificationLevel) {
    VerificationLevel["UNVERIFIED"] = "UNVERIFIED";
    VerificationLevel["BASIC"] = "BASIC";
    VerificationLevel["ENHANCED"] = "ENHANCED";
    VerificationLevel["INSTITUTIONAL"] = "INSTITUTIONAL";
})(VerificationLevel || (exports.VerificationLevel = VerificationLevel = {}));
var GovernanceType;
(function (GovernanceType) {
    GovernanceType["SELF"] = "SELF";
    GovernanceType["DAO"] = "DAO";
    GovernanceType["PARENT"] = "PARENT";
    GovernanceType["AUTONOMOUS"] = "AUTONOMOUS";
})(GovernanceType || (exports.GovernanceType = GovernanceType = {}));
var PrivacyLevel;
(function (PrivacyLevel) {
    PrivacyLevel["PUBLIC"] = "PUBLIC";
    PrivacyLevel["DAO_ONLY"] = "DAO_ONLY";
    PrivacyLevel["PRIVATE"] = "PRIVATE";
    PrivacyLevel["ANONYMOUS"] = "ANONYMOUS";
})(PrivacyLevel || (exports.PrivacyLevel = PrivacyLevel = {}));
//# sourceMappingURL=index.js.map