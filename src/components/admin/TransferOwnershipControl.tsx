'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserOption = { clerkId: string; email: string | null }

type Props = {
  token: string
  currentOwnerClerkId: string | null
  users: UserOption[]
}

export default function TransferOwnershipControl({
  token,
  currentOwnerClerkId,
  users,
}: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<string>(currentOwnerClerkId ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changed = selected !== '' && selected !== (currentOwnerClerkId ?? '')

  async function handleTransfer() {
    setError(null)
    if (!changed) return
    const target = users.find((u) => u.clerkId === selected)
    if (!window.confirm(`Transfer this project to ${target?.email || selected}?`)) return

    setBusy(true)
    try {
      const res = await fetch('/api/admin/transfer-ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newClerkId: selected }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        setError(json?.error || `Transfer failed (${res.status})`)
        setBusy(false)
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={busy}
          className="border border-slate-300 rounded px-1 py-0.5 text-xs max-w-[180px]"
        >
          {currentOwnerClerkId === null && <option value="">(orphan)</option>}
          {users.map((u) => (
            <option key={u.clerkId} value={u.clerkId}>
              {u.email || u.clerkId.slice(0, 14)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleTransfer}
          disabled={!changed || busy}
          className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700"
        >
          {busy ? '…' : 'Transfer'}
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
