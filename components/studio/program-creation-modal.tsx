'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateStudioProgramMutation } from '@/services/studio';
import { getOrg } from '@/utils/helpers';
import { isValidProgramId, programIdFromName } from '@/utils/studio';

export interface CreatedProgram {
  program_id: string;
  program_key: string;
  name: string;
}

interface ProgramCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (program: CreatedProgram) => void;
}

function ProgramCreationForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (program: CreatedProgram) => void;
}) {
  const [name, setName] = useState('');
  // Follows the name until the author types an ID of their own.
  const [customId, setCustomId] = useState<string | null>(null);
  const [createProgram, { isLoading }] = useCreateStudioProgramMutation();
  const programId = customId ?? programIdFromName(name);

  const handleSubmit = async () => {
    if (isLoading) return;
    if (!name.trim()) {
      toast.error('Please enter a program name.');
      return;
    }
    if (!isValidProgramId(programId)) {
      toast.error('The program ID can only contain letters, numbers, hyphens and underscores.');
      return;
    }
    const org = getOrg();
    if (!org) {
      toast.error('Could not determine your organization. Please re-select your tenant.');
      return;
    }
    try {
      const created = await createProgram({ org, programId, name: name.trim() }).unwrap();
      toast.success('Program created successfully.');
      onCreated({
        program_id: created?.program_id ?? programId,
        program_key: created?.program_key ?? `program-v1:${org}+${programId}`,
        name: created?.name ?? name.trim(),
      });
    } catch (error) {
      console.error('Failed to create program:', error);
      toast.error('Program creation failed. Please try again.');
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <Label htmlFor="program-name">Program name *</Label>
        <Input
          id="program-name"
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Data Science Fundamentals"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="program-id">Program ID *</Label>
        <Input
          id="program-id"
          maxLength={50}
          value={programId}
          onChange={(event) => setCustomId(event.target.value)}
          placeholder="e.g. data-science-fundamentals"
        />
        <p className="text-xs text-gray-500">
          Identifies the program in its URL. It cannot be changed later.
        </p>
      </div>
      <div className="mt-8 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isLoading}
          className="bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Program
        </Button>
      </div>
    </div>
  );
}

export function ProgramCreationModal({ open, onOpenChange, onCreated }: ProgramCreationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[85vh] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-lg bg-white p-0 [&>button:last-child]:hidden"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <DialogTitle className="text-lg font-medium text-gray-600">Create Program</DialogTitle>
        </div>
        <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'none' }}>
          <ProgramCreationForm onCancel={() => onOpenChange(false)} onCreated={onCreated} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
