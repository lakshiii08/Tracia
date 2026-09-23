export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-on-background flex items-center justify-center" role="status" aria-live="polite" aria-label="Loading TRACIA">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <div className="font-label-mono text-label-mono text-on-surface-variant">LOADING SECURE MODULE…</div>
      </div>
    </div>
  );
}
