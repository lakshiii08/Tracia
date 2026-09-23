export type Role =
  | "ADMIN"
  | "INVESTIGATING_OFFICER"
  | "SENIOR_OFFICER"
  | "CYBER_OFFICER"
  | "FORENSIC_OFFICER"
  | "INTELLIGENCE_OFFICER"
  | "AUDITOR";

export type Permission =
  | "cases.view"
  | "cases.viewAll"
  | "cases.viewAssigned"
  | "cases.viewRelated"
  | "cases.assign"
  | "cases.requestAccess"
  | "cases.approveAccess"
  | "evidence.view"
  | "reports.view"
  | "graph.view"
  | "audit.view";

export type AccessLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

export interface User {
  id: string;
  name: string;
  role: Role;
  badgeNumber?: string;
  department?: string;
  avatar?: string;
  email?: string;
  operator?: string;
  status?: string;
  clearanceLevel?: string;
}

export interface AccessDecision {
  level: AccessLevel;
  canView: boolean;
  canEdit: boolean;
  canRequestAccess: boolean;
  reason: string;
  relationship: string | null;
}

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AccessRequest {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  userRole: Role;
  caseId: string;
  caseTitle: string;
  currentLevel: AccessLevel;
  requestedLevel: AccessLevel;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt?: string;
  reviewedBy?: string;
}

export const ACCESS_LEVEL_CONFIG: Record<
  AccessLevel,
  {
    code: AccessLevel;
    label: string;
    description: string;
    color: string;
    badgeBg: string;
    badgeBorder: string;
  }
> = {
  L0: {
    code: "L0",
    label: "No Access",
    description: "No authorized relationship or permission for this case file",
    color: "text-slate-400",
    badgeBg: "bg-slate-500/10",
    badgeBorder: "border-slate-500/30",
  },
  L1: {
    code: "L1",
    label: "Metadata Only",
    description: "Basic case file header metadata, title, and timestamp visible",
    color: "text-blue-400",
    badgeBg: "bg-blue-500/10",
    badgeBorder: "border-blue-500/30",
  },
  L2: {
    code: "L2",
    label: "Relationship Access",
    description: "Case relationship graph link & shared attribute metadata visible",
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30",
  },
  L3: {
    code: "L3",
    label: "Relevant Info",
    description: "Case summary and relevant linked entity details visible",
    color: "text-purple-400",
    badgeBg: "bg-purple-500/10",
    badgeBorder: "border-purple-500/30",
  },
  L4: {
    code: "L4",
    label: "Full Case Access",
    description: "Complete investigation workspace, records, CDR, graph & evidence access",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/30",
  },
  L5: {
    code: "L5",
    label: "Restricted / Sensitive",
    description: "Top-secret supervisory authorization restriction active",
    color: "text-rose-400",
    badgeBg: "bg-rose-500/10",
    badgeBorder: "border-rose-500/30",
  },
};
