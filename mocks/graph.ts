import type { GraphNode, GraphEdge, DataSourceCounts, GraphPreset, EntityType } from "@/types/graph";

export const ENTITY_COLORS: Record<EntityType, string> = {
  person: "#3B82F6",
  phone: "#22C55E",
  vehicle: "#F59E0B",
  location: "#F97316",
  organization: "#A855F7",
  account: "#14B8A6",
  case: "#A855F7",
  evidence: "#c1c6d8",
};

export const MOCK_GRAPH_NODES: GraphNode[] = [
  {
    id: "per_a",
    label: "Person A",
    type: "person",
    risk: "high",
    details: {
      subtitle: "Male, 32 Yrs",
      idLabel: "PER_10023",
      connections: 18,
      evidenceCount: 7,
      caseCount: 3,
      riskScore: 85,
      extra: [
        { label: "Network Centrality", value: "High" },
        { label: "Association Risk", value: "High" },
      ],
    },
  },
  {
    id: "per_b",
    label: "Person B",
    type: "person",
    details: { subtitle: "Associate", idLabel: "PER_00871", connections: 6, evidenceCount: 2, caseCount: 1 },
  },
  {
    id: "phone1",
    label: "+91 9123456780",
    type: "phone",
    details: { subtitle: "Burner phone", idLabel: "PHN_442", connections: 3, evidenceCount: 1, caseCount: 1 },
  },
  {
    id: "phone2",
    label: "+91 9876543210",
    type: "phone",
    details: { subtitle: "Registered line", idLabel: "PHN_001", connections: 5, evidenceCount: 2, caseCount: 2 },
  },
  {
    id: "case209",
    label: "Case #209",
    type: "case",
    details: { subtitle: "Cyber Fraud", idLabel: "CASE_209", connections: 32 },
  },
  {
    id: "loc1",
    label: "Mumbai, Maharashtra",
    type: "location",
    details: { subtitle: "Frequent location", idLabel: "LOC_771" },
  },
  {
    id: "loc2",
    label: "Delhi, India",
    type: "location",
    details: { subtitle: "Secondary location", idLabel: "LOC_442" },
  },
  {
    id: "org1",
    label: "XYZ Logistics",
    type: "organization",
    details: { subtitle: "Front company", idLabel: "ORG_992", connections: 14 },
  },
  {
    id: "vehicle1",
    label: "MH01AB1234",
    type: "vehicle",
    details: { subtitle: "Black SUV", idLabel: "VEH_MH01AB" },
  },
  {
    id: "account1",
    label: "Account - 4567",
    type: "account",
    details: { subtitle: "Wire transfers", idLabel: "ACC_4567" },
  },
  {
    id: "case317",
    label: "Case #317",
    type: "case",
    details: { subtitle: "Narcotics", idLabel: "CASE_317" },
  },
  {
    id: "evidence1",
    label: "FIR_101.pdf",
    type: "evidence",
    details: { subtitle: "SHA-256: a1b2c3...f8e9d0", idLabel: "EVD_101" },
  },
];

export const MOCK_GRAPH_EDGES: GraphEdge[] = [
  { id: "e1", from: "per_a", to: "per_b", label: "associate", kind: "suspicious" },
  { id: "e2", from: "per_a", to: "phone1", label: "called", kind: "direct" },
  { id: "e3", from: "per_a", to: "case209", label: "linked to", kind: "temporal" },
  { id: "e4", from: "per_a", to: "loc1", label: "visited", kind: "direct" },
  { id: "e5", from: "per_a", to: "loc2", label: "located at", kind: "direct" },
  { id: "e6", from: "per_a", to: "phone2", label: "owns", kind: "direct" },
  { id: "e7", from: "per_a", to: "org1", label: "owns", kind: "suspicious" },
  { id: "e8", from: "per_a", to: "vehicle1", label: "used in", kind: "direct" },
  { id: "e9", from: "per_a", to: "account1", label: "transferred", kind: "direct" },
  { id: "e10", from: "per_a", to: "case317", label: "evidence", kind: "direct" },
  { id: "e11", from: "per_a", to: "evidence1", label: "evidence", kind: "direct" },
  { id: "e12", from: "vehicle1", to: "account1", label: "temporal", kind: "temporal" },
];

export const MOCK_DATA_SOURCE_COUNTS: DataSourceCounts = {
  fir: 128,
  cdr: 2341,
  financial: 842,
  location: 1256,
};

export const MOCK_GRAPH_PRESETS: GraphPreset[] = [
  { label: "All Entities", cypher: "MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100" },
  { label: "High Risk Targets", cypher: "MATCH (n:Entity {risk: 'high'}) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m" },
  { label: "Phone Networks", cypher: "MATCH (n:Entity {type: 'phone'}) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m" },
];
