import { NextResponse } from "next/server";
import type { CdrRelayChain } from "@/types/cdr";

export async function GET() {
  const chain: CdrRelayChain = {
    nodes: [
      {
        id: "rc-node-1",
        name: "Person A",
        phone: "+91 9123456780",
        role: "Primary Syndicate Hub",
        tone: "rose",
      },
      {
        id: "rc-node-2",
        name: "Person B",
        phone: "+91 9876543210",
        role: "Logistics Coordinator",
        tone: "amber",
      },
      {
        id: "rc-node-3",
        name: "XYZ Logistics Transit",
        phone: "+91 9820012345",
        role: "Transport Fleet Dispatch",
        tone: "primary",
      },
      {
        id: "rc-node-4",
        name: "Account Desk (Account 4567)",
        phone: "+91 9811098765",
        role: "Settlement Desk",
        tone: "emerald",
      },
    ],
    steps: [
      {
        fromNodeId: "rc-node-1",
        toNodeId: "rc-node-2",
        durationSec: 342,
        callCount: 6,
      },
      {
        fromNodeId: "rc-node-2",
        toNodeId: "rc-node-3",
        durationSec: 185,
        callCount: 4,
      },
      {
        fromNodeId: "rc-node-1",
        toNodeId: "rc-node-4",
        durationSec: 94,
        callCount: 2,
      },
    ],
  };

  return NextResponse.json(chain);
}
