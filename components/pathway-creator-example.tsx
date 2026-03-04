"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreatePathwayModal } from "./create-pathway-modal"
import { Plus } from "lucide-react"

export function PathwayCreatorExample() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSavePathway = (pathwayData: any) => {
    console.log("Saving pathway:", pathwayData)
    // Here you would typically save the pathway data to your backend
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-700">My Pathways</h2>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] hover:opacity-[var(--button-primary-hover-opacity)]"
        >
          <Plus className="h-4 w-4" />
          <span>Create Pathway</span>
        </Button>
      </div>

      <CreatePathwayModal open={isModalOpen} onOpenChange={setIsModalOpen} onSave={handleSavePathway} />
    </div>
  )
}
