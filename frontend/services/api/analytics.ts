import type { AnalyticsData, CrossCaseLink, CommunityCluster, BridgeNode, AnomalyItem } from "@/types/analytics";
import { apiClient } from "@/services/apiClient";

let analyticsStore: AnalyticsData = {
  crossCaseLinks: [],
  communities: [],
  bridgeNodes: [],
  anomalies: [],
  sessionId: "",
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
  return apiClient<AnalyticsData>(
    "/api/analytics",
    { method: "GET" },
    () => ({ ...analyticsStore })
  );
}

export async function getCrossCaseLinks(): Promise<CrossCaseLink[]> {
  const data = await getAnalyticsData();
  return data.crossCaseLinks;
}

export async function getCommunities(): Promise<CommunityCluster[]> {
  const data = await getAnalyticsData();
  return data.communities;
}

export async function getBridgeNodes(): Promise<BridgeNode[]> {
  const data = await getAnalyticsData();
  return data.bridgeNodes;
}

export async function getAnomalies(): Promise<AnomalyItem[]> {
  const data = await getAnalyticsData();
  return data.anomalies;
}

export async function runDeepAnalysis(): Promise<{ success: boolean; message: string; anomaliesFound: number }> {
  return apiClient<{ success: boolean; message: string; anomaliesFound: number }>(
    "/api/analytics/deep-analysis",
    { method: "POST" },
    () => ({
      success: true,
      message: "Deep analysis complete — no new anomalies found in this dataset.",
      anomaliesFound: analyticsStore.anomalies.length,
    })
  );
}
