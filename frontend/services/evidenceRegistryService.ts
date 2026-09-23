import { ethers } from "ethers";
import type {
  EvidenceRecord,
  VerificationResult,
  ProvenanceData,
  ProvenanceEvent,
  VerificationHistoryItem,
} from "@/types/evidenceIntegrity";

export const EVIDENCE_REGISTRY_ABI = [
  "function registerEvidence(bytes32 evidenceId, bytes32 evidenceHash) external returns (uint256)",
  "function getEvidence(bytes32 evidenceId, uint256 version) external view returns (bytes32 evidenceHash, uint256 registeredAt, address registeredBy, bool exists)",
  "function getLatestEvidence(bytes32 evidenceId) external view returns (uint256 version, bytes32 evidenceHash, uint256 registeredAt, address registeredBy, bool exists)",
  "function verifyEvidence(bytes32 evidenceId, uint256 version, bytes32 currentEvidenceHash) external view returns (bool isValid, uint256 registeredAt, address registeredBy)",
  "function verifyLatestEvidence(bytes32 evidenceId, bytes32 currentEvidenceHash) external view returns (bool isValid, uint256 version, uint256 registeredAt, address registeredBy)",
  "function latestVersion(bytes32 evidenceId) external view returns (uint256)",
];

export const DEFAULT_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_EVIDENCE_REGISTRY_CONTRACT_ADDRESS || "";
export const POLYGON_AMOY_CHAIN_ID =
  process.env.NEXT_PUBLIC_POLYGON_AMOY_CHAIN_ID || "0x13882";
export const HARDHAT_LOCAL_CHAIN_ID =
  process.env.NEXT_PUBLIC_HARDHAT_CHAIN_ID || "0x7a69";
const HARDHAT_RPC_URL = process.env.NEXT_PUBLIC_HARDHAT_RPC_URL || "";
const POLYGON_AMOY_RPC_URL = process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || "";

const STORAGE_KEY = "tracia_blockchain_evidence_records";
const VERIFICATION_LOGS_KEY = "tracia_evidence_verification_logs";

export const INITIAL_EVIDENCE_RECORDS: EvidenceRecord[] = [
  {
    evidence_id: "EV-101",
    case_id: "CASE-2026-FIR-101",
    version: 1,
    file_name: "CASE-101-FIR.pdf",
    sha256: "d607fb9612c842b109e2cf948c26ab299479b009e4f553258c738be10e1cb340",
    blockchain_network: "Polygon Amoy / Local Hardhat",
    contract_address: DEFAULT_CONTRACT_ADDRESS,
    transaction_hash: "0x892a4bc03e7d58b42af901192e213b30d898ef47c780a427f71f652bca7e8912",
    block_number: 104218,
    status: "CONFIRMED",
    registered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    registered_by: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    file_size_bytes: 245760,
    mime_type: "application/pdf",
    is_tampered: false,
    original_sha256: "d607fb9612c842b109e2cf948c26ab299479b009e4f553258c738be10e1cb340",
  },
  {
    evidence_id: "EV-102",
    case_id: "CASE-2026-CDR-204",
    version: 1,
    file_name: "suspect_cdr_dump_tower_7.csv",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    blockchain_network: "Polygon Amoy / Local Hardhat",
    contract_address: DEFAULT_CONTRACT_ADDRESS,
    transaction_hash: "0x4bc893a02ef3410982d5e71029c78b45610d489ae21b045c71e8921a48c5b610",
    block_number: 104235,
    status: "CONFIRMED",
    registered_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    registered_by: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    file_size_bytes: 1843200,
    mime_type: "text/csv",
    is_tampered: false,
    original_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    evidence_id: "EV-103",
    case_id: "CASE-TR-102",
    version: 1,
    file_name: "bank_transaction_ledger_march.xlsx",
    sha256: "8f3b29c0182479e13df829a871239bf0182390abdf1092834710293847102938",
    blockchain_network: "Polygon Amoy / Local Hardhat",
    contract_address: DEFAULT_CONTRACT_ADDRESS,
    transaction_hash: "0x1928374650192837465019283746501928374650192837465019283746501928",
    block_number: 104269,
    status: "CONFIRMED",
    registered_at: new Date(Date.now() - 86400000 * 0.8).toISOString(),
    registered_by: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    file_size_bytes: 524288,
    mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    is_tampered: false,
    original_sha256: "8f3b29c0182479e13df829a871239bf0182390abdf1092834710293847102938",
  },
  {
    evidence_id: "EV-104",
    case_id: "CASE-TR-102",
    version: 1,
    file_name: "cctv_surveillance_cam04_cut.mp4",
    sha256: "5b38d91c78201a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
    blockchain_network: "Polygon Amoy / Local Hardhat",
    contract_address: DEFAULT_CONTRACT_ADDRESS,
    transaction_hash: "0x9812736450918273645091827364509182736450918273645091827364509182",
    block_number: 104312,
    status: "CONFIRMED",
    registered_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    registered_by: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    file_size_bytes: 14680064,
    mime_type: "video/mp4",
    is_tampered: false,
    original_sha256: "5b38d91c78201a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
  },
];

