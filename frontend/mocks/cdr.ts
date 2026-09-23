import type { CdrRecord, CdrRelayChain, CdrMetrics } from "@/types/cdr";

export const MOCK_CDR_RECORDS: CdrRecord[] = [
  {
    id: "cdr-101",
    caller: "+91 9123456780",
    callerName: "Person A (Burner)",
    receiver: "+91 9876543210",
    receiverName: "Vikram Sharma",
    durationSec: 342,
    timestamp: "2025-05-10 09:14:22",
    towerLocation: "Andheri East Tower #14",
    crossCaseOverlap: true,
  },
  {
    id: "cdr-102",
    caller: "+91 9876543210",
    callerName: "Vikram Sharma",
    receiver: "+91 9012345678",
    receiverName: "Rahul Sharma",
    durationSec: 120,
    timestamp: "2025-05-10 09:45:10",
    towerLocation: "Bandra Kurla Complex Tower #03",
    crossCaseOverlap: true,
  },
  {
    id: "cdr-103",
    caller: "+91 9012345678",
    callerName: "Rahul Sharma",
    receiver: "+91 9988776655",
    receiverName: "Priya Nair",
    durationSec: 512,
    timestamp: "2025-05-10 10:12:00",
    towerLocation: "Colaba South Tower #09",
    crossCaseOverlap: false,
  },
  {
    id: "cdr-104",
    caller: "+91 9123456780",
    callerName: "Person A (Burner)",
    receiver: "+91 9988776655",
    receiverName: "Priya Nair",
    durationSec: 88,
    timestamp: "2025-05-10 11:30:45",
    towerLocation: "Navi Mumbai Tower #21",
    crossCaseOverlap: true,
  },
];

export const MOCK_CDR_RELAY_CHAIN: CdrRelayChain = {
  nodes: [
    {
      id: "node-a",
      name: "PHONE A (Burner)",
      phone: "+91 9123456780",
      role: "Originating Burner SIM",
      tone: "primary",
    },
    {
      id: "node-b",
      name: "PHONE B (Vikram Sharma)",
      phone: "+91 9876543210",
      role: "Target Relay Line",
      tone: "amber",
    },
    {
      id: "node-c",
      name: "PHONE C (Rahul Sharma)",
      phone: "+91 9012345678",
      role: "Suspect Destination Line",
      tone: "emerald",
    },
  ],
  steps: [
    {
      fromNodeId: "node-a",
      toNodeId: "node-b",
      durationSec: 342,
      callCount: 1,
    },
    {
      fromNodeId: "node-b",
      toNodeId: "node-c",
      durationSec: 120,
      callCount: 1,
    },
  ],
};

export const MOCK_CDR_METRICS: CdrMetrics = {
  frequentContactsCount: 4,
  frequentContactsHighlight: "Highest frequency: Phone A ↔ Phone B",
  sharedContactsCount: 2,
  sharedContactsHighlight: "Priya Nair (+91 9988776655)",
  communicationClustersCount: 2,
  communicationClustersHighlight: "High temporal frequency cluster",
  crossCaseOverlapsCount: 3,
  crossCaseOverlapsHighlight: "Linked to Active Case",
};
