export interface CopilotMessage {
  role: "user" | "assistant";
  text: string;
  intent?: string;
  supportingPaths?: string[];
  sources?: string[];
}

export interface CopilotQueryRequest {
  prompt: string;
  caseId?: string;
}

export interface CopilotQueryResponse {
  text: string;
  intent?: string;
  supportingPaths?: string[];
  sources?: string[];
  error?: string;
}
