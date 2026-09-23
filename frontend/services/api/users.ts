import type { User, Role } from "@/types/accessControl";
import { apiClient } from "@/services/apiClient";

const unauthenticatedUser: User = {
  id: "anonymous",
  name: "Unauthenticated Operator",
  role: "AUDITOR",
  status: "Signed out",
};

let usersStore: User[] = [];
let activeCurrentUser: User = unauthenticatedUser;

export async function getUsers(): Promise<User[]> {
  return apiClient<User[]>(
    "/api/users",
    { method: "GET" },
    () => [...usersStore]
  );
}

export function getUsersSync(): User[] {
  return [...usersStore];
}

export async function getUserById(userId: string): Promise<User | null> {
  return apiClient<User | null>(
    `/api/users/${encodeURIComponent(userId)}`,
    { method: "GET" },
    () => usersStore.find((u) => u.id === userId || u.operator === userId) || null
  );
}

export function getCurrentUserSync(): User {
  return activeCurrentUser;
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>(
    "/api/auth/me",
    { method: "GET" },
    () => activeCurrentUser
  );
}

export function setCurrentUserSync(userId: string): User {
  const found = usersStore.find((u) => u.id === userId || u.operator === userId);
  if (found) {
    activeCurrentUser = found;
  }
  return activeCurrentUser;
}

export async function setCurrentUser(userId: string): Promise<User> {
  return Promise.resolve(setCurrentUserSync(userId));
}

export async function updateUserRole(userId: string, role: string): Promise<User | null> {
  return apiClient<User | null>(
    `/api/users/${encodeURIComponent(userId)}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) },
    () => {
      let updated: User | null = null;
      usersStore = usersStore.map((u) => {
        if (u.id === userId || u.operator === userId) {
          // Map string to Role enum or fallback
          const upperRole = role.toUpperCase().replace(/\s+/g, "_") as Role;
          updated = { ...u, role: upperRole };
          if (activeCurrentUser.id === u.id) {
            activeCurrentUser = updated;
          }
          return updated;
        }
        return u;
      });
      return updated;
    }
  );
}
