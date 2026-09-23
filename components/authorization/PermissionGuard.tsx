"use client";

import { useAuthorization } from "@/auth/useAuthorization";
import type { Permission } from "@/types/accessControl";
import type { ReactNode } from "react";

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = useAuthorization();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
