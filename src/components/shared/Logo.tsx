import Image from "next/image"

export default function Logo({ className = "", size = 40 }: { className?: string; size?: number }) {
    return (
      <div className="flex flex-col items-center">
      <Image
        src="/logo.svg"
        alt="Lessgo.ai Logo"
        width={size}
        height={size}
        className={className}
        priority
      />
      <div className="mt-1 ml-4 text-center text-sm text-gray-700 font-medium tracking-wide">
    Pretty doesn’t sell
  </div>

</div>
    )
  }