import type { SVGProps } from 'react'

/**
 * Icons use Iconify's `lucide:*` icon identifiers and locally bundled SVG symbols.
 * This keeps the Iconify/Lucide family consistent without relying on a CDN or
 * loading icons from the network at runtime.
 *
 * Additional symbols can be appended to public/iconify-lucide.svg.
 */
type Props = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  icon: `lucide:${string}`
  size?: number
}

export function IconifyIcon({ icon, size = 21, className = '', ...props }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      className={`ui-icon ${className}`.trim()}
      {...props}
    >
      <use href={`/iconify-lucide.svg#${icon.substring('lucide:'.length)}`} />
    </svg>
  )
}
