'use client'

import { useId } from 'react'

/* Auth: fixed modest size so login/signup never blow up to full viewport */
const ICON_RESPONSIVE = {
  auth: 'h-16 w-16 shrink-0 sm:h-20 sm:w-20',
  sm: 'h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 lg:h-12 lg:w-12 xl:h-14 xl:w-14',
  md: 'h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 2xl:h-[4.5rem] 2xl:w-[4.5rem]',
  lg: 'h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-[4.5rem] lg:w-[4.5rem] xl:h-20 xl:w-20 2xl:h-24 2xl:w-24',
}

const FULL_RESPONSIVE = {
  sm: 'h-9 w-auto max-w-[min(100%,16rem)] sm:h-10 md:h-12 lg:h-14 xl:h-16',
  md: 'h-10 w-auto max-w-full sm:h-12 md:h-14 lg:h-16 xl:h-[4.5rem] 2xl:h-20',
  lg: 'h-12 w-auto max-w-full sm:h-14 md:h-16 lg:h-20 xl:h-24 2xl:h-[6.5rem]',
}

/* Sea-forward palette + rose accent (spark), not copied from stock marks */
const SEA = {
  ink: '#134e4a',
  deep: '#0f766e',
  core: '#0d9488',
  bright: '#14b8a6',
  ring: '#99f6e4',
  mist: '#ccfbf1',
  rose: '#fb7185',
}

/**
 * Custom responsive logo: scales up on larger breakpoints.
 * @param {boolean} animated Orbit motion (honours prefers-reduced-motion via CSS)
 */
export default function Logo({ variant = 'full', size = 'md', className = '', animated = true }) {
  const uid = useId().replace(/:/g, '')
  const gCore = `livio-core-${uid}`
  const gShine = `livio-shine-${uid}`
  const orbitClass = animated ? 'livio-logo-orbit' : ''

  const orbiting = (
    <g className={orbitClass} style={{ transformOrigin: '32px 32px' }}>
      <g transform="translate(32,32)">
        <circle
          r="26"
          fill="none"
          stroke={SEA.ring}
          strokeWidth="1.75"
          strokeDasharray="5 11"
          opacity="0.9"
        />
        <circle cx="0" cy="-22" r="3.3" fill={SEA.ink} />
        <circle cx="-19.05" cy="11" r="2.85" fill={SEA.core} />
        <circle cx="19.05" cy="11" r="2.85" fill={SEA.rose} />
      </g>
    </g>
  )

  const coreDefs = (
    <defs>
      <linearGradient id={gCore} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={SEA.deep} />
        <stop offset="50%" stopColor={SEA.core} />
        <stop offset="100%" stopColor={SEA.bright} />
      </linearGradient>
      <radialGradient id={gShine} cx="35%" cy="30%" r="65%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
  )

  const coreDisc = (
    <>
      <circle cx="32" cy="32" r="15.5" fill={`url(#${gCore})`} />
      <circle cx="32" cy="32" r="15.5" fill={`url(#${gShine})`} />
      <circle
        cx="32"
        cy="32"
        r="15.5"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="0.75"
      />
    </>
  )

  const iconClass = `${ICON_RESPONSIVE[size] ?? ICON_RESPONSIVE.md} ${size === 'auth' ? '' : 'max-w-[min(10rem,92vw)]'}`

  if (variant === 'icon') {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`}>
        <svg
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          className={iconClass}
          style={
            size === 'auth'
              ? { display: 'block', maxWidth: 'min(5.5rem, 32vw)', maxHeight: 'min(5.5rem, 32vw)' }
              : { display: 'block' }
          }
        >
          {coreDefs}
          <circle cx="32" cy="32" r="30" fill={SEA.mist} opacity="0.55" />
          {orbiting}
          {coreDisc}
        </svg>
      </span>
    )
  }

  const gCoreF = `${gCore}-wordmark`
  const gShineF = `${gShine}-wordmark`

  const fullClass = `${FULL_RESPONSIVE[size] ?? FULL_RESPONSIVE.md} ${className}`.trim()

  return (
    <span className="inline-flex max-w-full items-center leading-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 300 72"
        role="img"
        aria-label="Livio"
        className={fullClass}
        preserveAspectRatio="xMinYMid meet"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={gCoreF} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={SEA.deep} />
            <stop offset="50%" stopColor={SEA.core} />
            <stop offset="100%" stopColor={SEA.bright} />
          </linearGradient>
          <radialGradient id={gShineF} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform="translate(4, 4)">
          <circle cx="32" cy="32" r="30" fill={SEA.mist} opacity="0.55" />
          <g className={orbitClass} style={{ transformOrigin: '32px 32px' }}>
            <g transform="translate(32,32)">
              <circle
                r="26"
                fill="none"
                stroke={SEA.ring}
                strokeWidth="1.75"
                strokeDasharray="5 11"
                opacity="0.9"
              />
              <circle cx="0" cy="-22" r="3.3" fill={SEA.ink} />
              <circle cx="-19.05" cy="11" r="2.85" fill={SEA.core} />
              <circle cx="19.05" cy="11" r="2.85" fill={SEA.rose} />
            </g>
          </g>
          <circle cx="32" cy="32" r="15.5" fill={`url(#${gCoreF})`} />
          <circle cx="32" cy="32" r="15.5" fill={`url(#${gShineF})`} />
          <circle
            cx="32"
            cy="32"
            r="15.5"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.75"
          />
        </g>
        <text
          x="86"
          y="46"
          fontSize="34"
          fontWeight="650"
          letterSpacing="-0.045em"
          fill={SEA.ink}
          fontFamily="system-ui, -apple-system, 'Segoe UI', Inter, sans-serif"
          style={{ fontSmooth: 'always', WebkitFontSmoothing: 'antialiased' }}
        >
          Livio
        </text>
      </svg>
    </span>
  )
}
