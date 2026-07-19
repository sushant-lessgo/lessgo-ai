import Image from "next/image"

// Single source of truth for the Lessgo AI brand mark (app chrome — NOT a
// customer-site logo). Renders the transparent wordmark `/lessgo-logo.png`
// (intrinsic 152×40), matching the dashboard sidebar reference.
//
// `size` = TARGET HEIGHT in px; width is derived from the 152:40 aspect ratio
// so the wide wordmark is never squished. Consumers can still override via
// `className` (e.g. GlobalAppHeader passes `h-[22px] w-auto`).
const ASPECT = 152 / 40

export default function Logo({ className = "", size = 40 }: { className?: string; size?: number }) {
    return (
      <Image
        src="/lessgo-logo.png"
        alt="Lessgo AI"
        width={Math.round(size * ASPECT)}
        height={size}
        className={className}
        priority
      />
    )
  }
