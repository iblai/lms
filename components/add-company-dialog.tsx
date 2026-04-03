'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useForm } from '@tanstack/react-form';
import { getUserName } from '@/utils/helpers';
import { getTenant } from '@/utils/helpers';
import { useCreateUserCompanyMutation, useGetUserCompaniesQuery } from '@/services/career';
import { toast } from 'sonner';
import { INDUSTRIES } from '@/constants/user-data';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDelete?: (id: string) => void;
}

export function AddCompanyDialog({ open, onOpenChange }: AddCompanyDialogProps) {
  useGetUserCompaniesQuery({
    username: getUserName(),
    platform_key: getTenant(),
  });
  const [createUserCompany, { isError: isErrorCreating }] = useCreateUserCompanyMutation();
  const form = useForm({
    defaultValues: {
      name: '',
      industry: '',
      website: '',
      is_current: true,
      logo: '',
    },
    onSubmit: async ({ value }) => {
      try {
        await createUserCompany({
          username: getUserName(),
          platform_key: getTenant(),
          company: value,
        });
        if (isErrorCreating) {
          throw new Error();
        } else {
          toast.success('Company created successfully');
          onOpenChange(false);
        }
      } catch {
        toast.error('Failed to create institution');
      }
    },
  });

  const handleSubmit = () => {
    if (!form.state.isFormValid) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.state.isSubmitting) {
      return;
    }
    form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md overflow-hidden p-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
          }}
        >
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([, isSubmitting]) => (
              <>
                <DialogTitle>
                  <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-medium">Add Company</h2>
                  </div>
                </DialogTitle>

                <div className="max-h-[70vh] overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Name */}
                    <form.Field
                      name="name"
                      validators={{
                        onChange: ({ value }) => !value && 'Name is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Name
                          </Label>
                          <input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700"
                            placeholder="e.g Google"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-sm text-red-500">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                    {/* Company type */}
                    <form.Field
                      name="industry"
                      validators={{
                        onChange: ({ value }) => !value && 'Industry is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Industry
                          </Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(value) => field.handleChange(value)}
                          >
                            <SelectTrigger className="h-auto w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
                              <SelectValue placeholder="Select field of study" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!field.state.meta.isValid && (
                            <p className="text-sm text-red-500">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                    {/* Website */}
                    <form.Field
                      name="website"
                      validators={{
                        onChange: ({ value }) => !value && 'Website is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Website URL
                          </Label>
                          <input
                            id={field.name}
                            type="url"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700"
                            placeholder="e.g https://www.example.com"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-sm text-red-500">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t p-4">
                  <button
                    onClick={() => onOpenChange(false)}
                    className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmit()}
                    className="rounded-md bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
