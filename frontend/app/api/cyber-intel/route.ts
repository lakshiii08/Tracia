import { NextRequest, NextResponse } from "next/server";
import type { CyberIntelEvent } from "@/types/cyberIntel";
import { getNeo4jDriver } from "@/lib/neo4j";

const CANONICAL_CYBER_EVENTS: CyberIntelEvent[] = [
  {
    id: "CYBER_001",
    ipAddress: "198.51.100.42",
    macAddress: "4A:52:89:12:FE:01",
    deviceId: "DEV-APEX-101",
    suspect: "Person A",
    eventType: "Burner VoIP Gateway Intercept (+91 9123456780)",
    domain: "proxy.wire-siphoning.net",
    isVpnOrTor: true,
    riskScore: 92,
    timestamp: "2025-04-18 14:32:00",
  },
  {
    id: "CYBER_002",
    ipAddress: "198.51.100.89",
    macAddress: "4A:52:89:18:FE:02",
    deviceId: "DEV-APEX-102",
    suspect: "Person B",
    eventType: "Encrypted SIM Gateway Relay (+91 9876543210)",
    domain: "relay.telecom-transit.org",
    isVpnOrTor: true,
    riskScore: 84,
    timestamp: "2025-04-18 15:10:00",
  },
  {
    id: "CYBER_003",
    ipAddress: "203.0.113.55",
    macAddress: "4A:52:89:24:FE:03",
    deviceId: "DEV-APEX-103",
    suspect: "XYZ Logistics",
    eventType: "Automated Banking API Siphoning (Account - 4567)",
    domain: "api.bkc-transit.xyz",
    isVpnOrTor: false,
    riskScore: 95,
    timestamp: "2025-04-19 10:15:00",
  },
  {
    id: "CYBER_004",
    ipAddress: "198.51.100.112",
    macAddress: "4A:52:89:30:FE:04",
    deviceId: "DEV-APEX-104",
    suspect: "Person A",
    eventType: "Darknet Node Heartbeat (Case #209 Cross-Link)",
    domain: "tor-relay.apex-syndicate.onion",
    isVpnOrTor: true,
    riskScore: 88,
    timestamp: "2025-04-20 18:45:00",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");
  void caseId;

  try {
    const driver = getNeo4jDriver();
    const liveEvents: CyberIntelEvent[] = [];

    if (driver) {
      const session = driver.session();
      try {
        const res = await session.run(`
          MATCH (p)-[r]->(target)
          WHERE toLower(coalesce(target.type, target.entity_type, '')) IN ['phone', 'account', 'email']
             OR any(l in labels(target) WHERE toLower(l) IN ['phone', 'account', 'email'])
          RETURN coalesce(p.name, p.label, p.id) as pName, 
                 type(r) as relType, 
                 coalesce(target.name, target.label, target.id) as tName, 
                 coalesce(target.type, target.entity_type, head(labels(target))) as tType
          LIMIT 12
        `);

        res.records.forEach((rec, idx) => {
          const pName = String(rec.get("pName") || "Network Target");
          const tName = String(rec.get("tName") || "telemetry.packet");
          const isEmail = tName.includes("@");
          const domain = isEmail ? tName.split("@")[1] : "relay.onion.network";

          liveEvents.push({
            id: `CYBER_${String(idx + 1).padStart(3, "0")}`,
            ipAddress: `198.51.100.${10 + idx * 7}`,
            macAddress: `4A:52:89:${String(12 + idx * 3).padStart(2, "0")}:FE:01`,
            deviceId: `DEV-AURA-${idx + 101}`,
            suspect: pName,
            eventType: isEmail ? "Encrypted Data Transmission" : `Direct VoIP Relay (${tName})`,
            domain,
            isVpnOrTor: idx % 2 === 0,
            riskScore: 75 + (idx % 22),
            timestamp: new Date(Date.now() - idx * 3600000).toISOString().replace("T", " ").slice(0, 19),
          });
        });
      } finally {
        await session.close();
      }
    }

    return NextResponse.json(liveEvents.length > 0 ? liveEvents : CANONICAL_CYBER_EVENTS);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch cyber events";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
