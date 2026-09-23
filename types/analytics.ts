export interface CrossCaseLink {
  id: string;
  entityId: string;
  entityName?: string;
  entityType: "person" | "phone" | "vehicle" | "location" | "organization" | "account";
  associatedCases: string[];
  connectionPath: string;
  confidence: number;
}

export interface CommunityCluster {
  id: string;
  name: string;
  entityCount: number;
  icon: string;
  description?: string;
}

export interface BridgeNode {
  id: string;
  name: string;
  entityId: string;
  entityType: string;
  connectedClusters: number;
  centrality: number;
  riskLevel: "high" | "medium" | "low";
}

export interface AnomalyItem {
  id: string;
  title: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  date: string;
  description: string;
  investigationHref: string;
}

export interface AnalyticsData {
  crossCaseLinks: CrossCaseLink[];
  communities: CommunityCluster[];
  bridgeNodes: BridgeNode[];
  anomalies: AnomalyItem[];
  sessionId: string;
}
