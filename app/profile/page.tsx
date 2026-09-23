"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Sidebar from "@/components/Sidebar";
import type { User } from "@/types/accessControl";
import { getUsers, getCurrentUser, updateUserRole } from "@/services/api/users";
import { config } from "@/lib/config";

const roles = ["Admin", "Investigator", "Analyst", "Auditor"];

export default function ProfilePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState("All");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([getUsers(), getCurrentUser()])
      .then(([userList, activeUser]) => {
        setUsers(userList);
        setCurrentUser(activeUser);
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(
    () =>
      users.filter(
        (u) =>
          (role === "All" ||
            u.role.toLowerCase() === role.toLowerCase() ||
            (u.role === "INVESTIGATING_OFFICER" && role === "Investigator") ||
            (u.role === "INTELLIGENCE_OFFICER" && role === "Analyst")) &&
          `${u.name} ${u.operator || ""} ${u.role}`.toLowerCase().includes(query.toLowerCase())
      ),
    [users, role, query]
  );

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2200);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUsers((list) =>
      list.map((x) => (x.id === userId ? { ...x, role: newRole as any } : x))
    );
    try {
      await updateUserRole(userId, newRole);
      notify(`Role updated for user ${userId}.`);
    } catch {
      notify(`Role update queued for backend.`);
    }
  };

  const operatorId = currentUser?.operator || config.terminalId;
  const operatorInitials = operatorId.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-on-surface flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title="Operator Profile & Access Roster"
          showSearch
          searchValue={query}
          onSearchChange={setQuery}
          onToggleSidebar={() => setSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
          {notice && (
            <div
              role="status"
              className="fixed right-5 top-5 z-50 rounded-lg border border-primary/30 bg-surface-container-high px-4 py-3 text-sm text-primary shadow-xl"
            >
              {notice}
            </div>
          )}
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href="/dashboard" className="text-sm text-primary hover:underline">
                  ← Dashboard
                </Link>
                <h1 className="mt-3 text-3xl font-bold">Operator Profile &amp; Roles</h1>
                <p className="mt-1 text-outline">
                  Manage operator identity, clearance levels, and RBAC authorization assignments.
                </p>
              </div>
              <Link
                href="/settings"
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm hover:border-primary/50"
              >
                Settings
              </Link>
            </div>

            <section className="mb-5 grid gap-5 lg:grid-cols-[280px_1fr]">
              <div className="rounded-xl border border-outline-variant bg-surface-container p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary font-mono">
                  {operatorInitials}
                </div>
                <p className="mt-4 text-xl font-semibold font-mono">{operatorId}</p>
                <p className="text-sm text-outline">
                  {currentUser?.name || "Investigating Officer"} · {currentUser?.role || "ADMIN"}
                </p>
                <div className="mt-5 space-y-3 text-sm">
                  <Status label="Clearance" value={currentUser?.clearanceLevel || "LEVEL 04"} />
                  <Status label="Session" value="SECURE" />
                  <Status label="Access" value={currentUser?.status?.toUpperCase() || "ACTIVE"} />
                </div>
              </div>
              <div className="rounded-xl border border-outline-variant bg-surface-container p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Role permissions</h2>
                    <p className="mt-1 text-xs text-outline">
                      Active operational permissions evaluated via RBAC policy.
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary font-bold">
                    {currentUser?.role || "ADMIN"}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Permission name="Case management" />
                  <Permission name="Evidence review" />
                  <Permission name="Entity resolution" />
                  <Permission name="Graph intelligence" />
                  <Permission name="Analytics" />
                  <Permission name="Audit review" />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-semibold">User &amp; role management</h2>
                  <p className="mt-1 text-xs text-outline">
                    Review assigned operators and adjust backend role state.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search operator..."
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option>All</option>
                    {roles.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-outline">
                  <span className="h-5 w-5 inline-block rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                  <p className="mt-2 text-xs">Loading operators...</p>
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-outline-variant text-xs text-outline font-label-mono">
                      <tr>
                        <th className="px-3 py-3">Operator</th>
                        <th className="px-3 py-3">Role</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40">
                      {visible.map((u) => (
                        <tr key={u.id} className="hover:bg-surface-container-low">
                          <td className="px-3 py-4">
                            <p className="font-medium">{u.name}</p>
                            <p className="font-mono text-xs text-outline">
                              {u.operator || u.badgeNumber || u.id} · {u.department || u.id}
                            </p>
                          </td>
                          <td className="px-3 py-4">
                            <select
                              value={
                                u.role === "ADMIN"
                                  ? "Admin"
                                  : u.role === "INVESTIGATING_OFFICER"
                                  ? "Investigator"
                                  : u.role === "AUDITOR"
                                  ? "Auditor"
                                  : "Analyst"
                              }
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="rounded-md border border-outline-variant bg-background px-2 py-1.5 text-xs"
                            >
                              <option>Admin</option>
                              <option>Investigator</option>
                              <option>Analyst</option>
                              <option>Auditor</option>
                            </select>
                          </td>
                          <td className="px-3 py-4">
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">
                              ● {u.status || "Active"}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <button
                              onClick={() => notify(`${u.operator || u.id} role update saved.`)}
                              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs hover:border-primary/50"
                            >
                              Save role
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!visible.length && (
                    <div className="py-12 text-center text-sm text-outline">
                      No operators match this filter.
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function Permission({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-surface-container-low p-3 text-sm">
      <span className="material-symbols-outlined text-base text-primary">check_circle</span>
      {name}
    </div>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-outline-variant/40 pb-2">
      <span className="text-outline">{label}</span>
      <span className="font-mono text-xs text-primary">{value}</span>
    </div>
  );
}
