import type { AccessLevel, AccessRequest, Role } from "@/types/accessControl";
import { apiClient } from "@/services/apiClient";

let accessRequestsStore: AccessRequest[] = [];

export async function getAccessRequests(): Promise<AccessRequest[]> {
  return apiClient<AccessRequest[]>(
    "/api/access-requests",
    { method: "GET" },
    () => [...accessRequestsStore]
  );
}

export function getAccessRequestsSync(): AccessRequest[] {
  return [...accessRequestsStore];
}

export async function createAccessRequest(data: {
  userId: string;
  userName: string;
  userRole: Role;
  caseId: string;
  caseTitle: string;
  currentLevel: AccessLevel;
  requestedLevel: AccessLevel;
  reason: string;
}): Promise<AccessRequest> {
  return apiClient<AccessRequest>(
    "/api/access-requests",
    { method: "POST", body: JSON.stringify(data) },
    () => {
      const count = accessRequestsStore.length + 1;
      const newReq: AccessRequest = {
        id: `req-${100 + count}`,
        requestId: `AR-2025-00${count}`,
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        caseId: data.caseId,
        caseTitle: data.caseTitle,
        currentLevel: data.currentLevel,
        requestedLevel: data.requestedLevel,
        reason: data.reason,
        status: "PENDING",
        createdAt: new Date().toLocaleString(),
      };

      accessRequestsStore = [newReq, ...accessRequestsStore];
      return newReq;
    }
  );
}

export async function approveAccessRequest(
  requestId: string,
  reviewerName: string = "Inspector A. Admin"
): Promise<AccessRequest | null> {
  return apiClient<AccessRequest | null>(
    `/api/access-requests/${encodeURIComponent(requestId)}/approve`,
    { method: "POST", body: JSON.stringify({ reviewerName }) },
    () => {
      let updated: AccessRequest | null = null;
      accessRequestsStore = accessRequestsStore.map((req) => {
        if (req.id === requestId || req.requestId === requestId) {
          updated = {
            ...req,
            status: "APPROVED",
            updatedAt: new Date().toLocaleString(),
            reviewedBy: reviewerName,
          };
          return updated;
        }
        return req;
      });
      return updated;
    }
  );
}

export async function rejectAccessRequest(
  requestId: string,
  reviewerName: string = "Inspector A. Admin"
): Promise<AccessRequest | null> {
  return apiClient<AccessRequest | null>(
    `/api/access-requests/${encodeURIComponent(requestId)}/reject`,
    { method: "POST", body: JSON.stringify({ reviewerName }) },
    () => {
      let updated: AccessRequest | null = null;
      accessRequestsStore = accessRequestsStore.map((req) => {
        if (req.id === requestId || req.requestId === requestId) {
          updated = {
            ...req,
            status: "REJECTED",
            updatedAt: new Date().toLocaleString(),
            reviewedBy: reviewerName,
          };
          return updated;
        }
        return req;
      });
      return updated;
    }
  );
}
