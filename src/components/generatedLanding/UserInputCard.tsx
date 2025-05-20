"use client"

import { useState } from "react"
import { Sparkles, Pencil } from "lucide-react"
import posthog from "posthog-js"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  input: string
  onRegenerate: (newInput: string) => void
}

export default function UserInputCard({ input, onRegenerate }: Props) {
  const [open, setOpen] = useState(false)
  const [newInput, setNewInput] = useState(input)

  const handleSave = () => {
    posthog.capture("user_input_edited", { previousInput: input, newInput })
    posthog.capture("copy_regeneration_triggered", { reason: "user_input_edited" })

    onRegenerate(newInput)
    setOpen(false)
  }

  return (
    <div className="bg-white rounded-md border border-gray-200 text-gray-800 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-500" />
          Your Product Description
        </h3>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs px-2 py-1 gap-1">
              <Pencil className="w-3 h-3" />
              Edit & Regenerate
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product Description</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 pt-2">
              <Label htmlFor="product-input">Your one-liner product input</Label>
              <Input
                id="product-input"
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save & Regenerate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-gray-800 whitespace-pre-wrap">{input}</p>
    </div>
  )
}
