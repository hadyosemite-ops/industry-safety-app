// ─────────────────────────────────────────────────────────────────────────────
// PageLoader — fallback Suspense affiché pendant le chargement d'un module
// (code-splitting par route).
// ─────────────────────────────────────────────────────────────────────────────

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-9 h-9 rounded-full border-2 border-[rgba(0,212,255,0.2)] border-t-[#00d4ff] animate-spin"
          aria-hidden="true"
        />
        <span className="text-xs text-[color:var(--text-muted)] font-medium tracking-wide">Chargement…</span>
      </div>
    </div>
  );
}
