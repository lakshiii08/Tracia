import { NextResponse } from "next/server";

export async function GET() {
  const operators = [
    { id: "usr-admin", name: "Inspector Admin", role: "ADMIN", department: "Cyber Operations Wing", clearance: "TOP_SECRET" },
    { id: "usr-inv-01", name: "Det. J. Smith", role: "INVESTIGATOR", department: "Central Financial Intelligence Unit", clearance: "SECRET" },
    { id: "usr-ana-01", name: "Agent R. Doe", role: "ANALYST", department: "Digital Forensics Division", clearance: "SECRET" },
    { id: "usr-aud-01", name: "Auditor Oversight", role: "AUDITOR", department: "Internal Oversight & Ethics", clearance: "CONFIDENTIAL" },
  ];
  return NextResponse.json(operators);
}
