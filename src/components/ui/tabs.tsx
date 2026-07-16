"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Tabs — headless app-chrome tabs (ui-foundation).
 *
 * shadcn-compatible API (`Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
 * with `value` / `defaultValue` / `onValueChange`) so a later swap to
 * `@radix-ui/react-tabs` is a drop-in. Controlled + uncontrolled, roving focus
 * (Left/Right/Up/Down/Home/End, wraps) with automatic activation, and full
 * `role="tablist"|"tab"|"tabpanel"` + `aria-selected`/`aria-controls`/
 * `aria-labelledby` wiring. Underline active styling per the handoff media picker.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**` or
 * `src/components/published/**`.
 */
interface TabsContextValue {
  value: string | undefined
  setValue: (value: string) => void
  baseId: string
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext)
  if (!ctx) {
    throw new Error(`<${component}> must be used within <Tabs>`)
  }
  return ctx
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ value: valueProp, defaultValue, onValueChange, className, children, ...props }, ref) => {
    const isControlled = valueProp !== undefined
    const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue)
    const reactId = React.useId()
    const value = isControlled ? valueProp : internalValue

    const setValue = React.useCallback(
      (next: string) => {
        if (!isControlled) setInternalValue(next)
        onValueChange?.(next)
      },
      [isControlled, onValueChange]
    )

    const ctx = React.useMemo<TabsContextValue>(
      () => ({ value, setValue, baseId: reactId }),
      [value, setValue, reactId]
    )

    return (
      <TabsContext.Provider value={ctx}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      const keys = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"]
      if (!keys.includes(e.key)) return
      const list = e.currentTarget
      const tabs = Array.from(
        list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      )
      if (tabs.length === 0) return
      const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement)
      let nextIndex = currentIndex
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          nextIndex = (currentIndex + 1) % tabs.length
          break
        case "ArrowLeft":
        case "ArrowUp":
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
          break
        case "Home":
          nextIndex = 0
          break
        case "End":
          nextIndex = tabs.length - 1
          break
      }
      e.preventDefault()
      tabs[nextIndex]?.focus()
      tabs[nextIndex]?.click()
    }

    return (
      <div
        ref={ref}
        role="tablist"
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center gap-4 border-b border-app-border font-app-sans",
          className
        )}
        {...props}
      />
    )
  }
)
TabsList.displayName = "TabsList"

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, onClick, ...props }, ref) => {
    const ctx = useTabsContext("TabsTrigger")
    const selected = ctx.value === value
    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${ctx.baseId}-trigger-${value}`}
        aria-selected={selected}
        aria-controls={`${ctx.baseId}-content-${value}`}
        tabIndex={selected ? 0 : -1}
        onClick={(e) => {
          onClick?.(e)
          ctx.setValue(value)
        }}
        className={cn(
          "-mb-px inline-flex items-center gap-1.5 border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40 disabled:pointer-events-none disabled:opacity-50",
          selected
            ? "border-app-primary text-app-primary-deep"
            : "border-transparent text-app-muted hover:text-app-ink",
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const ctx = useTabsContext("TabsContent")
    const selected = ctx.value === value
    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${ctx.baseId}-content-${value}`}
        aria-labelledby={`${ctx.baseId}-trigger-${value}`}
        hidden={!selected}
        tabIndex={0}
        className={cn("font-app-sans focus-visible:outline-none", className)}
        {...props}
      >
        {selected ? children : null}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
