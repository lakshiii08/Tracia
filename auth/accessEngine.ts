import type { AccessDecision, AccessLevel, AccessRequest, User } from "@/types/accessControl";
import type { CaseRelationship } from "@/types/relationships";
import type { ExtendedCaseItem } from "@/types/cases";
import { hasRolePermission } from "./roles";

export function getCaseAccess(
  user: User | null,
  caseData: ExtendedCaseItem,
  userAssignedCaseIds: string[] = [],
  relationships: CaseRelationship[] = [],
  accessRequests: AccessRequest[] = []
): AccessDecision {
  if (!user || !caseData) {
    return {
      level: "L0",
      canView: false,
      canEdit: false,
      canRequestAccess: false,
      reason: "Unauthenticated / No active user session",
      relationship: null,
    };
  }

  // 1. ADMIN or cases.viewAll permission -> L4 Full Access
  if (user.role === "ADMIN" || hasRolePermission(user.role, "cases.viewAll")) {
    return {
      level: "L4",
      canView: true,
      canEdit: true,
      canRequestAccess: false,
      reason: "Administrator global system oversight authorization",
      relationship: null,
    };
  }

  // 2. Directly assigned to officer -> L4 Full Access
  const isAssigned =
    caseData.assignedOfficerIds?.includes(user.id) ||
    userAssignedCaseIds.includes(caseData.id) ||
    caseData.assignees?.some(
      (a) => a.name.toLowerCase().includes(user.name.toLowerCase()) || user.name.toLowerCase().includes(a.name.toLowerCase())
    );

  if (isAssigned) {
    return {
      level: "L4",
      canView: true,
      canEdit: true,
      canRequestAccess: false,
      reason: "Directly assigned case officer",
      relationship: null,
    };
  }

  // 3. User has an APPROVED access request -> Approved Level (L4)
  const approvedReq = accessRequests.find(
    (req) => req.userId === user.id && req.caseId === caseData.id && req.status === "APPROVED"
  );

  if (approvedReq) {
    return {
      level: approvedReq.requestedLevel || "L4",
      canView: true,
      canEdit: approvedReq.requestedLevel === "L4",
      canRequestAccess: false,
      reason: `Authorized via approved access request (${approvedReq.requestId})`,
      relationship: null,
    };
  }

  // 4. Graph Discovery: Related to one of the officer's assigned cases -> L2 / L3
  const directRelationship = relationships.find(
    (rel) =>
      (userAssignedCaseIds.includes(rel.sourceCaseId) && rel.targetCaseId === caseData.id) ||
      (userAssignedCaseIds.includes(rel.targetCaseId) && rel.sourceCaseId === caseData.id)
  );

  if (directRelationship) {
    return {
      level: directRelationship.defaultAccessLevel || "L2",
      canView: true,
      canEdit: false,
      canRequestAccess: true,
      reason: directRelationship.description,
      relationship: directRelationship.relationshipType,
    };
  }

  // 5. Unrelated / Default -> L0 (No Access)
  return {
    level: "L0",
    canView: false,
    canEdit: false,
    canRequestAccess: true,
    reason: "No authorized direct assignment or case relationship link",
    relationship: null,
  };
}

export function canAccessLevel(currentLevel: AccessLevel, requiredLevel: AccessLevel): boolean {
  const levelOrder: Record<AccessLevel, number> = {
    L0: 0,
    L1: 1,
    L2: 2,
    L3: 3,
    L4: 4,
    L5: 5,
  };
  return levelOrder[currentLevel] >= levelOrder[requiredLevel];
}
