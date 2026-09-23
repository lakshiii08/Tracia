export type EntityType =
  | "person"
  | "phone"
  | "vehicle"
  | "location"
  | "organization"
  | "account"
  | "case"
  | "evidence";

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  risk?: "high" | "medium" | "low";
  details: {
    subtitle?: string;
    idLabel?: string;
    connections?: number;
    evidenceCount?: number;
    caseCount?: number;
    riskScore?: number;
    extra?: { label: string; value: string }[];
  };
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  kind: "direct" | "inferred" | "temporal" | "suspicious";
}

export interface DataSourceCounts {
  fir: number;
  cdr: number;
  financial: number;
  location: number;
}

export interface GraphPreset {
  label: string;
  cypher: string;
}
