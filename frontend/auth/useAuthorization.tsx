"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AccessDecision, AccessLevel, AccessRequest, Permission, Role, User } from "@/types/accessControl";
import type { CaseRelationship } from "@/types/relationships";
import type { ExtendedCaseItem } from "@/types/cases";
import { getCaseAccess, canAccessLevel } from "./accessEngine";
import { hasRolePermission } from "./roles";
import { getCasesSync } from "@/services/api/cases";
import { getCaseRelationshipsSync } from "@/services/api/relationships";
import {
  getAccessRequestsSync,
  createAccessRequest,
  approveAccessRequest,
  rejectAccessRequest,
} from "@/services/api/accessRequests";

interface AuthContextValue {
  currentUser: User;
  hasPermission: (permission: Permission) => boolean;

  cases: ExtendedCaseItem[];
  assignedCases: ExtendedCaseItem[];
  relatedCases: { caseItem: ExtendedCaseItem; relationship: CaseRelationship; access: AccessDecision }[];
  accessRequests: AccessRequest[];

  evaluateCaseAccess: (caseData: ExtendedCaseItem) => AccessDecision;
  canViewCase: (caseData: ExtendedCaseItem) => boolean;
  canEditCase: (caseData: ExtendedCaseItem) => boolean;
  canRequestAccess: (caseData: ExtendedCaseItem) => boolean;
  checkAccessLevel: (current: AccessLevel, required: AccessLevel) => boolean;

