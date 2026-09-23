import { NextResponse } from "next/server";
import type { CdrMetrics } from "@/types/cdr";

export async function GET() {
  const metrics: CdrMetrics = {
    frequentContactsCount: 14,
    frequentContactsHighlight: "Burner +91 9123456780 ↔ +91 9876543210 (342s peak call)",
    sharedContactsCount: 3,
    sharedContactsHighlight: "XYZ Logistics Transit Hub & Bank Desk",
    communicationClustersCount: 2,
    communicationClustersHighlight: "Mumbai BKC & Delhi Rohini Triangulations",
    crossCaseOverlapsCount: 2,
    crossCaseOverlapsHighlight: "Overlaps Case #209 and Case #317",
  };

  return NextResponse.json(metrics);
}
