import type { CaseRelationship } from "@/types/relationships";

export const MOCK_CASE_RELATIONSHIPS: CaseRelationship[] = [
  // C-1001 Relationships
  {
    id: "rel-1001-1045",
    sourceCaseId: "C-1001",
    targetCaseId: "C-1045",
    targetCaseTitle: "Subtle Shell Logistics Syndicate",
    relationshipType: "SHARED_PHONE",
    sharedAttributeValue: "+91 9876543210",
    description: "Linked because both cases contain common target phone number +91 9876543210 (342s intercept history)",
    defaultAccessLevel: "L2",
  },
  {
    id: "rel-1001-1088",
    sourceCaseId: "C-1001",
    targetCaseId: "C-1088",
    targetCaseTitle: "Target Suspect V. Sharma Network",
    relationshipType: "SAME_SUSPECT",
    sharedAttributeValue: "Vikram Sharma (PER_10023)",
    description: "Linked because both cases target the same primary suspect Vikram Sharma (94% entity resolution match)",
    defaultAccessLevel: "L2",
  },
  {
    id: "rel-1001-1102",
    sourceCaseId: "C-1001",
    targetCaseId: "C-1102",
    targetCaseTitle: "Vehicle Fleet Mule Ring",
    relationshipType: "SAME_VEHICLE",
    sharedAttributeValue: "MH-02-CD-5678",
    description: "Linked because both cases reference registered transport vehicle MH-02-CD-5678",
    defaultAccessLevel: "L2",
  },
  {
    id: "rel-1001-1150",
    sourceCaseId: "C-1001",
    targetCaseId: "C-1150",
    targetCaseTitle: "Dark Web Mule Account Cluster",
    relationshipType: "SHARED_DIGITAL_IDENTIFIER",
    sharedAttributeValue: "TOR Exit Node IP 185.220.101.5",
    description: "Linked because both cases logged connections from matching anonymized TOR Exit Node IP 185.220.101.5",
    defaultAccessLevel: "L3",
  },

  // TR-102 Relationships
  {
    id: "rel-tr102-209",
    sourceCaseId: "TR-102",
    targetCaseId: "CASE_209",
    targetCaseTitle: "Project Sentinel",
    relationshipType: "SHARED_ORGANIZATION",
    sharedAttributeValue: "XYZ Logistics Ltd.",
    description: "Linked because both cases connect to shell co XYZ Logistics Ltd. beneficial ownership node",
    defaultAccessLevel: "L2",
  },
  {
    id: "rel-tr102-317",
    sourceCaseId: "TR-102",
    targetCaseId: "CASE_317",
    targetCaseTitle: "Vanguard Syndicate",
    relationshipType: "SHARED_EVIDENCE",
    sharedAttributeValue: "FIR_101.pdf (Hash 0x7f8a)",
    description: "Linked because both cases reference common verified FIR document FIR_101.pdf on Blockchain Custody",
    defaultAccessLevel: "L2",
  },
];
