import type { AccessLevel } from "./accessControl";

export type RelationshipType =
  | "SHARED_PHONE"
  | "SAME_PERSON"
  | "SAME_SUSPECT"
  | "SAME_VICTIM"
  | "SAME_VEHICLE"
  | "SAME_ADDRESS"
  | "SHARED_EVIDENCE"
  | "SHARED_ORGANIZATION"
  | "SHARED_DIGITAL_IDENTIFIER";

export interface CaseRelationship {
  id: string;
  sourceCaseId: string;
  targetCaseId: string;
  targetCaseTitle: string;
  relationshipType: RelationshipType;
  description: string;
  sharedAttributeValue?: string;
  defaultAccessLevel: AccessLevel;
}

export const RELATIONSHIP_TYPE_CONFIG: Record<
  RelationshipType,
  {
    type: RelationshipType;
    label: string;
    descriptionPattern: string;
    icon: string;
    color: string;
  }
> = {
  SHARED_PHONE: {
    type: "SHARED_PHONE",
    label: "Shared Phone Number",
    descriptionPattern: "Linked because both cases contain common target phone number",
    icon: "call",
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  SAME_PERSON: {
    type: "SAME_PERSON",
    label: "Same Person",
    descriptionPattern: "Linked because both cases involve the same identified person",
    icon: "person",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  SAME_SUSPECT: {
    type: "SAME_SUSPECT",
    label: "Same Suspect",
    descriptionPattern: "Linked because both cases share the same primary suspect target",
    icon: "warning",
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  SAME_VICTIM: {
    type: "SAME_VICTIM",
    label: "Same Victim",
    descriptionPattern: "Linked because both cases share the same reporting victim",
    icon: "shield_person",
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  },
  SAME_VEHICLE: {
    type: "SAME_VEHICLE",
    label: "Same Vehicle",
    descriptionPattern: "Linked because both cases reference the same registered vehicle",
    icon: "directions_car",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  SAME_ADDRESS: {
    type: "SAME_ADDRESS",
    label: "Same Geo Location",
    descriptionPattern: "Linked because both cases share the same physical address / tower sector",
    icon: "location_on",
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
  },
  SHARED_EVIDENCE: {
    type: "SHARED_EVIDENCE",
    label: "Shared Forensic Evidence",
    descriptionPattern: "Linked because both cases reference common forensic evidence files",
    icon: "verified",
    color: "text-teal-400 border-teal-500/30 bg-teal-500/10",
  },
  SHARED_ORGANIZATION: {
    type: "SHARED_ORGANIZATION",
    label: "Shared Organization",
    descriptionPattern: "Linked because both cases connect to the same shell company / org",
    icon: "domain",
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  },
  SHARED_DIGITAL_IDENTIFIER: {
    type: "SHARED_DIGITAL_IDENTIFIER",
    label: "Shared Cyber Indicator",
    descriptionPattern: "Linked because both cases involve matching IP, MAC, or TOR exit nodes",
    icon: "security",
    color: "text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10",
  },
};
