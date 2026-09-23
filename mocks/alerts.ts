import type { AlertItem } from "@/types/alerts";

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: "ALT-2041",
    title: "High-risk entity relationship detected",
    caseId: "NF-2026-041",
    severity: "HIGH",
    time: "2 min ago",
    unread: true,
    description: "Probabilistic connection identified between suspect Vikram Sharma and shell account ACC_4567.",
  },
  {
    id: "ALT-2038",
    title: "Evidence integrity verification required",
    caseId: "NF-2026-039",
    severity: "MEDIUM",
    time: "18 min ago",
    unread: true,
    description: "New FIR document uploaded without verified blockchain custody transaction.",
  },
  {
    id: "ALT-2031",
    title: "Unresolved entity match awaiting review",
    caseId: "NF-2026-035",
    severity: "LOW",
    time: "42 min ago",
    unread: false,
    description: "94% similarity score detected between FIR_101 and CDR_RECORDS for suspect V. Sharma.",
  },
  {
    id: "ALT-2027",
    title: "New cross-case connection requires review",
    caseId: "NF-2026-031",
    severity: "MEDIUM",
    time: "1 hr ago",
    unread: false,
    description: "Shared transport vehicle MH-02-CD-5678 detected in Case C-1001 and C-1102.",
  },
];
