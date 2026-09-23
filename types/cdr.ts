export interface CdrRecord {
  id: string;
  caller: string;
  callerName: string;
  receiver: string;
  receiverName: string;
  durationSec: number;
  timestamp: string;
  towerLocation: string;
  crossCaseOverlap: boolean;
}

export interface CdrRelayNode {
  id: string;
  name: string;
  phone: string;
  role: string;
  tone: "primary" | "amber" | "emerald" | "rose";
}

export interface CdrRelayStep {
  fromNodeId: string;
  toNodeId: string;
  durationSec: number;
  callCount?: number;
}

export interface CdrRelayChain {
  nodes: CdrRelayNode[];
  steps: CdrRelayStep[];
}

export interface CdrMetrics {
  frequentContactsCount: number;
  frequentContactsHighlight: string;
  sharedContactsCount: number;
  sharedContactsHighlight: string;
  communicationClustersCount: number;
  communicationClustersHighlight: string;
  crossCaseOverlapsCount: number;
  crossCaseOverlapsHighlight: string;
}
