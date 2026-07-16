import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-app-input border border-app-border-input bg-app-surface px-3 py-2 text-sm font-app-sans text-app-ink transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-app-ink placeholder:text-app-placeholder focus-visible:outline-none focus-visible:border-app-primary focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
