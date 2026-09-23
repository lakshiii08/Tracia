import type { CdrRecord } from "@/types/cdr";

const CANONICAL_CDR_RECORDS: CdrRecord[] = [
  {
    id: "cdr-301",
    caller: "+91 9136028471",
    callerName: "Madhav Singhania (Burner Line)",
    receiver: "+91 9711843209",
    receiverName: "Raj Malhotra (Shooter Operational Line)",
    durationSec: 184,
    timestamp: "2026-02-14 21:12:05",
    towerLocation: "Bandra West / Pali Hill, Mumbai",
    crossCaseOverlap: true,
  },
  {
    id: "cdr-302",
    caller: "+91 9711843209",
    receiver: "+91 9822055618",
    callerName: "Raj Malhotra (Shooter Operational Line)",
    receiverName: "Lalita Deshmukh (Safehouse Custodian)",
    durationSec: 245,
    timestamp: "2026-02-14 22:30:40",
    towerLocation: "Alibaug Coast Tower 4, Raigad",
    crossCaseOverlap: true,
  },
  {
    id: "cdr-303",
    caller: "+91 9821437890",
    receiver: "+91 9136028471",
    callerName: "Priya Sharma (Vanguard CFO)",
    receiverName: "Madhav Singhania (Burner Line)",
    durationSec: 92,
    timestamp: "2026-02-14 23:05:18",
    towerLocation: "Bandra Kurla Complex (BKC), Mumbai",
    crossCaseOverlap: false,
  },
  {
    id: "cdr-304",
    caller: "+91 9820199411",
    receiver: "+91 9833114562",
    callerName: "Mrinal Kulkarni (Victim)",
    receiverName: "Pooja Verma (Executive Secretary)",
    durationSec: 48,
    timestamp: "2026-02-14 23:42:10",
    towerLocation: "Awas Beach / Alibaug North, Raigad",
    crossCaseOverlap: false,
  },
  {
    id: "cdr-305",
    caller: "+91 9711843209",
    receiver: "+91 9136028471",
    callerName: "Raj Malhotra (Shooter Operational Line)",
    receiverName: "Madhav Singhania (Burner Line)",
    durationSec: 65,
    timestamp: "2026-02-15 00:15:33",
    towerLocation: "Khalapur Toll Plaza / Mumbai-Pune Expressway",
    crossCaseOverlap: true,
  },
  {
    id: "cdr-306",
    caller: "+91 9711843209",
    receiver: "+91 9822055618",
    callerName: "Raj Malhotra (Shooter Operational Line)",
    receiverName: "Lalita Deshmukh (Safehouse Custodian)",
    durationSec: 130,
    timestamp: "2026-02-15 01:45:20",
    towerLocation: "Koregaon Park / Pune Central Tower",
    crossCaseOverlap: true,
  },
  {
    id: "cdr-307",
    caller: "+91 9820199411",
    receiver: "+91 9821437890",
    callerName: "Madhav Singhania (Primary iPhone)",
    receiverName: "Priya Sharma (Vanguard CFO)",
    durationSec: 320,
    timestamp: "2026-02-15 08:30:12",
    towerLocation: "Bandra West, Mumbai",
    crossCaseOverlap: true,
  },
];

export function getAuthorizedCdrRecords(): CdrRecord[] {
  return [...CANONICAL_CDR_RECORDS];
}

export function addAuthorizedCdrRecord(record: CdrRecord): void {
  CANONICAL_CDR_RECORDS.unshift(record);
}
