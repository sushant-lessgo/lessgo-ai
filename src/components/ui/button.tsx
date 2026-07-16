import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-app-ctl text-sm font-app-sans font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-app-primary text-white shadow-app-btn-primary hover:bg-app-primary-hover",
        cta:
          "bg-app-cta text-white shadow-app-btn-cta hover:bg-app-cta-soft",
        destructive:
          "bg-app-danger text-white shadow-app-card hover:bg-app-danger/90",
        outline:
          "border border-app-border-input bg-app-surface text-app-ink hover:bg-app-canvas",
        secondary:
          "border border-app-border bg-app-canvas text-app-ink hover:bg-app-hairline",
        ghost: "text-app-ink hover:bg-app-canvas",
        link: "text-app-primary underline-offset-4 hover:text-app-primary-hover hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
