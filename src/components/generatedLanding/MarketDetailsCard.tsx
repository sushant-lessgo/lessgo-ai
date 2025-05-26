"use client"

import { useState } from "react"
import { BarChart2, RefreshCcw } from "lucide-react"
import posthog from "posthog-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
type Props = {
  marketCategory: string
  marketSubcategory: string
  targetAudience: string
  problem: string
  onRegenerate: (newValues: {
    marketCategory: string
    marketSubcategory: string
    targetAudience: string
    problem: string
  }) => void
}

export default function MarketDetailsCard({
  marketCategory,
  marketSubcategory,
  targetAudience,
  problem,
  onRegenerate,
}: Props) {
  const [category, setCategory] = useState(marketCategory)
  const [subcategory, setSubcategory] = useState(marketSubcategory)
  const [audience, setAudience] = useState(targetAudience)
  const [problemDesc, setProblemDesc] = useState(problem)

  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    posthog.capture("copy_regeneration_triggered", {
      marketCategory: category,
      marketSubcategory: subcategory,
      targetAudience: audience,
      problem: problemDesc,
    })

    onRegenerate({
      marketCategory: category,
      marketSubcategory: subcategory,
      targetAudience: audience,
      problem: problemDesc,
    })

    setOpen(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm p-5 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight">Market Details</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="category">Market Category</Label>
          <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="subcategory">Subcategory (optional)</Label>
          <Input id="subcategory" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="audience">Target Audience</Label>
          <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="problem">Problem Being Solved</Label>
          <Textarea
            id="problem"
            rows={3}
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <Dialog open={open} onOpenChange={setOpen}>
            {/* <DialogTrigger asChild> */}

            <Tooltip>
              <TooltipTrigger asChild>
                <span>
              <Button variant="outline" className="gap-1" disabled>
                <RefreshCcw className="w-4 h-4" />
                Update & Regenerate
              </Button>

              </span>
                </TooltipTrigger>
                <TooltipContent>
                  Functionality coming soon!
                </TooltipContent>
              </Tooltip>
            {/* </DialogTrigger> */}

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Regenerate Landing Page?</DialogTitle>
              </DialogHeader>

              <div className="text-sm text-gray-600">
                This will regenerate your entire landing page copy based on the updated inputs. All previous edits will be lost.
              </div>

              <DialogFooter className="pt-4">
                <Button variant="ghost" onClick={() => {
                  posthog.capture("copy_regeneration_cancelled")
                  setOpen(false)
                }}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm}>
                  Yes, Regenerate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
