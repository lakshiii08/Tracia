"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [operatorId, setOperatorId] = useState("");
  const [cipher, setCipher] = useState("");
  const [rememberId, setRememberId] = useState(true);
  const [showCipher, setShowCipher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLight = theme === "pure-white";

  useEffect(() => {
    // Read the remembered Operator ID after mount only — reading localStorage
    // during the initial render would cause a server/client hydration mismatch.
    const saved = window.localStorage.getItem("tracia_operator_id");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setOperatorId(saved);
  }, []);

  async function handleAuthenticate() {
    setError("");
    const normalizedId = operatorId.trim();
    if (!normalizedId || !cipher) {
      setError("Operator ID and Access Cipher are required.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorId: normalizedId, cipher }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Authentication failed.");
        return;
      }
      if (rememberId) window.localStorage.setItem("tracia_operator_id", normalizedId.toUpperCase());
      else window.localStorage.removeItem("tracia_operator_id");
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next?.startsWith("/") ? next : "/dashboard");
    } catch {
      setError("Authentication service is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center text-on-background bg-background px-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant p-6 sm:p-8 flex flex-col gap-6 shadow-xl">
          {/* Branding Logo */}
          <div className="flex flex-col items-center justify-center text-center">
            {/* Dark / Default Theme: TRACIA_black.png */}
            <Image
              src="/assets/TRACIA_black.png"
              alt="TRACIA - Trace, Relationship & Criminal Intelligence Analytics"
              width={320}
              height={320}
              priority
              className={`w-52 sm:w-60 h-auto object-contain rounded-2xl transition-opacity duration-150 ${
                isLight ? "hidden" : "block"
              }`}
            />
            {/* Light Theme: TRACIA_white.png */}
            <Image
              src="/assets/TRACIA_white.png"
              alt="TRACIA - Trace, Relationship & Criminal Intelligence Analytics"
              width={320}
              height={320}
              priority
              className={`w-52 sm:w-60 h-auto object-contain rounded-2xl transition-opacity duration-150 ${
                isLight ? "block" : "hidden"
              }`}
            />
          </div>

          {/* Login Form */}
          <form
            className="flex flex-col gap-4 mt-1"
            onSubmit={(e) => {
              e.preventDefault();
              handleAuthenticate();
            }}
          >
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium text-on-surface-variant"
                htmlFor="operator-id"
              >
                Officer / User ID
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  badge
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-10 pr-3 py-2 text-sm transition-all duration-150 outline-none"
                  id="operator-id"
                  placeholder="e.g. TRACIA-ADMIN"
                  type="text"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-medium text-on-surface-variant"
                htmlFor="cipher"
              >
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  lock
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-10 pr-10 py-2 text-sm transition-all duration-150 outline-none"
                  id="cipher"
                  placeholder="••••••••••••"
                  type={showCipher ? "text" : "password"}
                  value={cipher}
                  onChange={(e) => setCipher(e.target.value)}
                  aria-invalid={Boolean(error)}
                />
                <button
                  type="button"
                  aria-label={showCipher ? "Hide password" : "Show password"}
                  onClick={() => setShowCipher((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-outline hover:text-primary transition"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showCipher ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-entity-risk/30 bg-entity-risk/10 px-3 py-2 text-xs text-error"
              >
                <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberId}
                onChange={(e) => setRememberId(e.target.checked)}
                className="accent-primary rounded"
              />
              Remember ID on this device
            </label>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="mt-2 w-full bg-primary text-on-primary font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[18px]">login</span>
              )}
              {loading ? "Signing In…" : "Sign In"}
            </button>
          </form>

          <div className="border-t border-outline-variant/40 pt-4 text-center">
            <p className="text-xs text-on-surface-variant/70">
              Demo Access: TRACIA-ADMIN / TRACIA-2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
