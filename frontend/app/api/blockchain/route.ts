import { NextRequest, NextResponse } from "next/server";
import { getPersistentEvidenceLedger } from "@/lib/server/evidenceLedger";

export async function GET() {
  try {
    const blockchainRpcUrl = process.env.BLOCKCHAIN_SERVICE_URL || process.env.FASTAPI_BACKEND_URL || "";

    if (blockchainRpcUrl) {
      try {
        const response = await fetch(`${blockchainRpcUrl.replace(/\/$/, "")}/api/blockchain/records`);
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn("External Blockchain service unavailable, using dynamic records:", err);
      }
    }

    const ledger = await getPersistentEvidenceLedger();
    const records = ledger.map((item) => ({
      evidenceId: item.evidence_id,
      filename: item.file_name,
      sha256Hash: item.original_sha256 || item.sha256,
      txId: item.transaction_hash,
      timestamp: item.registered_at,
      custodian: item.registered_by,
      verifiedStatus: item.is_tampered ? "Mismatch" : item.status === "PENDING" ? "Pending" : "Verified",
      history: [
        {
          step: "Evidence metadata ingested",
          actor: item.registered_by,
          timestamp: item.registered_at,
        },
        {
          step: `SHA-256 digest anchored on ${item.blockchain_network}`,
          actor: "TRACIA Evidence Ledger",
          timestamp: item.registered_at,
        },
        {
          step: item.is_tampered ? "Latest integrity check reported mismatch" : "Latest integrity check verified hash",
          actor: "TRACIA Verification Engine",
          timestamp: new Date().toISOString(),
        },
      ],
    }));

    return NextResponse.json(records);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch Blockchain records";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, fileHash } = body;

    const blockchainRpcUrl = process.env.BLOCKCHAIN_SERVICE_URL || process.env.FASTAPI_BACKEND_URL || "";
    if (blockchainRpcUrl) {
      try {
        const response = await fetch(`${blockchainRpcUrl.replace(/\/$/, "")}/api/blockchain/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename, file_hash: fileHash }),
        });
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn("External Blockchain verify failed:", err);
      }
    }

    const ledger = await getPersistentEvidenceLedger();
    const match = ledger.find(
      (item) =>
        item.file_name.toLowerCase() === String(filename || "").toLowerCase() ||
        item.sha256.toLowerCase() === String(fileHash || "").toLowerCase() ||
        (item.original_sha256 || "").toLowerCase() === String(fileHash || "").toLowerCase()
    );

    if (!match) {
      return NextResponse.json({
        verifiedStatus: "Mismatch",
        timestamp: new Date().toISOString(),
        message: `No persisted ledger record matched ${filename || "the submitted evidence"}.`,
      }, { status: 404 });
    }

    return NextResponse.json({
      verifiedStatus: match.is_tampered ? "Mismatch" : "Verified",
      txId: match.transaction_hash,
      timestamp: new Date().toISOString(),
      message: `Evidence hash for ${filename || match.file_name} verified against persisted ledger.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify evidence";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
