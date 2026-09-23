export type TimelineCategory = "Evidence" | "CDR" | "Device" | "Forensics" | "Transfer";

export interface TimelineEvent {
  id: string;
  time: string;
  date: string;
  title: string;
  category: TimelineCategory;
  description: string;
  actor: string;
  evidenceRef?: string;
}
