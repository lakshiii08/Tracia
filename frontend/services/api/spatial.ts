/**
 * TRACIA Spatial Intelligence Service
 * Consumes the deployed Spatial API at https://criminal-network-api-latest.onrender.com/docs
 * Provides GeoJSON Point features, location analytics, and multi-case fallbacks.
 */

import { isMockEnabled } from "@/lib/config";

export interface SpatialFeatureProperties {
  entity_id: string;
  entity_name: string;
  entity_type: "person" | "phone" | "vehicle" | "location" | "account" | "organization" | "evidence";
  case_id: string;
  relationship_context: string;
  date_time: string;
  evidence_id?: string;
  evidence_text?: string;
  source_document?: string;
  page_number?: string;
  extraction_confidence?: number | string;
  location: string;
  coordinates_available: boolean;
  pin_type?: "crime_scene" | "suspect_sighting" | "cell_tower" | "cyber_telemetry" | "financial_wire" | "safehouse";
  analytics?: {
    centrality?: { degree?: number; betweenness?: number; closeness?: number };
    community?: { community_id?: number; label?: string };
  };
  investigative_lead?: {
    recommendation?: string;
    priority?: "High" | "Critical" | "Medium";
    confidence?: number;
  };
}

export interface SpatialFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: SpatialFeatureProperties;
}

export interface SpatialMapResponse {
  type: "FeatureCollection";
  case_id: string;
  features: SpatialFeature[];
  unmapped_locations: SpatialFeatureProperties[];
  notice?: string;
}

const SPATIAL_API_BASE = "/api/map";


/**
 * List available cases with spatial data from the remote API, or mock data if enabled.
 */
export async function listMapCases(): Promise<string[]> {
  const mockActive = isMockEnabled();
  if (mockActive) {
    return [];
  }

  const res = await fetch("/api/cases", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Spatial API error ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  if (Array.isArray(data.cases)) return data.cases.map((c: { case_id: string }) => c.case_id);
  if (Array.isArray(data)) {
    return data
      .map((c: { id?: string; case_id?: string }) => c.case_id || c.id)
      .filter((id): id is string => Boolean(id));
  }
  return [];
}

/**
 * Fetch GeoJSON map data for a case with optional filters.
 * When mock data is disabled, queries Render API directly without fallback.
 */
export async function getCaseMapData(
  caseId: string,
  options?: {
    entityId?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<SpatialMapResponse> {
  const normCaseId = (caseId || "TR-102").toUpperCase();
  const mockActive = isMockEnabled();

  // If mock data is explicitly enabled via env
  if (mockActive) {
    return {
      type: "FeatureCollection",
      case_id: normCaseId,
      features: [],
      unmapped_locations: [],
      notice: "Mock spatial data is disabled. Connect the Spatial Intelligence API to show AI pinpoints.",
    };
  }

  // Real data from Render Spatial API (no fallback to mock)
  const queryParams = new URLSearchParams();
  if (options?.entityId) queryParams.set("entity_id", options.entityId);
  if (options?.entityType) queryParams.set("entity_type", options.entityType);
  if (options?.dateFrom) queryParams.set("date_from", options.dateFrom);
  if (options?.dateTo) queryParams.set("date_to", options.dateTo);

  const qs = queryParams.toString();
  const url = `${SPATIAL_API_BASE}/case/${encodeURIComponent(normCaseId)}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Spatial API error ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}
