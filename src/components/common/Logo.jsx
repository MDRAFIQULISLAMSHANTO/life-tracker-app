export default function Logo({ height = 32, className = '' }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Livio"
      style={{ height, width: 'auto', display: 'block' }}
      className={className}
    />
  )
}
