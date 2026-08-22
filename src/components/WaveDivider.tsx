/**
 * Animated wave strip used to separate sections.
 * Two drifting layers of the same repeating wave path, offset for depth.
 *
 * Three details keep a hairline from showing along the bottom edge, where the
 * strip meets the section below (it used to appear whenever a layout change,
 * such as switching the chart to a table, moved the page onto fractional
 * device pixels). All three are invisible in normal rendering.
 */
export function WaveDivider() {
  const wave =
    'M0 32 Q 30 8 60 32 T 120 32 T 180 32 T 240 32 T 300 32 T 360 32 T 420 32 T 480 32 V 64 H 0 Z'

  return (
    // -mb-px: the next section overlaps by 1px, so a rounding gap between the
    // two blocks cannot let the page background through.
    <div aria-hidden="true" className="relative -mb-px h-12 w-full overflow-hidden sm:h-16">
      {/*
        Solid ground in the colour of the section below: the drifting waves are
        composited layers, and a layer edge landing on a fractional device pixel
        can leave a hairline. With this behind them it blends sea into sea.
        It sits under the front wave's lowest trough, so it never shows.
      */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-sea-400" />

      {/*
        Both layers are pulled 2px below the strip and clipped by it, so its
        bottom edge falls inside their painted area rather than on its boundary.
      */}
      <svg
        className="animate-drift-slow absolute -bottom-0.5 left-0 h-full w-[200%]"
        viewBox="0 0 960 64"
        preserveAspectRatio="none"
      >
        <path d={wave} fill="var(--color-sea-200)" />
        <path d={wave} transform="translate(480 0)" fill="var(--color-sea-200)" />
      </svg>
      <svg
        className="animate-drift absolute -bottom-0.5 left-0 h-3/4 w-[200%]"
        viewBox="0 0 960 64"
        preserveAspectRatio="none"
      >
        <path d={wave} fill="var(--color-sea-400)" />
        <path d={wave} transform="translate(480 0)" fill="var(--color-sea-400)" />
      </svg>
    </div>
  )
}
