import type { EntityMatch } from "@/lib/store";

export const MOCK_ENTITY_QUEUE: EntityMatch[] = [
  {
    id: "match-1",
    similarity: 94,
    sourceA: "FIR_101",
    sourceB: "CDR_RECORDS",
    nameA: "Vikram Sharma",
    nameB: "V. Sharma",
    fieldsA: [
      { label: "Full Name", value: "Vikram Sharma" },
      { label: "Date of Birth", value: "12 Oct 1985 (39 Yrs)" },
      { label: "Phone Number", value: "+91 9876543210" },
      { label: "Primary Address", value: "Apt 4B, Andheri West, Mumbai" },
    ],
    fieldsB: [
      { label: "Full Name", value: "V. Sharma", matched: true },
      { label: "Date of Birth", value: "1985-10-12", matched: true },
      { label: "Phone Number", value: "+91 9876543210", matched: true },
      { label: "Primary Address", value: "No Data Available" },
    ],
  },
  {
    id: "match-2",
    similarity: 87,
    sourceA: "SURVEILLANCE_09",
    sourceB: "VEHICLE_RECORDS",
    nameA: "Rahul Sharma",
    nameB: "R. Sharma",
    fieldsA: [
      { label: "Full Name", value: "Rahul Sharma" },
      { label: "Date of Birth", value: "03 Feb 1990 (35 Yrs)" },
      { label: "Phone Number", value: "+91 9012345678" },
      { label: "Primary Address", value: "Sector 12, Navi Mumbai" },
    ],
    fieldsB: [
      { label: "Full Name", value: "R. Sharma", matched: true },
      { label: "Date of Birth", value: "1990-02-03", matched: true },
      { label: "Phone Number", value: "No Data Available" },
      { label: "Primary Address", value: "Sector 12, Navi Mumbai", matched: true },
    ],
  },
];
