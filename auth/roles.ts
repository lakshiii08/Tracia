import type { Permission, Role } from "@/types/accessControl";

export interface RoleConfig {
  role: Role;
  name: string;
  description: string;
  badgeColor: string;
  permissions: Permission[];
}

export const ROLE_CONFIGURATIONS: Record<Role, RoleConfig> = {
  ADMIN: {
    role: "ADMIN",
    name: "System Administrator",
    description: "Full global system access, case assignment, and request management",
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    permissions: [
      "cases.view",
      "cases.viewAll",
      "cases.viewAssigned",
      "cases.viewRelated",
      "cases.assign",
      "cases.requestAccess",
      "cases.approveAccess",
      "evidence.view",
      "reports.view",
      "graph.view",
      "audit.view",
    ],
  },
  INVESTIGATING_OFFICER: {
    role: "INVESTIGATING_OFFICER",
    name: "Investigating Officer",
    description: "Full access to assigned cases, discovery access to related case graphs",
    badgeColor: "bg-primary/10 text-primary border-primary/30",
    permissions: [
      "cases.view",
      "cases.viewAssigned",
      "cases.viewRelated",
      "cases.requestAccess",
      "evidence.view",
      "reports.view",
      "graph.view",
    ],
  },
  SENIOR_OFFICER: {
    role: "SENIOR_OFFICER",
    name: "Senior Officer / Supervisor",
    description: "Supervisory case oversight across unit and escalation approvals",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    permissions: [
      "cases.view",
      "cases.viewAll",
      "cases.viewAssigned",
      "cases.viewRelated",
      "cases.assign",
      "cases.approveAccess",
      "evidence.view",
      "reports.view",
      "graph.view",
      "audit.view",
    ],
  },
  CYBER_OFFICER: {
    role: "CYBER_OFFICER",
    name: "Cybercrime Specialist",
    description: "Specialized access to digital indicators, TOR exit nodes, and cyber logs",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    permissions: [
      "cases.view",
      "cases.viewAssigned",
      "cases.viewRelated",
      "cases.requestAccess",
      "evidence.view",
      "graph.view",
    ],
  },
  FORENSIC_OFFICER: {
    role: "FORENSIC_OFFICER",
    name: "Forensics Examiner",
    description: "Chain of custody, digital extraction, and evidence hash verification focus",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    permissions: [
      "cases.view",
      "cases.viewAssigned",
      "evidence.view",
      "reports.view",
    ],
  },
  INTELLIGENCE_OFFICER: {
    role: "INTELLIGENCE_OFFICER",
    name: "Intelligence Analyst",
    description: "Multi-hop GraphRAG reasoning and entity correlation focus",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    permissions: [
      "cases.view",
      "cases.viewAssigned",
      "cases.viewRelated",
      "cases.requestAccess",
      "graph.view",
      "reports.view",
    ],
  },
  AUDITOR: {
    role: "AUDITOR",
    name: "Compliance & Security Auditor",
    description: "Read-only compliance audit trail inspection and security monitoring",
    badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    permissions: [
      "cases.view",
      "audit.view",
      "reports.view",
    ],
  },
};

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_CONFIGURATIONS[role]?.permissions || [];
}

export function hasRolePermission(role: Role, permission: Permission): boolean {
  const perms = getRolePermissions(role);
  return perms.includes(permission);
}
