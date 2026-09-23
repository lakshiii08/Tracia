import type { AnalyticsData, CrossCaseLink, CommunityCluster, BridgeNode, AnomalyItem } from "@/types/analytics";

export const MOCK_CROSS_CASE_LINKS: CrossCaseLink[] = [
  {
    id: "ccl-1",
    entityId: "PER_10023",
    entityName: "Vikram Sharma",
    entityType: "person",
    associatedCases: ["Case #101", "Case #209"],
    connectionPath: "Phone → Bank Acct",
    confidence: 94,
  },
  {
    id: "ccl-2",
    entityId: "LOC_8492",
    entityName: "Andheri Warehouse Complex",
    entityType: "location",
    associatedCases: ["Case #317"],
    connectionPath: "Address → Vehicle Reg",
    confidence: 88,
  },
];

export const MOCK_COMMUNITIES: CommunityCluster[] = [
  {
    id: "comm-1",
    name: "Financial Syndicate A",
    entityCount: 14,
    icon: "bubble_chart",
    description: "Cluster of offshore accounts, shell companies and high-frequency wire transfers.",
  },
  {
    id: "comm-2",
    name: "Narco Cell - Mumbai",
    entityCount: 22,
    icon: "share",
    description: "Intercepted delivery routes, drop houses and burner SIM cards across Mumbai metropolitan area.",
  },
];

export const MOCK_BRIDGE_NODES: BridgeNode[] = [
  {
    id: "bridge-1",
    name: "Person A (PER_10023)",
    entityId: "PER_10023",
    entityType: "person",
    connectedClusters: 3,
    centrality: 0.89,
    riskLevel: "high",
  },
];

export const MOCK_ANOMALIES: AnomalyItem[] = [
  {
    id: "anom-1",
    title: "Timeline Contradiction",
    severity: "HIGH",
    date: "10 May 2025",
    description: "Person A's CDR indicates location in Delhi, while ATM withdrawal record shows simultaneous activity in Mumbai.",
    investigationHref: "/graph",
  },
];

export const MOCK_ANALYTICS_DATA: AnalyticsData = {
  crossCaseLinks: MOCK_CROSS_CASE_LINKS,
  communities: MOCK_COMMUNITIES,
  bridgeNodes: MOCK_BRIDGE_NODES,
  anomalies: MOCK_ANOMALIES,
  sessionId: "TRC-8924-X",
};
