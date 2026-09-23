import { NextResponse } from "next/server";
import type { CopilotMessage } from "@/types/copilot";

export async function GET() {
  const initialMessages: CopilotMessage[] = [
    {
      role: "assistant",
      text: "TRACIA Intelligence Copilot online. Directly connected to the deployed AI neural engine and live Neo4j Aura knowledge graph. Enter any query regarding active cases, suspects, evidence records, or relational links.",
    },
  ];
  return NextResponse.json(initialMessages);
}
