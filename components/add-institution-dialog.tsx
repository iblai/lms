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
import { useCreateUserInstitutionMutation } from '@/services/career';
import { InstitutionTypeEnum } from '@iblai/iblai-api';
import { toast } from 'sonner';
import { INSTITUTION_TYPE } from '@/constants/user-data';

interface AddInstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}
const years = Array.from({ length: 500 }, (_, i) => (new Date().getFullYear() - i).toString());

export function AddInstitutionDialog({ open, onOpenChange }: AddInstitutionDialogProps) {
  const [createUserInstitution, { isError: isErrorCreating }] = useCreateUserInstitutionMutation();
  const form = useForm({
    defaultValues: {
      name: '',
      institution_type: '',
      location: '',
      website: '',
      accreditation: '',
      established_year: '',
      is_current: true,
    },
    onSubmit: async ({ value }) => {
      try {
        await createUserInstitution({
          username: getUserName(),
          platform_key: getTenant(),
          institution: {
            ...value,
            institution_type: value.institution_type as InstitutionTypeEnum,
            established_year: parseInt(value.established_year),
          },
        });
        if (isErrorCreating) {
          throw new Error();
        }
        toast.success('Institution created successfully');
        onOpenChange(false);
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
          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <>
                <DialogTitle>
                  <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-medium">Add Institution</h2>
                  </div>
                </DialogTitle>

                <div className="max-h-[70vh] overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Name */}
                    <form.Field
                      name="name"
                      validators={{
                        onChange: ({ value }) => !value && 'Name is required',
                        /* onChangeAsyncDebounceMs: 500,
                        onChangeAsync: async ({ value }) => {
                          await new Promise((resolve) => setTimeout(resolve, 1000))
                          return (
                            value.includes('error') && 'No "error" allowed in first name'
                          )
                        }, */
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
                            placeholder="e.g Harvard University"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-sm text-red-500">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                    {/* Institution type */}
                    <form.Field
                      name="institution_type"
                      validators={{
                        onChange: ({ value }) => !value && 'Institution type is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Institution type
                          </Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(value) => field.handleChange(value)}
                          >
                            <SelectTrigger className="h-auto w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
                              <SelectValue placeholder="Select field of study" />
                            </SelectTrigger>
                            <SelectContent>
                              {INSTITUTION_TYPE.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
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

                    <form.Field
                      name="accreditation"
                      validators={{
                        onChange: ({ value }) => !value && 'Accreditation is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Accreditation
                          </Label>
                          <input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700"
                            placeholder="e.g WASC"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-sm text-red-500">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    {/* Year of establishment */}
                    <form.Field
                      name="established_year"
                      validators={{
                        onChange: ({ value }) => !value && 'Year of establishment is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Year of establishment
                          </Label>
                          <Select
                            value={field.state.value.toString()}
                            onValueChange={(value) => field.handleChange(value)}
                          >
                            <SelectTrigger className="h-auto w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year}>
                                  {year}
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
                    {/* Location */}
                    <form.Field
                      name="location"
                      validators={{
                        onChange: ({ value }) => !value && 'Location is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            Location
                          </Label>
                          <input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700"
                            placeholder="e.g New York, NY"
                          />
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
