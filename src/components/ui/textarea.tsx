import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-app-input border border-app-border-input bg-app-surface px-3 py-2 text-sm font-app-sans text-app-ink transition-colors placeholder:text-app-placeholder focus-visible:outline-none focus-visible:border-app-primary focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
