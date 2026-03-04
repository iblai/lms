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
      <DialogContent className="p-0 overflow-hidden max-w-md w-full">
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
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-medium">Add Institution</h2>
                  </div>
                </DialogTitle>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
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
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Name
                          </Label>
                          <input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700"
                            placeholder="e.g Harvard University"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-red-500 text-sm">
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
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Institution type
                          </Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(value) => field.handleChange(value)}
                          >
                            <SelectTrigger className="w-full px-3 py-2 h-auto bg-gray-100 border border-gray-200 rounded-md text-gray-700">
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
                            <p className="text-red-500 text-sm">
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
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Accreditation
                          </Label>
                          <input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700"
                            placeholder="e.g WASC"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-red-500 text-sm">
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
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Year of establishment
                          </Label>
                          <Select
                            value={field.state.value.toString()}
                            onValueChange={(value) => field.handleChange(value)}
                          >
                            <SelectTrigger className="w-full px-3 py-2 h-auto bg-gray-100 border border-gray-200 rounded-md text-gray-700">
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
                            <p className="text-red-500 text-sm">
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
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Location
                          </Label>
                          <input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700"
                            placeholder="e.g New York, NY"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-red-500 text-sm">
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
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Website URL
                          </Label>
                          <input
                            id={field.name}
                            type="url"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700"
                            placeholder="e.g https://www.example.com"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-red-500 text-sm">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
                <div className="border-t p-4 flex justify-end gap-3">
                  <button
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmit()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors"
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
