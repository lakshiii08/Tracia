import type { GraphNode, GraphEdge, DataSourceCounts, GraphPreset } from "@/types/graph";
import { apiClient } from "@/services/apiClient";

let customNodesStore: GraphNode[] = [];
let customEdgesStore: GraphEdge[] = [];

export async function getGraphData(caseId?: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
    `/api/graph/data${query}`,
    { method: "GET" },
    () => ({ nodes: [...customNodesStore], edges: [...customEdgesStore] })
  );
}

export function getGraphDataSync(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return { nodes: [...customNodesStore], edges: [...customEdgesStore] };
}

export async function getDataSourceCounts(caseId?: string): Promise<DataSourceCounts> {
  const query = caseId ? `?caseId=${encodeURIComponent(caseId)}` : "";
  return apiClient<DataSourceCounts>(
    `/api/graph/sources${query}`,
    { method: "GET" },
    () => ({ fir: 0, cdr: 0, financial: 0, location: 0 })
  );
}

export async function getGraphPresets(): Promise<GraphPreset[]> {
  return apiClient<GraphPreset[]>(
    "/api/graph/presets",
    { method: "GET" },
    () => []
  );
}

export async function runCypherQuery(cypher: string): Promise<{
  connected: boolean;
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  error?: string;
}> {
  return apiClient<{
    connected: boolean;
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    error?: string;
  }>(
    `/api/graph?cypher=${encodeURIComponent(cypher)}`,
    { method: "GET" },
    () => ({
      connected: false,
      nodes: [...customNodesStore],
      edges: [...customEdgesStore],
    })
  );
}

export async function seedNeo4jDatabase(): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(
    "/api/graph/seed",
    { method: "POST" },
    () => ({
      success: true,
      message: "Seed endpoint is unavailable without live Neo4j data.",
    })
  );
}
