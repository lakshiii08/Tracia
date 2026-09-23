"use client";

import type { ReactNode } from "react";
import { AppDataProvider } from "@/lib/store";
import { AuthProvider } from "@/auth/useAuthorization";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppDataProvider>{children}</AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