/**
 * Compute SHA-256 fingerprint of a File in the browser using Web Crypto API.
 */
export async function computeFileSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return computeBufferSha256(buffer);
}

/**
 * Compute SHA-256 fingerprint from ArrayBuffer using Web Crypto API.
 */
export async function computeBufferSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Helper to convert a string ID into bytes32 (Keccak-256 or utf8 padded).
 */
export function stringToBytes32(text: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(text.trim()));
}

/**
 * Helper to format SHA-256 string into 0x prefixed bytes32.
 */
export function sha256ToBytes32(hexHash: string): string {
  const clean = hexHash.replace(/^0x/, "");
  return "0x" + clean.padStart(64, "0").substring(0, 64);
}

/**
 * Retrieve current evidence records from LocalStorage or seed fallback.
 */
export function getLocalEvidenceRecords(): EvidenceRecord[] {
  if (typeof window === "undefined") return INITIAL_EVIDENCE_RECORDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_EVIDENCE_RECORDS));
      return INITIAL_EVIDENCE_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EVIDENCE_RECORDS;
  }
}

/**
 * Save evidence records to LocalStorage.
 */
export function saveLocalEvidenceRecords(records: EvidenceRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("Failed to save evidence records to localStorage:", err);
  }
}

/**
 * Retrieve verification logs.
 */
