"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-entity-risk/30 bg-surface-container p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-entity-risk">error</span>
        <h1 className="mt-3 font-headline-lg text-headline-lg font-bold text-on-surface">Module unavailable</h1>
        <p className="mt-2 text-sm text-on-surface-variant">TRACIA could not load this module. Retry the request or return to the dashboard.</p>
        <button onClick={() => reset()} className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-on-primary hover:bg-primary-fixed">Retry</button>
      </div>
    </div>
  );
}
