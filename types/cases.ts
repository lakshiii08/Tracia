import type { CaseItem } from "@/lib/store";

export interface ExtendedCaseItem extends CaseItem {
  assignedOfficerIds: string[];
  priority: "High" | "Medium" | "Critical" | "Low";
  category: string;
  classification: "Public" | "Confidential" | "Restricted" | "Top Secret";
}
