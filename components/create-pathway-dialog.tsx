'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Search, FileText } from 'lucide-react';

interface CreatePathwayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pathwayData: PathwayData) => void;
}

interface PathwayData {
  name: string;
  description: string;
  subject: string;
  content: string[];
}

export function CreatePathwayDialog({ open, onOpenChange, onSave }: CreatePathwayDialogProps) {
  const [pathwayData, setPathwayData] = useState<PathwayData>({
    name: '',
    description: '',
    subject: '',
    content: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContent, setSelectedContent] = useState<string[]>([]);

  // Sample content for demonstration
  const availableContent = [
    'Leadership Development',
    'Strategic Management',
    'Data-Driven Decision Making',
    'Team Building',
    'Communication Skills',
    'Project Management',
    'Employee Coaching',
    'Change Management',
    'Conflict Resolution',
    'Time Management',
    'Emotional Intelligence',
    'Critical Thinking',
  ];

  const filteredContent = availableContent.filter((item) =>
    item.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleInputChange = (field: keyof PathwayData, value: string) => {
    setPathwayData({
      ...pathwayData,
      [field]: value,
    });
  };

  const handleAddContent = (content: string) => {
    if (!selectedContent.includes(content)) {
      setSelectedContent([...selectedContent, content]);
    }
  };

  const handleRemoveContent = (content: string) => {
    setSelectedContent(selectedContent.filter((item) => item !== content));
  };

  const handleSave = () => {
    onSave({
      ...pathwayData,
      content: selectedContent,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-lg p-0 shadow-lg">
        {/* Header with close button */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 p-4">
          <h3 className="text-lg font-medium text-[var(--text)]">Create New Pathway</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-gray-400 hover:bg-[var(--primary-light)] hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="max-h-[70vh] overflow-y-auto p-6"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <div className="space-y-6">
            {/* Pathway Name */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-md flex items-center gap-2 font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Pathway Name <span className="text-red-500">*</span>
                </h3>
              </div>
              <div className="p-4">
                <Input
                  id="pathway-name"
                  value={pathwayData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter pathway name"
                  className="w-full border-gray-200 bg-gray-50 transition-all duration-200 focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
                />
              </div>
            </div>

            {/* Description */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-md flex items-center gap-2 font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Description
                </h3>
              </div>
              <div className="p-4">
                <Textarea
                  id="description"
                  value={pathwayData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter pathway description"
                  className="min-h-[100px] border-gray-200 bg-gray-50 transition-all duration-200 focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-md flex items-center gap-2 font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Subject
                </h3>
              </div>
              <div className="p-4">
                <Select
                  value={pathwayData.subject}
                  onValueChange={(value) => handleInputChange('subject', value)}
                >
                  <SelectTrigger
                    id="subject"
                    className="w-full border-gray-200 bg-gray-50 transition-all duration-200 focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
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
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="text-md flex items-center gap-2 font-medium text-gray-700">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  Content
                </h3>
              </div>
              <div className="space-y-4 p-4">
                {/* Selected Content */}
                {selectedContent.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs text-gray-500">Selected Content:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.map((content) => (
                        <div
                          key={content}
                          className="flex items-center gap-1 rounded-full border border-[var(--primary-light)] bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 px-3 py-1 text-xs text-gray-700 shadow-sm"
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
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    placeholder="Search for content to add"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-gray-200 bg-gray-50 pl-10 transition-all duration-200 focus:border-[var(--primary)] focus:ring-[var(--primary-light)]"
                  />
                </div>

                {/* Content Results */}
                <div className="max-h-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-inner">
                  {filteredContent.length > 0 ? (
                    <div className="space-y-2">
                      {filteredContent.map((content) => (
                        <div
                          key={content}
                          className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-gray-100"
                          onClick={() => handleAddContent(content)}
                        >
                          <span className="text-sm text-gray-700">{content}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-[var(--primary)]"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <p className="text-sm text-gray-500">
                        No content found matching "{searchQuery}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Save Button */}
        <div className="flex justify-end border-t border-gray-200 bg-gradient-to-r from-[var(--background-light)] to-[var(--primary-light)]/30 p-4">
          <Button
            onClick={handleSave}
            disabled={!pathwayData.name}
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-5 py-2.5 text-sm font-medium text-[var(--button-primary-text)] shadow-sm transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
          >
            Create Pathway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
