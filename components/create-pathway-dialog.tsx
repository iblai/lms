"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Search, FileText } from "lucide-react"

interface CreatePathwayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (pathwayData: PathwayData) => void
}

interface PathwayData {
  name: string
  description: string
  subject: string
  content: string[]
}

export function CreatePathwayDialog({ open, onOpenChange, onSave }: CreatePathwayDialogProps) {
  const [pathwayData, setPathwayData] = useState<PathwayData>({
    name: "",
    description: "",
    subject: "",
    content: [],
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContent, setSelectedContent] = useState<string[]>([])

  // Sample content for demonstration
  const availableContent = [
    "Leadership Development",
    "Strategic Management",
    "Data-Driven Decision Making",
    "Team Building",
    "Communication Skills",
    "Project Management",
    "Employee Coaching",
    "Change Management",
    "Conflict Resolution",
    "Time Management",
    "Emotional Intelligence",
    "Critical Thinking",
  ]

  const filteredContent = availableContent.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleInputChange = (field: keyof PathwayData, value: string) => {
    setPathwayData({
      ...pathwayData,
      [field]: value,
    })
  }

  const handleAddContent = (content: string) => {
    if (!selectedContent.includes(content)) {
      setSelectedContent([...selectedContent, content])
    }
  }

  const handleRemoveContent = (content: string) => {
    setSelectedContent(selectedContent.filter((item) => item !== content))
  }

  const handleSave = () => {
    onSave({
      ...pathwayData,
      content: selectedContent,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-lg w-full max-h-[85vh] rounded-lg shadow-lg">
        {/* Header with close button */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30">
          <h3 className="text-lg font-medium text-[var(--text)]">Create New Pathway</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-gray-400 hover:bg-[var(--primary-light)] hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="p-6 max-h-[70vh] overflow-y-auto"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div className="space-y-6">
            {/* Pathway Name */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Pathway Name <span className="text-red-500">*</span>
                </h3>
              </div>
              <div className="p-4">
                <Input
                  id="pathway-name"
                  value={pathwayData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter pathway name"
                  className="w-full bg-gray-50 border-gray-200 focus:border-[var(--primary)] focus:ring-[var(--primary-light)] transition-all duration-200"
                />
              </div>
            </div>

            {/* Description */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Description
                </h3>
              </div>
              <div className="p-4">
                <Textarea
                  id="description"
                  value={pathwayData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter pathway description"
                  className="min-h-[100px] bg-gray-50 border-gray-200 focus:border-[var(--primary)] focus:ring-[var(--primary-light)] transition-all duration-200"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Subject
                </h3>
              </div>
              <div className="p-4">
                <Select value={pathwayData.subject} onValueChange={(value) => handleInputChange("subject", value)}>
                  <SelectTrigger
                    id="subject"
                    className="w-full bg-gray-50 border-gray-200 focus:border-[var(--primary)] focus:ring-[var(--primary-light)] transition-all duration-200"
                  >
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 shadow-md">
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="management">Management</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="communication">Communication</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-md font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Content
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Selected Content */}
                {selectedContent.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-gray-500">Selected Content:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.map((content) => (
                        <div
                          key={content}
                          className="flex items-center gap-1 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 border border-[var(--primary-light)] rounded-full px-3 py-1 text-xs text-gray-700 shadow-sm"
                        >
                          <span>{content}</span>
                          <button
                            onClick={() => handleRemoveContent(content)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    placeholder="Search for content to add"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-200 focus:border-[var(--primary)] focus:ring-[var(--primary-light)] transition-all duration-200"
                  />
                </div>

                {/* Content Results */}
                <div className="border border-gray-200 rounded-lg p-4 max-h-[200px] overflow-y-auto bg-gray-50 shadow-inner">
                  {filteredContent.length > 0 ? (
                    <div className="space-y-2">
                      {filteredContent.map((content) => (
                        <div
                          key={content}
                          className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                          onClick={() => handleAddContent(content)}
                        >
                          <span className="text-sm text-gray-700">{content}</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[var(--primary)]">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <p className="text-gray-500 text-sm">No content found matching "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Save Button */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!pathwayData.name}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md text-sm font-medium hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity shadow-sm"
          >
            Create Pathway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
