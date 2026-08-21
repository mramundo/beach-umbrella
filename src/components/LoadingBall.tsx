/** Bouncing beach ball loader. */
export function LoadingBall({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10" role="status" aria-live="polite">
      <svg viewBox="0 0 64 64" className="animate-bounce-ball h-14 w-14">
        <circle cx="32" cy="32" r="29" fill="#fff" stroke="var(--color-ink)" strokeWidth="4" />
        <path d="M32 3 A 29 29 0 0 1 32 61 A 46 46 0 0 0 32 3" fill="var(--color-coral-500)" />
        <path d="M32 3 A 29 29 0 0 0 32 61 A 46 46 0 0 1 32 3" fill="var(--color-sea-400)" />
        <path d="M32 3 A 29 29 0 0 1 58 18 A 60 60 0 0 0 32 12 A 60 60 0 0 0 6 18 A 29 29 0 0 1 32 3" fill="var(--color-sun-400)" />
        <circle cx="32" cy="32" r="29" fill="none" stroke="var(--color-ink)" strokeWidth="4" />
      </svg>
      <p className="font-display text-lg font-bold">{label}</p>
    </div>
  )
}