  submitAccessRequest: (caseId: string, caseTitle: string, currentLevel: AccessLevel, requestedLevel: AccessLevel, reason: string) => Promise<AccessRequest>;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSessionToUser(operatorId: string, role: string): User {
  const normId = operatorId.trim().toUpperCase();
  const normRole = role.trim().toUpperCase();
  const baseUser = (mappedRole: Role, name = `Operator ${operatorId}`): User => ({
    id: operatorId,
    name,
    role: mappedRole,
    badgeNumber: operatorId,
    status: "Active",
  });

  if (normId === "ADMIN" || normId === "TRACIA-ADMIN" || normRole === "ADMIN") {
    return baseUser("ADMIN", "Admin");
  }
  if (normId === "INVESTIGATOR" || normId === "INVESTIGATOR-01" || normRole === "INVESTIGATOR" || normRole === "INVESTIGATING_OFFICER") {
    return baseUser("INVESTIGATING_OFFICER", "Investigator");
  }
  if (normId === "ANALYST" || normId === "ANALYST-01" || normRole === "ANALYST" || normRole === "INTELLIGENCE_OFFICER") {
    return {
      id: "ANALYST-01",
      name: "Intelligence Analyst",
      role: "INTELLIGENCE_OFFICER",
      badgeNumber: "ANL-8001",
      department: "Intelligence & Graph Analysis",
      clearanceLevel: "LEVEL 02",
      status: "Active",
    };
  }
  if (normId === "AUDITOR" || normId === "AUDITOR-01" || normRole === "AUDITOR") {
    return {
      id: "AUDITOR-01",
      name: "Audit Officer",
      role: "AUDITOR",
      badgeNumber: "AUD-5001",
      department: "Compliance & Security Audit",
      clearanceLevel: "LEVEL 03",
      status: "Active",
    };
  }

  // Fallback map by role string
  let mappedRole: Role = "INVESTIGATING_OFFICER";
  if (normRole.includes("ADMIN")) mappedRole = "ADMIN";
  else if (normRole.includes("CYBER")) mappedRole = "CYBER_OFFICER";
  else if (normRole.includes("FORENSIC")) mappedRole = "FORENSIC_OFFICER";
  else if (normRole.includes("AUDIT")) mappedRole = "AUDITOR";
  else if (normRole.includes("INTELLIGENCE") || normRole.includes("ANALYST")) mappedRole = "INTELLIGENCE_OFFICER";

  return {
    id: normId,
    name: `Operator ${normId}`,
    role: mappedRole,
    badgeNumber: normId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>({
    id: "anonymous",
    name: "Unauthenticated Operator",
    role: "AUDITOR",
    status: "Signed out",
  });
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => getAccessRequestsSync());
  const [cases, setCases] = useState<ExtendedCaseItem[]>(() => getCasesSync());
  const [relationships] = useState<CaseRelationship[]>(() => getCaseRelationshipsSync());

  // Fetch strict authenticated session user from JWT cookie and live cases
  useEffect(() => {
    async function fetchSessionUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.operatorId && data.role) {
            const mapped = mapSessionToUser(data.operatorId, data.role);
            setCurrentUser(mapped);
          }
        }
      } catch {
        // Keep default or current
      }
    }

    async function fetchLiveCases() {
      try {
        const res = await fetch("/api/cases");
        if (res.ok) {
          const liveData = await res.json();
          if (Array.isArray(liveData) && liveData.length > 0) {
            setCases(liveData);
          }
        }
      } catch {
        // Keep initial
      }
    }

    fetchSessionUser();
    fetchLiveCases();
  }, []);

  const hasPerm = useCallback(
    (permission: Permission) => {
      return hasRolePermission(currentUser.role, permission);
    },
    [currentUser]
  );

  // Compute user assigned cases strictly based on logged in user session
  const assignedCases = useMemo(() => {
    if (currentUser.role === "ADMIN" || hasRolePermission(currentUser.role, "cases.viewAll")) {
      return cases;
    }
    return cases.filter(
      (c) =>
        c.assignedOfficerIds?.includes(currentUser.id) ||
        c.assignees?.some((a) => a.name.toLowerCase().includes(currentUser.name.toLowerCase()))
    );
  }, [cases, currentUser]);

  const assignedCaseIds = useMemo(() => assignedCases.map((c) => c.id), [assignedCases]);

  // Compute evaluate function strictly based on logged in user session
  const evaluateCaseAccess = useCallback(
    (caseData: ExtendedCaseItem): AccessDecision => {
      return getCaseAccess(currentUser, caseData, assignedCaseIds, relationships, accessRequests);
    },
    [currentUser, assignedCaseIds, relationships, accessRequests]
  );

  const canViewCase = useCallback(
    (caseData: ExtendedCaseItem) => evaluateCaseAccess(caseData).canView,
    [evaluateCaseAccess]
  );

  const canEditCase = useCallback(
    (caseData: ExtendedCaseItem) => evaluateCaseAccess(caseData).canEdit,
    [evaluateCaseAccess]
  );

  const canRequestAccess = useCallback(
    (caseData: ExtendedCaseItem) => evaluateCaseAccess(caseData).canRequestAccess,
    [evaluateCaseAccess]
  );

  // Discover related cases connected to the user's assigned cases
  const relatedCases = useMemo(() => {
    if (currentUser.role === "ADMIN") return [];

    const discoveredMap = new Map<string, { caseItem: ExtendedCaseItem; relationship: CaseRelationship; access: AccessDecision }>();

    assignedCaseIds.forEach((sourceId) => {
      const rels = relationships.filter((r) => r.sourceCaseId === sourceId || r.targetCaseId === sourceId);
      rels.forEach((rel) => {
        const targetId = rel.sourceCaseId === sourceId ? rel.targetCaseId : rel.sourceCaseId;
        if (!assignedCaseIds.includes(targetId) && !discoveredMap.has(targetId)) {
          const targetCase = cases.find((c) => c.id === targetId);
          if (targetCase) {
            const access = evaluateCaseAccess(targetCase);
            discoveredMap.set(targetId, { caseItem: targetCase, relationship: rel, access });
          }
        }
      });
    });

    return Array.from(discoveredMap.values());
  }, [currentUser, assignedCaseIds, relationships, cases, evaluateCaseAccess]);

  const submitAccessRequest = useCallback(
    async (caseId: string, caseTitle: string, currentLevel: AccessLevel, requestedLevel: AccessLevel, reason: string) => {
      const newReq = await createAccessRequest({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        caseId,
        caseTitle,
        currentLevel,
        requestedLevel,
        reason,
      });
      setAccessRequests(getAccessRequestsSync());
      return newReq;
    },
    [currentUser]
  );

  const approveRequest = useCallback(async (requestId: string) => {
    await approveAccessRequest(requestId, currentUser.name);
    setAccessRequests(getAccessRequestsSync());
  }, [currentUser]);

  const rejectRequest = useCallback(async (requestId: string) => {
    await rejectAccessRequest(requestId, currentUser.name);
    setAccessRequests(getAccessRequestsSync());
  }, [currentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      hasPermission: hasPerm,
      cases,
      assignedCases,
      relatedCases,
      accessRequests,
      evaluateCaseAccess,
      canViewCase,
      canEditCase,
      canRequestAccess,
      checkAccessLevel: canAccessLevel,
      submitAccessRequest,
      approveRequest,
      rejectRequest,
    }),
    [
      currentUser,
      hasPerm,
      cases,
      assignedCases,
      relatedCases,
      accessRequests,
      evaluateCaseAccess,
      canViewCase,
      canEditCase,
      canRequestAccess,
      submitAccessRequest,
      approveRequest,
      rejectRequest,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthorization() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthorization must be used within an AuthProvider");
  }
  return context;
}
