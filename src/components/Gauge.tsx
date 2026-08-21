import { useEffect, useState } from 'react'

interface Props {
  /** 0..100 or null (night) */
  value: number | null
  color: string
  label: string
}

/** Semicircular Dip Index gauge with an animated arc. */
export function Gauge({ value, color, label }: Props) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(value ?? 0))
    return () => cancelAnimationFrame(raf)
  }, [value])

  const r = 80
  const circumference = Math.PI * r
  const filled = (animated / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 116" className="w-52 sm:w-60" role="img" aria-label={`${label}: ${value ?? '—'}/100`}>
        <path
          d={`M 20 100 A ${r} ${r} 0 0 1 180 100`}
          fill="none"
          stroke="var(--color-sand-200)"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d={`M 20 100 A ${r} ${r} 0 0 1 180 100`}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="28"
          strokeLinecap="round"
          opacity="0.12"
        />
        <path
          d={`M 20 100 A ${r} ${r} 0 0 1 180 100`}
          fill="none"
          stroke={color}
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
        <text
          x="100"
          y="88"
          textAnchor="middle"
          fontSize="44"
          fontWeight="800"
          fontFamily="var(--font-display)"
          fill="var(--color-ink)"
        >
          {value ?? '—'}
        </text>
        <text
          x="100"
          y="110"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="var(--color-ink-soft)"
        >
          / 100
        </text>
      </svg>
    </div>
  )
}
