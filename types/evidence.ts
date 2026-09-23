export type EvidenceStatus = "Uploaded" | "OCR Scanning" | "Extracted" | "Indexed";

export interface EvidenceFile {
  id: string;
  filename: string;
  type: string;
  status: EvidenceStatus;
  progress: number;
}
