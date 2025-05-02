import Image from "next/image"

export default function Logo({ className = "", size = 40 }: { className?: string; size?: number }) {
    return (
      <Image
        src="/logo.svg"
        alt="Lessgo.ai Logo"
        width={size}
        height={size}
        className={className}
        priority
      />
    )
  }