export interface CyberIntelEvent {
  id: string;
  ipAddress: string;
  macAddress: string;
  deviceId: string;
  suspect: string;
  eventType: string;
  domain: string;
  isVpnOrTor: boolean;
  riskScore: number;
  timestamp: string;
}

export interface CyberChainNode {
  id: string;
  type: string;
  title: string;
  value: string;
  tone: "blue" | "emerald" | "amber" | "rose" | "purple";
}

export interface CyberChainStep {
  fromNodeId: string;
  toNodeId: string;
  label: string;
}

export interface CyberChain {
  nodes: CyberChainNode[];
  steps: CyberChainStep[];
}