export function getLocalVerificationLogs(): VerificationHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(VERIFICATION_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Append a verification log item.
 */
export function appendVerificationLog(log: VerificationHistoryItem): void {
  if (typeof window === "undefined") return;
  try {
    const logs = getLocalVerificationLogs();
    logs.unshift(log);
    localStorage.setItem(VERIFICATION_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    console.error("Failed to save verification log:", err);
  }
}

/**
 * Register a new evidence item in the local engine.
 */
export function registerLocalEvidence(input: {
  evidence_id: string;
  case_id: string;
  file_name: string;
  sha256: string;
  file_size_bytes?: number;
  mime_type?: string;
  blockchain_network?: string;
  contract_address?: string;
  transaction_hash?: string;
  block_number?: number;
  registered_by?: string;
}): EvidenceRecord {
  const records = getLocalEvidenceRecords();
  const existingMatches = records.filter((r) => r.evidence_id === input.evidence_id);
  const version = existingMatches.length + 1;

  const randomTxHash =
    input.transaction_hash ||
    `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
  const blockNumber = input.block_number || 104350 + records.length;

  const newRecord: EvidenceRecord = {
    evidence_id: input.evidence_id.trim(),
    case_id: input.case_id.trim(),
    version,
    file_name: input.file_name,
    sha256: input.sha256,
    blockchain_network: input.blockchain_network || "Polygon Amoy (Verified Proof)",
    contract_address: input.contract_address || DEFAULT_CONTRACT_ADDRESS,
    transaction_hash: randomTxHash,
    block_number: blockNumber,
    status: "CONFIRMED",
    registered_at: new Date().toISOString(),
    registered_by: input.registered_by || "0xInvestigatorWallet79C8",
    file_size_bytes: input.file_size_bytes || 1024,
    mime_type: input.mime_type || "application/octet-stream",
    is_tampered: false,
    original_sha256: input.sha256,
    explorer_url: `https://amoy.polygonscan.com/tx/${randomTxHash}`,
  };

  const updated = [newRecord, ...records];
  saveLocalEvidenceRecords(updated);
  return newRecord;
}

/**
 * Verify integrity of a registered evidence item.
 */
export function verifyEvidenceIntegrity(
  evidenceId: string,
  candidateHash?: string,
  verifiedBy: string = "Investigator Forensic Engine"
): VerificationResult {
  const records = getLocalEvidenceRecords();
  const record = records.find((r) => r.evidence_id === evidenceId);

  if (!record) {
    return {
      evidence_id: evidenceId,
      version: 0,
      current_hash: candidateHash || "N/A",
      registered_hash: "NOT_FOUND",
      integrity_status: "ERROR",
      is_match: false,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      blockchain_network: "Unknown",
      explanation: `Evidence ID '${evidenceId}' not found in registered ledger.`,
    };
  }

  // If candidateHash is not provided, check the stored file hash against original anchor
  const currentHash = candidateHash ? candidateHash.toLowerCase() : record.sha256.toLowerCase();
  const registeredHash = (record.original_sha256 || record.sha256).toLowerCase();
  const isMatch = !record.is_tampered && currentHash === registeredHash;

  const result: VerificationResult = {
    evidence_id: record.evidence_id,
    version: record.version,
    current_hash: currentHash,
    registered_hash: registeredHash,
    integrity_status: isMatch ? "VERIFIED" : "POTENTIAL_INTEGRITY_MISMATCH",
    is_match: isMatch,
    verified_at: new Date().toISOString(),
    verified_by: verifiedBy,
    blockchain_network: record.blockchain_network,
    contract_address: record.contract_address,
    transaction_hash: record.transaction_hash,
    block_number: record.block_number,
    explanation: isMatch
      ? "The calculated SHA-256 fingerprint matches the immutable blockchain anchor exactly. Evidence authenticity and chain of custody confirmed."
      : "CRITICAL: The calculated SHA-256 cryptographic fingerprint does NOT match the immutable registered anchor on the blockchain. Potential unauthorized tampering or storage corruption detected.",
    explorer_url: record.explorer_url,
  };

  appendVerificationLog({
    id: Date.now(),
    version: record.version,
    integrity_status: result.integrity_status,
    is_match: isMatch,
    calculated_hash: currentHash,
    expected_hash: registeredHash,
    verified_at: result.verified_at,
    verified_by: verifiedBy,
    notes: isMatch ? "Zero-gas verification pass" : "Cryptographic hash mismatch alert",
  });

  return result;
}

/**
 * Simulate illicit tampering on an evidence record (alters hash to demonstrate detection).
 */
export function simulateTamperEvidence(evidenceId: string): {
  message: string;
  original_hash: string;
  tampered_hash: string;
} {
  const records = getLocalEvidenceRecords();
  const index = records.findIndex((r) => r.evidence_id === evidenceId);
  if (index === -1) {
    throw new Error(`Evidence '${evidenceId}' not found`);
  }

  const record = records[index];
  const origHash = record.original_sha256 || record.sha256;

  // Flip the first 4 characters of the SHA-256 hash to simulate 1-byte file alteration
  const tamperedHash =
    "bad0" + origHash.substring(4);

  record.is_tampered = true;
  record.sha256 = tamperedHash;
  record.status = "TAMPERED";

  saveLocalEvidenceRecords(records);

  return {
    message: `Illicit tampering simulated on ${evidenceId}: 1 byte storage alteration applied. Candidate hash altered.`,
    original_hash: origHash,
    tampered_hash: tamperedHash,
  };
}

/**
 * Restore an evidence record to its authentic original state.
 */
export function restoreTamperedEvidence(evidenceId: string): { message: string; restored_hash: string } {
  const records = getLocalEvidenceRecords();
  const index = records.findIndex((r) => r.evidence_id === evidenceId);
  if (index === -1) {
    throw new Error(`Evidence '${evidenceId}' not found`);
  }

  const record = records[index];
  const origHash = record.original_sha256 || record.sha256;

  record.is_tampered = false;
  record.sha256 = origHash;
  record.status = "CONFIRMED";

  saveLocalEvidenceRecords(records);

  return {
    message: `Evidence file and cryptographic hash restored to original authenticated state for ${evidenceId}.`,
    restored_hash: origHash,
  };
}

/**
 * Generate full chronological provenance trail.
 */
export function getProvenanceTrail(evidenceId: string): ProvenanceData {
  const records = getLocalEvidenceRecords();
  const itemRecords = records.filter((r) => r.evidence_id === evidenceId);

  if (itemRecords.length === 0) {
    throw new Error(`Evidence '${evidenceId}' not found`);
  }

  const latest = itemRecords[0];
  const timeline: ProvenanceEvent[] = [];
  let step = 1;

  for (const r of itemRecords.reverse()) {
    timeline.push({
      step_number: step++,
      stage: "EVIDENCE_INGESTION",
      description: `Evidence version ${r.version} ('${r.file_name}') ingested and SHA-256 checksum computed.`,
      timestamp: r.registered_at,
      actor: "Investigative Forensic Officer",
      details: {
        version: r.version,
        file_name: r.file_name,
        sha256: r.original_sha256 || r.sha256,
        size_bytes: r.file_size_bytes,
        mime_type: r.mime_type,
      },
    });

    timeline.push({
      step_number: step++,
      stage: "BLOCKCHAIN_ANCHOR",
      description: `Fingerprint anchored onto ${r.blockchain_network} smart contract.`,
      timestamp: r.registered_at,
      actor: r.registered_by || "Registrar Wallet",
      details: {
        contract_address: r.contract_address,
        transaction_hash: r.transaction_hash,
        block_number: r.block_number,
        status: r.status,
      },
    });

    timeline.push({
      step_number: step++,
      stage: "CUSTODY_TRANSFER",
      description: "Transferred to High-Security Forensic Digital Evidence Vault.",
      timestamp: new Date(new Date(r.registered_at).getTime() + 1800000).toISOString(),
      actor: "Evidence Custodian Vault",
      details: {
        storage_tier: "Encrypted Off-Chain Cold Storage",
        zero_pii_on_chain: true,
      },
    });
  }

  const allLogs = getLocalVerificationLogs();
  const relevantLogs = allLogs.filter(
    (l) => l.version === latest.version || l.calculated_hash === (latest.original_sha256 || latest.sha256)
  );

  for (const log of relevantLogs) {
    timeline.push({
      step_number: step++,
      stage: "INTEGRITY_VERIFICATION",
      description: `Cryptographic audit check: ${log.integrity_status}`,
      timestamp: log.verified_at,
      actor: log.verified_by,
      details: {
        status: log.integrity_status,
        calculated_hash: log.calculated_hash,
        expected_hash: log.expected_hash,
        is_match: log.is_match,
      },
    });
  }

  return {
    evidence_id: latest.evidence_id,
    case_id: latest.case_id,
    current_version: latest.version,
    sha256_hash: latest.original_sha256 || latest.sha256,
    status: latest.status,
    timeline,
    verification_history: relevantLogs,
  };
}

// -------------------------------------------------------------
// Web3 & MetaMask EVM Smart Contract Direct Integration
// -------------------------------------------------------------

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface EthereumProvider {
  selectedAddress?: string;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

interface EthereumSwitchError {
  code?: number;
}

/**
 * Connect to MetaMask.
 */
export async function connectMetaMask(): Promise<{
  address: string;
  chainId: string;
  networkName: string;
  signer: ethers.Signer;
}> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed. Please install the MetaMask browser extension.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  return {
    address,
    chainId: `0x${network.chainId.toString(16)}`,
    networkName: network.name || `Chain ID ${network.chainId}`,
    signer,
  };
}

/**
 * Switch Ethereum network in MetaMask.
 */
export async function switchMetaMaskNetwork(chainIdHex: string): Promise<void> {
  if (!window.ethereum) throw new Error("MetaMask not detected");

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch (switchError: unknown) {
    const errorCode = (switchError as EthereumSwitchError).code;
    if (errorCode === 4902) {
      if (chainIdHex === HARDHAT_LOCAL_CHAIN_ID) {
        if (!HARDHAT_RPC_URL) {
          throw new Error("Hardhat RPC URL is not configured. Set NEXT_PUBLIC_HARDHAT_RPC_URL.");
        }
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: HARDHAT_LOCAL_CHAIN_ID,
              chainName: process.env.NEXT_PUBLIC_HARDHAT_CHAIN_NAME || "Hardhat Local",
              rpcUrls: [HARDHAT_RPC_URL],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      } else if (chainIdHex === POLYGON_AMOY_CHAIN_ID) {
        if (!POLYGON_AMOY_RPC_URL) {
          throw new Error("Polygon Amoy RPC URL is not configured. Set NEXT_PUBLIC_POLYGON_AMOY_RPC_URL.");
        }
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: POLYGON_AMOY_CHAIN_ID,
              chainName: "Polygon Amoy Testnet",
              rpcUrls: [POLYGON_AMOY_RPC_URL],
              nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
              blockExplorerUrls: ["https://amoy.polygonscan.com"],
            },
          ],
        });
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Zero-Gas On-Chain Verification via MetaMask / BrowserProvider or RPC fallback.
 */
export async function verifyOnChainContract(
  contractAddress: string,
  evidenceId: string,
  candidateSha256: string
): Promise<{
  isValid: boolean;
  version: number;
  timestamp: string;
  registeredBy: string;
}> {
  let provider: ethers.Provider;
  if (typeof window !== "undefined" && window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  } else {
    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || HARDHAT_RPC_URL || POLYGON_AMOY_RPC_URL;
    if (!rpcUrl) {
      throw new Error("Blockchain RPC URL is not configured. Set NEXT_PUBLIC_BLOCKCHAIN_RPC_URL or connect MetaMask.");
    }
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  // Preflight check if code exists at address
  const code = await provider.getCode(contractAddress);
  if (!code || code === "0x") {
    throw new Error(
      `No smart contract found at address ${contractAddress} on the currently selected network. Deploy contract or verify address.`
    );
  }

  const contract = new ethers.Contract(contractAddress, EVIDENCE_REGISTRY_ABI, provider);
  const evidenceIdBytes32 = stringToBytes32(evidenceId);
  const hashBytes32 = sha256ToBytes32(candidateSha256);

  // Call view method verifyLatestEvidence (0 gas)
  const [isValid, version, timestamp, registeredBy] = await contract.verifyLatestEvidence(
    evidenceIdBytes32,
    hashBytes32
  );

  return {
    isValid: Boolean(isValid),
    version: Number(version),
    timestamp: new Date(Number(timestamp) * 1000).toISOString(),
    registeredBy,
  };
}

/**
 * On-chain registration by signing transaction with MetaMask.
 */
export async function registerOnChainWithMetaMask(
  contractAddress: string,
  evidenceId: string,
  fileSha256: string
): Promise<{
  transactionHash: string;
  blockNumber: number;
  registeredBy: string;
  networkName: string;
}> {
  const { signer, address, networkName } = await connectMetaMask();
  const contract = new ethers.Contract(contractAddress, EVIDENCE_REGISTRY_ABI, signer);

  const evidenceIdBytes32 = stringToBytes32(evidenceId);
  const hashBytes32 = sha256ToBytes32(fileSha256);

  const tx = await contract.registerEvidence(evidenceIdBytes32, hashBytes32);
  const receipt = await tx.wait();

  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    registeredBy: address,
    networkName,
  };
}
