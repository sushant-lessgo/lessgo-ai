"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"
import { AppIcon } from "./icon"

/**
 * Toast — lightweight app-chrome toast system (ui-foundation).
 *
 * Self-contained `ToastProvider` + `useToast()` hook + a bottom-stacked viewport
 * portaled to `document.body`. Auto-dismiss; success/error/info variants using
 * `app-success` / `app-danger` / `app-primary` tokens + AppIcon.
 *
 * Distinct from the edit-page-local ToastProvider
 * (`src/app/edit/[token]/components/ui/ToastProvider`) — that migration is a
 * consuming-spec job; do not import it here.
 *
 * The portaled viewport carries `font-app-sans` + direct app-* tokens (like the
 * Phase-4 dialog) so it styles correctly with no ancestor scope.
 *
 * APP-CHROME ONLY — never import from `src/modules/templates/**` or
 * `src/components/published/**`.
 */
export type ToastVariant = "success" | "error" | "info"

export interface ToastOptions {
  variant?: ToastVariant
  /** ms before auto-dismiss; 0 disables. Default 4000. */
  duration?: number
}

interface ToastItem {
  id: string
  message: React.ReactNode
  variant: ToastVariant
  duration: number
}

interface ToastContextValue {
  toast: (message: React.ReactNode, options?: ToastOptions) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

let toastCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    (message: React.ReactNode, options?: ToastOptions) => {
      const id = `toast-${++toastCounter}`
      const item: ToastItem = {
        id,
        message,
        variant: options?.variant ?? "info",
        duration: options?.duration ?? 4000,
      }
      setToasts((prev) => [...prev, item])
      return id
    },
    []
  )

  const value = React.useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              data-toast-viewport=""
              className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 font-app-sans"
            >
              {toasts.map((t) => (
                <ToastCard key={t.id} item={t} onDismiss={dismiss} />
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  )
}

const VARIANT_STYLES: Record<ToastVariant, { chip: string; icon: string }> = {
  success: { chip: "bg-app-success-bg text-app-success", icon: "check_circle" },
  error: { chip: "bg-app-danger-bg text-app-danger", icon: "error" },
  info: { chip: "bg-app-tint text-app-primary-deep", icon: "info" },
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  React.useEffect(() => {
    if (item.duration <= 0) return
    const timer = setTimeout(() => onDismiss(item.id), item.duration)
    return () => clearTimeout(timer)
  }, [item.id, item.duration, onDismiss])

  const styles = VARIANT_STYLES[item.variant]

  return (
    <div
      role="status"
      aria-live="polite"
      data-variant={item.variant}
      className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-app-panel border border-app-border bg-app-surface px-4 py-3 text-sm text-app-ink shadow-app-float"
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          styles.chip
        )}
      >
        <AppIcon name={styles.icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">{item.message}</div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded-app-badge p-0.5 text-app-muted transition-colors hover:bg-app-canvas hover:text-app-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/40"
      >
        <AppIcon name="close" size={18} />
      </button>
    </div>
  )
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast() must be used within <ToastProvider>")
  }
  return ctx
}
