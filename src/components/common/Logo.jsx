'use client'

// logo.png: 500×500px. "livio" text crop coordinates (with padding).
const TEXT_X = 120
const TEXT_Y = 195
const TEXT_W = 245
const TEXT_H = 150
const IMG_SIZE = 500

export default function Logo({ height = 36, className = '' }) {
  const scale = height / TEXT_H
  const containerW = Math.round(TEXT_W * scale)
  const imgPx = Math.round(IMG_SIZE * scale)
  const top = Math.round(-TEXT_Y * scale)
  const left = Math.round(-TEXT_X * scale)

  return (
    <div
      className={className}
      style={{ height, width: containerW, overflow: 'hidden', position: 'relative', flexShrink: 0 }}
      aria-label="Livio"
      role="img"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        aria-hidden
        className="livio-logo-img"
        style={{
          position: 'absolute',
          height: imgPx,
          width: imgPx,
          top,
          left,
          maxWidth: 'none',
        }}
      />
    </div>
  )
}
