'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Upload, Search, Plus, Check, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
// @ts-ignore
import { useLazyGetResourceSearchQuery } from '@iblai/iblai-js/data-layer';
import { useDebouncedCallback } from 'use-debounce';
import { getRandomCourseImage, getTenant, getUserId, getUserName, slugify } from '@/utils/helpers';
import { config } from '@/lib/config';
// @ts-ignore
import { useCreateCatalogPathwayMutation } from '@iblai/iblai-js/data-layer';
import { toast } from 'sonner';
import { Pathway } from '@iblai/iblai-api';
import { usePersonnalizedCatalog } from '@/hooks/search/use-personnalized-catalog';
import { SkeletonMultiplier } from './skeleton-multiplier';
import SkeletonCreatePathwaySearchList from './skeleton-create-pathway-search-list';

interface CreatePathwayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pathwayData: Pathway | undefined) => void;
}

interface PathwayData {
  name: string;
  description: string;
  subject: string;
  courses: string[];
}

export function CreatePathwayModal({ open, onOpenChange, onSave }: CreatePathwayModalProps) {
  const { handleSearch, isLoading: isCoursesLoading } = usePersonnalizedCatalog();

  const defaultPathwayData = {
    name: '',
    description: '',
    subject: '',
    courses: [],
  };
  const [pathwayData, setPathwayData] = useState<PathwayData>(defaultPathwayData);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<number[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [searchedCourses, setSearchedCourses] = useState<Record<string, any>>([]);
  const [searchedResources, setSearchedResources] = useState<Record<string, any>>([]);

  const [randomImage] = useState(() => getRandomCourseImage());
  const [createCatalogPathway, { isError: isCreateCatalogPathwayError }] =
    useCreateCatalogPathwayMutation();

  const [getResourceSearch, { isLoading: isResourceSearchLoading }] =
    useLazyGetResourceSearchQuery();

  const handleInputChange = (field: keyof PathwayData, value: string) => {
    setPathwayData({
      ...pathwayData,
      [field]: value,
    });
  };

  const handleCourseToggle = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleResourceToggle = (resourceId: number) => {
    if (selectedResources.includes(resourceId)) {
      setSelectedResources(selectedResources.filter((id) => id !== resourceId));
    } else {
      setSelectedResources([...selectedResources, resourceId]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const newPathway = {
      name: pathwayData.name,
      path: [
        ...selectedCourses.map((selectedCourse) => ({
          item_type: 'course',
          course_id: selectedCourse,
        })),
        ...selectedResources.map((selectedResource) => ({
          item_type: 'resource',
          id: selectedResource,
        })),
      ],
      platform_key: getTenant(),
      user_id: getUserId(),
      username: getUserName(),
      visible: false,
      pathway_id: slugify(pathwayData.name),
      data: {
        description: pathwayData.description,
        subject: pathwayData.subject,
      },
    };
    try {
      const response = await createCatalogPathway([
        {
          requestBody: newPathway,
          userId: getUserId(),
          username: getUserName(),
        },
      ]);
      if (isCreateCatalogPathwayError) {
        throw new Error();
      }
      toast.success('Pathway created successfully');
      onSave(response.data);
      setPathwayData(defaultPathwayData);
      setSelectedCourses([]);
      setSelectedResources([]);
      setSearchQuery('');
      setSearchedCourses([]);
      setSearchedResources([]);
      onOpenChange(false);
    } catch {
      toast.error('Failed to create pathway.');
    }
  };

  const handleCourseSearch = useDebouncedCallback(async () => {
    const resourceSearch = await getResourceSearch([
      {
        platformKey: getTenant(),
        ...(searchQuery.length > 2 ? { name: searchQuery } : {}),
      },
    ]);
    const response = await handleSearch({
      username: getUserName(),
      query: searchQuery,
      limit: 10,
      content: ['courses'],
      tenant: getTenant(),
    });
    //if existing courses are selected, add the new courses to the list
    if (selectedCourses.length > 0 || selectedResources.length > 0) {
      const currentFullSelectedCourses = searchedCourses.filter((course: any) =>
        selectedCourses.includes(course.data.course_id),
      );
      const currentFullSelectedResources = searchedResources.filter((resource: any) =>
        selectedResources.includes(resource.id),
      );
      if (!response?.data) {
        setSearchedCourses([...currentFullSelectedCourses]);
        return;
      }
      if (!resourceSearch?.data) {
        setSearchedResources([...currentFullSelectedResources]);
        return;
      }
      setSearchedResources([
        ...currentFullSelectedResources,
        ...(resourceSearch.data?.filter(
          (resource: any) => !selectedResources.includes(resource.id),
        ) || []),
      ]);
      setSearchedCourses([
        ...currentFullSelectedCourses,
        ...(response.data?.results?.filter(
          (course: any) => !selectedCourses.includes(course.data.course_id),
        ) || []),
      ]);
    } else {
      if (!response?.data) {
        setSearchedCourses([]);
        return;
      }
      if (!resourceSearch?.data) {
        setSearchedResources([]);
        return;
      }
      setSearchedResources(
        resourceSearch.data?.map((resource: any) => {
          return {
            ...resource,
            image: resource?.image || resource?.data?.banner_image || getRandomCourseImage(),
          };
        }) || [],
      );
      setSearchedCourses(
        response.data?.results.map((result: any) => {
          return {
            ...result,
            data: {
              ...result.data,
              edx_data: {
                ...result.data.edx_data,
                course_image_asset_path: result.data.edx_data.course_image_asset_path
                  ? config.urls.lms() + result.data.edx_data.course_image_asset_path
                  : getRandomCourseImage(),
              },
            },
          };
        }) || [],
      );
    }
  }, 500);

  useEffect(() => {
    handleCourseSearch();
  }, []);

  useEffect(() => {
    handleCourseSearch();
  }, [searchQuery]);

  return (
    <>
      <style jsx global>{`
        .absolute.right-4.top-4.rounded-sm.opacity-70 {
          display: none !important;
        }
        div::-webkit-scrollbar {
          display: none;
        }
        select option:first-child {
          color: #9ca3af;
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] w-full max-w-4xl flex-col gap-0 overflow-hidden rounded-lg bg-white p-0">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-medium text-gray-600">Create New Pathway</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-auto md:flex-row">
            {/* Left column - Pathway Details */}
            <div
              className="overflow-y-auto bg-gray-50 p-6 md:w-1/2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="space-y-6">
                {/* Pathway Details Section */}
                <div className="space-y-6">
                  {/* Cover Image Upload */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Pathway Cover Image
                    </label>
                    <div
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-100"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: Event) => {
                          const target = e.target as HTMLInputElement;
                          const changeEvent = {
                            target,
                            currentTarget: target,
                            nativeEvent: e,
                            bubbles: true,
                            cancelable: true,
                            defaultPrevented: false,
                            eventPhase: 0,
                            isTrusted: true,
                            preventDefault: () => {},
                            stopPropagation: () => {},
                            timeStamp: Date.now(),
                            type: 'change',
                            isDefaultPrevented: () => false,
                            isPropagationStopped: () => false,
                            persist: () => {},
                          } as React.ChangeEvent<HTMLInputElement>;
                          handleImageUpload(changeEvent);
                        };
                        input.click();
                      }}
                    >
                      {coverImage ? (
                        <div className="relative mb-2 h-40 w-full">
                          <Image
                            src={coverImage || '/placeholder.svg'}
                            alt="Pathway cover"
                            fill
                            className="rounded-md object-cover"
                          />
                        </div>
                      ) : (
                        <>
                          <Upload className="mb-4 h-10 w-10 text-amber-500" />
                          <p className="mb-1 font-medium text-gray-700">Upload a cover image</p>
                          <p className="text-sm text-gray-500">(Recommended size: 1280×720px)</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pathway Name */}
                  <div>
                    <label
                      htmlFor="pathway-name"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Pathway Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="pathway-name"
                      type="text"
                      value={pathwayData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter pathway name"
                      className="w-full rounded-md border border-gray-200 bg-white px-4 py-2 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Subject/Category */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Subject/Category
                    </label>
                    <input
                      id="pathway-name"
                      type="text"
                      value={pathwayData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Enter subject"
                      className="w-full rounded-md border border-gray-200 bg-white px-4 py-2 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={pathwayData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter pathway description"
                      rows={3}
                      className="w-full resize-none rounded-md border border-gray-200 bg-white px-4 py-2 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Add Content */}
            <div
              className="overflow-y-auto border-t border-gray-200 bg-white p-6 md:w-1/2 md:border-t-0 md:border-l"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="flex h-full flex-col space-y-0">
                <h2 className="mb-2 text-sm font-medium text-gray-700">Add Content</h2>

                {/* Search Content */}
                <div className="relative mb-4 flex items-center">
                  <Search className="absolute left-4 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search content to add"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mb-2 w-full rounded-md border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Selected Content Count */}
                <div className="mt-3 mb-2 text-sm text-gray-600">
                  {selectedCourses.length + selectedResources.length} items selected
                </div>

                {/* Content List */}
                <div
                  className="flex-1 space-y-3 overflow-y-auto"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {(isCoursesLoading || isResourceSearchLoading) && (
                    <SkeletonMultiplier multiplier={6} Skeleton={SkeletonCreatePathwaySearchList} />
                  )}
                  {!isCoursesLoading &&
                    searchedCourses.map((courseSearchResult: any) => (
                      <div
                        key={courseSearchResult?.data?.course_id}
                        className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-colors hover:border-gray-300"
                        onClick={() => handleCourseToggle(courseSearchResult?.data?.course_id)}
                      >
                        <div className="flex items-center bg-white p-3">
                          <div className="relative mr-3 h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={
                                courseSearchResult?.data?.edx_data?.course_image_asset_path ||
                                randomImage
                              }
                              alt={courseSearchResult.data?.name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.src = randomImage;
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-800">
                              {courseSearchResult.data?.name}
                            </h3>
                          </div>
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              selectedCourses.includes(courseSearchResult?.data?.course_id)
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {selectedCourses.includes(courseSearchResult?.data?.course_id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {!isResourceSearchLoading &&
                    searchedResources.map((resourceSearchResult: any) => (
                      <div
                        key={`resource-${resourceSearchResult?.id}`}
                        className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-colors hover:border-gray-300"
                        onClick={() => handleResourceToggle(resourceSearchResult?.id)}
                      >
                        <div className="flex items-center bg-white p-3">
                          <div className="relative mr-3 h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={resourceSearchResult?.image || randomImage}
                              alt={resourceSearchResult?.name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.src = randomImage;
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-800">
                              {resourceSearchResult?.name}
                            </h3>
                          </div>
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              selectedResources.includes(resourceSearchResult?.id)
                                ? 'bg-amber-500 text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {selectedResources.includes(resourceSearchResult?.id) ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {searchedCourses.length === 0 && searchedResources.length === 0 && (
                    <div className="rounded-lg border border-gray-200 py-8 text-center">
                      <p className="text-gray-500">
                        No content found
                        {`${searchQuery.length > 2 ? ` matching "${searchQuery}"` : ''}`}
                      </p>
                      <p className="mt-1 text-sm text-gray-400">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="sticky bottom-0 mt-auto flex justify-end border-t border-gray-200 bg-white p-4">
            <button
              onClick={() => onOpenChange(false)}
              className="mr-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                !pathwayData.name ||
                (selectedCourses.length === 0 && selectedResources.length === 0)
              }
              className={`flex items-center gap-0 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-5 py-2.5 text-sm font-medium text-[var(--button-primary-text)] ${
                !pathwayData.name ||
                (selectedCourses.length === 0 && selectedResources.length === 0)
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:opacity-[var(--button-primary-hover-opacity)]'
              } shadow-sm transition-opacity`}
            >
              Create Pathway
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
