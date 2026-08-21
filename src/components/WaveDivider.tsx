/**
 * Animated wave strip used to separate sections.
 * Two drifting layers of the same repeating wave path, offset for depth.
 */
export function WaveDivider({ flip = false }: { flip?: boolean }) {
  const wave =
    'M0 32 Q 30 8 60 32 T 120 32 T 180 32 T 240 32 T 300 32 T 360 32 T 420 32 T 480 32 V 64 H 0 Z'

  return (
    <div
      aria-hidden="true"
      className={`relative h-12 w-full overflow-hidden sm:h-16 ${flip ? 'rotate-180' : ''}`}
    >
      <svg
        className="animate-drift-slow absolute bottom-0 left-0 h-full w-[200%]"
        viewBox="0 0 960 64"
        preserveAspectRatio="none"
      >
        <path d={wave} fill="var(--color-sea-200)" />
        <path d={wave} transform="translate(480 0)" fill="var(--color-sea-200)" />
      </svg>
      <svg
        className="animate-drift absolute bottom-0 left-0 h-3/4 w-[200%]"
        viewBox="0 0 960 64"
        preserveAspectRatio="none"
      >
        <path d={wave} fill="var(--color-sea-400)" />
        <path d={wave} transform="translate(480 0)" fill="var(--color-sea-400)" />
      </svg>
    </div>
  )
}
