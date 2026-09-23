import type { Permission } from "@/types/accessControl";

export const ALL_PERMISSIONS: Record<Permission, { code: Permission; label: string; description: string }> = {
  "cases.view": {
    code: "cases.view",
    label: "View Cases",
    description: "Allows viewing basic case directory listings",
  },
  "cases.viewAll": {
    code: "cases.viewAll",
    label: "View All Cases",
    description: "Allows full access to view all system investigation case files",
  },
  "cases.viewAssigned": {
    code: "cases.viewAssigned",
    label: "View Assigned Cases",
    description: "Allows full access to cases directly assigned to the user",
  },
  "cases.viewRelated": {
    code: "cases.viewRelated",
    label: "View Related Cases",
    description: "Allows discovering relationships and graph connections of assigned cases",
  },
  "cases.assign": {
    code: "cases.assign",
    label: "Assign Officers",
    description: "Allows assigning or reassigning officers to case files",
  },
  "cases.requestAccess": {
    code: "cases.requestAccess",
    label: "Request Case Access",
    description: "Allows submitting case access requests for related or restricted cases",
  },
  "cases.approveAccess": {
    code: "cases.approveAccess",
    label: "Approve Access Requests",
    description: "Allows administrators to approve or reject case access requests",
  },
  "evidence.view": {
    code: "evidence.view",
    label: "View Forensic Evidence",
    description: "Allows inspecting evidence hashes, OCR data, and chain of custody logs",
  },
  "reports.view": {
    code: "reports.view",
    label: "Generate Reports",
    description: "Allows generating and viewing intelligence investigation summaries",
  },
  "graph.view": {
    code: "graph.view",
    label: "View Knowledge Graph",
    description: "Allows exploring Neo4j multi-hop entity relationship graph visualizer",
  },
  "audit.view": {
    code: "audit.view",
    label: "View Audit Trail",
    description: "Allows viewing system compliance & investigation audit logs",
  },
};
