import type { CyberIntelEvent, CyberChain } from "@/types/cyberIntel";

export const MOCK_CYBER_EVENTS: CyberIntelEvent[] = [
  {
    id: "CYBER_01",
    ipAddress: "185.220.101.5",
    macAddress: "00:1A:2B:3C:4D:5E",
    deviceId: "DEV_MACBOOK_PRO",
    suspect: "Person A",
    eventType: "TOR Exit Node Connection",
    domain: "darkmarket-node.onion",
    isVpnOrTor: true,
    riskScore: 92,
    timestamp: "2025-05-10 11:00:00",
  },
  {
    id: "CYBER_02",
    ipAddress: "192.168.1.104",
    macAddress: "A4:C3:F0:12:34:56",
    deviceId: "DEV_IPHONE_14",
    suspect: "Vikram Sharma",
    eventType: "Unauthorized Bank Portal Access",
    domain: "secure-banking-portal.com",
    isVpnOrTor: false,
    riskScore: 78,
    timestamp: "2025-05-10 12:15:30",
  },
  {
    id: "CYBER_03",
    ipAddress: "45.154.255.88",
    macAddress: "B2:77:88:99:AA:BB",
    deviceId: "DEV_ANDROID_TAB",
    suspect: "Rahul Sharma",
    eventType: "Encrypted Telegram Channel Activity",
    domain: "t.me/privatesignal",
    isVpnOrTor: true,
    riskScore: 85,
    timestamp: "2025-05-10 14:05:10",
  },
];

export const MOCK_CYBER_CHAIN: CyberChain = {
  nodes: [
    { id: "node-person", type: "PERSON", title: "PERSON", value: "Person A", tone: "blue" },
    { id: "node-device", type: "DEVICE", title: "DEVICE", value: "DEV_MACBOOK_PRO", tone: "emerald" },
    { id: "node-ip", type: "IP ADDRESS", title: "IP ADDRESS", value: "185.220.101.5", tone: "amber" },
    { id: "node-event", type: "CYBER EVENT", title: "CYBER EVENT", value: "TOR Exit Node", tone: "rose" },
    { id: "node-case", type: "CASE", title: "CASE", value: "ACTIVE", tone: "purple" },
  ],
  steps: [
    { fromNodeId: "node-person", toNodeId: "node-device", label: "-[USES]->" },
    { fromNodeId: "node-device", toNodeId: "node-ip", label: "-[CONNECTED_FROM]->" },
    { fromNodeId: "node-ip", toNodeId: "node-event", label: "-[ASSOCIATED_WITH]->" },
    { fromNodeId: "node-event", toNodeId: "node-case", label: "-[RELATED_TO]->" },
  ],
};
