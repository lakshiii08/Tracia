"use client";

import { useAuthorization } from "@/auth/useAuthorization";
import AccessBadge from "../authorization/AccessBadge";
import { ROLE_CONFIGURATIONS } from "@/auth/roles";

export default function AccessRequestsTable() {
  const { accessRequests, approveRequest, rejectRequest } = useAuthorization();

  if (!accessRequests || accessRequests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center text-xs text-outline">
        No pending or past access requests logged.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
      <div className="border-b border-outline-variant bg-surface-container-high p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">key</span>
            Case Access Requests Management
          </h3>
          <p className="text-xs text-on-surface-variant">Review and grant/reject officer escalation access requests for related or restricted cases.</p>
        </div>
        <span className="rounded bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-mono font-bold text-primary">
          {accessRequests.filter((r) => r.status === "PENDING").length} Pending Requests
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-container-high/50 border-b border-outline-variant font-label-mono text-[11px] uppercase text-on-surface-variant">
            <tr>
              <th className="p-3.5">Request ID</th>
              <th className="p-3.5">Officer / Role</th>
              <th className="p-3.5">Case File</th>
              <th className="p-3.5">Current Access</th>
              <th className="p-3.5">Requested</th>
              <th className="p-3.5 max-w-xs">Justification Reason</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {accessRequests.map((req) => {
              const roleConfig = ROLE_CONFIGURATIONS[req.userRole] || { badgeColor: "bg-surface-variant text-on-surface" };
              return (
                <tr key={req.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3.5 font-mono text-primary font-bold">{req.requestId}</td>
                  <td className="p-3.5 font-medium text-on-surface">
                    <div>{req.userName}</div>
                    <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-mono border mt-0.5 ${roleConfig.badgeColor}`}>
                      {req.userRole}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-mono text-primary font-bold">{req.caseId}</div>
                    <div className="text-[11px] text-on-surface-variant max-w-[150px] truncate">{req.caseTitle}</div>
                  </td>
                  <td className="p-3.5">
                    <AccessBadge level={req.currentLevel} size="sm" />
                  </td>
                  <td className="p-3.5">
                    <AccessBadge level={req.requestedLevel} size="sm" />
                  </td>
                  <td className="p-3.5 max-w-xs text-on-surface-variant leading-tight">
                    <p className="line-clamp-2">{req.reason}</p>
                    <span className="text-[10px] text-outline font-mono mt-0.5 block">{req.createdAt}</span>
                  </td>
                  <td className="p-3.5">
                    {req.status === "PENDING" && (
                      <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 font-mono">
                        PENDING REVIEW
                      </span>
                    )}
                    {req.status === "APPROVED" && (
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                        APPROVED
                      </span>
                    )}
                    {req.status === "REJECTED" && (
                      <span className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400 font-mono">
                        REJECTED
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    {req.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => approveRequest(req.id)}
                          className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectRequest(req.id)}
                          className="rounded bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-outline font-mono">Reviewed by {req.reviewedBy || "Admin"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
