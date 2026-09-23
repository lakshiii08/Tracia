import { NextRequest, NextResponse } from "next/server";
import type { AlertItem } from "@/types/alerts";

const CANONICAL_ALERTS: AlertItem[] = [
  {
    id: "alert-301",
    title: "Critical Telemetry: Burner Line +91 9136028471 to Shooter",
    caseId: "TR-302",
    severity: "HIGH",
    time: "5m ago",
    unread: true,
    description: "Intercepted voice coordination between Madhav Singhania's burner line and contract shooter Raj Malhotra (+91 9711843209) near Alibaug toll corridor.",
  },
  {
    id: "alert-302",
    title: "Forensic Ballistics Match: .32 Caliber Firearm",
    caseId: "TR-302",
    severity: "HIGH",
    time: "20m ago",
    unread: true,
    description: "Ballistics lab confirms the weapon seized at Lalita Deshmukh's Pune facility matches the fatal bullets extracted during Mrinal Kulkarni's autopsy.",
  },
  {
    id: "alert-303",
    title: "ANPR Toll Gate Alarm: Scorpio MH02CZ4412",
    caseId: "TR-302",
    severity: "HIGH",
    time: "45m ago",
    unread: true,
    description: "Getaway SUV registered to Lalita Deshmukh flagged fleeing Alibaug toward Mumbai-Pune Expressway at high speed within 35 minutes of the homicide.",
  },
  {
    id: "alert-304",
    title: "AML Banking Flag: ₹50,00,000 Contract Transfer",
    caseId: "TR-302",
    severity: "MEDIUM",
    time: "1h ago",
    unread: false,
    description: "Vanguard CFO Priya Sharma authorized emergency electronic transfer into ICICI shell account 002101928374 withdrawn by Raj Malhotra in New Delhi.",
  },
  {
    id: "alert-305",
    title: "Cross-Case Alert: Madhav Singhania Warrant in Case #NDPS-402",
    caseId: "TR-302",
    severity: "MEDIUM",
    time: "2h ago",
    unread: false,
    description: "Intelligence system matched Madhav Singhania's biometrics to active narcotics syndicate dossier (FIR-402/2024/NDPS, Goa).",
  },
];

let liveAlerts: AlertItem[] = [...CANONICAL_ALERTS];

export async function GET() {
  return NextResponse.json(liveAlerts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newAlert: AlertItem = {
      id: `alert-${Date.now()}`,
      title: body.title || "Investigative Intelligence Alert",
      caseId: body.caseId || "TR-302",
      severity: body.severity || "MEDIUM",
      time: "Just now",
      unread: true,
      description: body.description || "",
    };
    liveAlerts = [newAlert, ...liveAlerts];
    return NextResponse.json(newAlert, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid alert payload" }, { status: 400 });
  }
}
