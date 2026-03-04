'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useForm } from '@tanstack/react-form';
import { getMonthsData, getUserName } from '@/utils/helpers';
import { getTenant } from '@/utils/helpers';
import {
  useUpdateUserExperienceMutation,
  useCreateUserExperienceMutation,
  useGetUserCompaniesQuery,
  useDeleteUserExperienceMutation,
} from '@/services/career';
import { Experience } from '@iblai/iblai-api';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { EMPLOYMENT_TYPES } from '@/constants/user-data';
interface EditExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDelete?: (id: string) => void;
  experience?: Experience;
  setOpenAddCompanyDialog: (open: boolean) => void;
}
const years = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());

const monthsData = getMonthsData();

export function EditExperienceDialog({
  open,
  onOpenChange,
  onSave,
  onDelete,
  experience,
  setOpenAddCompanyDialog,
}: EditExperienceDialogProps) {
  const { data: companies } = useGetUserCompaniesQuery({
    username: getUserName(),
    platform_key: getTenant(),
  });

  const [updateUserExperience, { isError: isErrorUpdating }] = useUpdateUserExperienceMutation();
  const [createUserExperience, { isError: isErrorCreating }] = useCreateUserExperienceMutation();
  const [deleteExperience, { isLoading: isDeleting, isError: isErrorDeleting }] =
    useDeleteUserExperienceMutation();
  const form = useForm({
    defaultValues: {
      title: experience?.title || '',
      company_id: experience?.company?.id || '',
      employment_type: experience?.employment_type || '',
      location: experience?.location || '',
      start_date: experience?.start_date || null,
      end_date: experience?.end_date || null,
      start_year: experience?.start_date ? dayjs(experience?.start_date).year() : '',
      start_month: experience?.start_date
        ? (dayjs(experience?.start_date).month() + 1).toString()
        : '',
      end_month: experience?.end_date ? (dayjs(experience?.end_date).month() + 1).toString() : '',
      end_year: experience?.end_date ? dayjs(experience?.end_date).year() : '',
      is_current: experience?.is_current || false,
      description: experience?.description || '',
    },
    onSubmit: async ({ value }) => {
      const startDate =
        value.start_year && value.start_month
          ? dayjs()
              .year(Number(value.start_year))
              .month(Number(value.start_month) - 1)
              .startOf('month')
              .format('YYYY-MM-DD')
          : null;

      const endDate =
        !value.is_current && value.end_year && value.end_month
          ? dayjs()
              .year(Number(value.end_year))
              .month(Number(value.end_month) - 1)
              .endOf('month')
              .format('YYYY-MM-DD')
          : null;
      const { ...requestBody } = value;
      if (experience?.id) {
        try {
          await updateUserExperience({
            username: getUserName(),
            platform_key: getTenant(),
            experience_id: experience.id.toString(),
            experience: {
              ...requestBody,
              end_date: requestBody.is_current ? null : endDate,
              id: experience.id,
              company_id: Number(value.company_id),
              start_date: startDate || '',
            },
          });
          if (isErrorUpdating) {
            throw new Error();
          }
          toast.success('Experience information updated successfully.');
          onSave();
        } catch {
          toast.error('Error updating experience information.');
        }
      } else {
        try {
          await createUserExperience({
            username: getUserName(),
            platform_key: getTenant(),
            experience: {
              ...requestBody,
              end_date: requestBody.is_current ? null : endDate,
              company_id: Number(value.company_id),
              start_date: startDate || '',
            },
          });
          if (isErrorCreating) {
            throw new Error();
          }
          toast.success('Experience information created successfully.');
          onSave();
        } catch {
          toast.error('Error creating experience information.');
        }
      }
    },
  });

  const handleDelete = async () => {
    if (isDeleting) {
      return;
    }
    if (experience?.id && onDelete) {
      try {
        await deleteExperience({
          username: getUserName(),
          platform_key: getTenant(),
          experience_id: experience?.id.toString(),
        });
        if (isErrorDeleting) {
          throw new Error();
        }
        toast.success('Experience information deleted successfully.');
        onOpenChange(false);
        onDelete(experience?.id.toString());
      } catch {
        toast.error('Error deleting experience information.');
      }
    }
  };

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
      <DialogContent className="p-0 overflow-hidden max-w-md w-full edit-experience-dialog">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
          }}
        >
          <form.Subscribe
            selector={(state) => [
              state.isSubmitting,
              state.values.is_current,
              state.values.start_year,
              state.values.start_month,
              state.values.end_year,
            ]}
          >
            {([isSubmitting, isCurrent, startYear, startMonth, endYear]) => (
              <>
                <DialogTitle>
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-medium">
                      {experience?.id ? 'Edit' : 'Add'} Experience
                    </h2>
                    {/* <DialogClose
                      onClick={() => onOpenChange(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </DialogClose> */}
                  </div>
                </DialogTitle>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <div className="space-y-6">
                    {/* Degree */}
                    <form.Field
                      name="title"
                      validators={{
                        onChange: ({ value }) => !value && 'Title is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Title
                          </Label>
                          <input
                            id={field.name}
                            type="text"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700"
                            placeholder="e.g., Software Engineer"
                          />
                          {!field.state.meta.isValid && (
                            <p className="text-red-500 text-sm">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>

                    {/* Field of Study */}
                    <form.Field
                      name="employment_type"
                      validators={{
                        onChange: ({ value }) => !value && 'Employment type is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Employment type
                          </Label>
                          <Select
                            value={field.state.value}
                            onValueChange={(value) => field.handleChange(value)}
                          >
                            <SelectTrigger className="w-full px-3 py-2 h-auto bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                              <SelectValue placeholder="Select employment type" />
                            </SelectTrigger>
                            <SelectContent>
                              {EMPLOYMENT_TYPES.map((employmentType) => (
                                <SelectItem key={employmentType} value={employmentType}>
                                  {employmentType}
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

                    {/* Company */}
                    <form.Field
                      name="company_id"
                      validators={{
                        onChange: ({ value }) => !value && 'Company is required',
                      }}
                    >
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Company
                          </Label>
                          <Select
                            value={field.state.value.toString()}
                            onValueChange={(value) => field.handleChange(value)}
                          >
                            <SelectTrigger className="w-full px-3 py-2 h-auto bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies?.map((company) => (
                                <SelectItem key={company.id} value={company.id.toString()}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!field.state.meta.isValid && (
                            <p className="text-red-500 text-sm">
                              {field.state.meta.errors.join(', ')}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenAddCompanyDialog(true);
                            }}
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium text-sm mt-1"
                          >
                            <Plus className="h-4 w-4" />
                            Add new company
                          </button>
                        </div>
                      )}
                    </form.Field>
                    {/* Start Date */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="start_month" className="text-sm font-medium text-gray-700">
                          Start date
                        </Label>
                        <form.Field name="is_current">
                          {(field) => (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={field.state.value}
                                onCheckedChange={(checked) => field.handleChange(checked)}
                                id={field.name}
                                className="data-[state=checked]:bg-primary"
                              />
                              <Label
                                htmlFor={field.name}
                                className="text-sm font-medium text-gray-700"
                              >
                                Current
                              </Label>
                            </div>
                          )}
                        </form.Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <form.Field
                          name="start_month"
                          validators={{
                            onChange: ({ value }) => !value && 'Start month is required',
                          }}
                        >
                          {(field) => (
                            <>
                              <Select
                                value={field.state.value.toString()}
                                onValueChange={(value) => field.handleChange(value)}
                              >
                                <SelectTrigger className="w-full px-3 py-2 h-auto bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                  {monthsData.map((month) => (
                                    <SelectItem key={month.value} value={month.value.toString()}>
                                      {month.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!field.state.meta.isValid && (
                                <p className="text-red-500 text-sm">
                                  {field.state.meta.errors.join(', ')}
                                </p>
                              )}
                            </>
                          )}
                        </form.Field>
                        <form.Field
                          name="start_year"
                          validators={{
                            onChange: ({ value }) => !value && 'Start year is required',
                          }}
                        >
                          {(field) => (
                            <>
                              <Select
                                value={field.state.value.toString()}
                                onValueChange={(value) => field.handleChange(value)}
                              >
                                <SelectTrigger className="w-full px-3 py-2 h-auto bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                                  <SelectValue placeholder="Year" />
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
                            </>
                          )}
                        </form.Field>
                      </div>
                    </div>

                    {/* End Date - Only show if not current */}
                    {!isCurrent && (
                      <div className="space-y-2">
                        <Label htmlFor="end_month" className="text-sm font-medium text-gray-700">
                          End date
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <form.Field
                            name="end_month"
                            validators={{
                              onChange: ({ value }) => {
                                if (!isCurrent && !value) {
                                  return 'End month is required';
                                }
                                if (value < startMonth && startYear === endYear) {
                                  return 'End month cannot be before start month';
                                }
                              },
                            }}
                          >
                            {(field) => (
                              <>
                                <Select
                                  value={field.state.value.toString()}
                                  onValueChange={(value) => field.handleChange(value)}
                                >
                                  <SelectTrigger className="w-full px-3 py-2 h-auto bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                                    <SelectValue placeholder="Month" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {monthsData.map((month) => (
                                      <SelectItem key={month.value} value={month.value.toString()}>
                                        {month.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {!field.state.meta.isValid && (
                                  <p className="text-red-500 text-sm">
                                    {field.state.meta.errors.join(', ')}
                                  </p>
                                )}
                              </>
                            )}
                          </form.Field>
                          <form.Field
                            name="end_year"
                            validators={{
                              onChange: ({ value }) => {
                                if (!isCurrent && !value) {
                                  return 'End year is required';
                                }
                                if (value < startYear) {
                                  return 'End year cannot be before start year';
                                }
                              },
                            }}
                          >
                            {(field) => (
                              <>
                                <Select
                                  value={field.state.value.toString()}
                                  onValueChange={(value) => field.handleChange(value)}
                                >
                                  <SelectTrigger className="w-full px-3 py-2 h-auto bg-gray-100 border border-gray-200 rounded-md text-gray-700">
                                    <SelectValue placeholder="Year" />
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
                              </>
                            )}
                          </form.Field>
                        </div>
                      </div>
                    )}
                    {/* Description */}
                    <form.Field name="description">
                      {(field) => (
                        <div className="space-y-2">
                          <Label
                            htmlFor={field.name}
                            className="text-sm font-medium text-gray-700 block"
                          >
                            Description
                          </Label>
                          <Textarea
                            id={field.name}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-700 min-h-[100px] resize-y"
                            placeholder="Describe your experience experience"
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                </div>
                <div className="border-t p-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium transition-colors hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {experience?.id && (
                    <button
                      onClick={() => handleDelete()}
                      type="button"
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-md font-medium transition-colors hover:bg-red-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Experience'}
                    </button>
                  )}
                  <button
                    onClick={() => handleSubmit()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium hover:bg-blue-600 transition-colors"
                    disabled={!!isSubmitting}
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
