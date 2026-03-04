'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Upload, Search, Plus, Check, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLazyGetResourceSearchQuery } from '@iblai/iblai-js/data-layer';
import { useDebouncedCallback } from 'use-debounce';
import { getRandomCourseImage, getTenant, getUserId, getUserName, slugify } from '@/utils/helpers';
import { config } from '@/lib/config';
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
        <DialogContent className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden p-0 flex flex-col gap-0">
          <div className="p-4 flex justify-between items-center border-b">
            <h3 className="text-lg font-medium text-gray-600">Create New Pathway</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-auto">
            {/* Left column - Pathway Details */}
            <div
              className="p-6 md:w-1/2 overflow-y-auto bg-gray-50"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pathway Cover Image
                    </label>
                    <div
                      className="border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors bg-white"
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
                        <div className="relative w-full h-40 mb-2">
                          <Image
                            src={coverImage || '/placeholder.svg'}
                            alt="Pathway cover"
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-amber-500 mb-4" />
                          <p className="text-gray-700 mb-1 font-medium">Upload a cover image</p>
                          <p className="text-gray-500 text-sm">(Recommended size: 1280×720px)</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pathway Name */}
                  <div>
                    <label
                      htmlFor="pathway-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Pathway Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="pathway-name"
                      type="text"
                      value={pathwayData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter pathway name"
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-400 bg-white"
                    />
                  </div>

                  {/* Subject/Category */}
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Subject/Category
                    </label>
                    <input
                      id="pathway-name"
                      type="text"
                      value={pathwayData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="Enter subject"
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-400 bg-white"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={pathwayData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter pathway description"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none placeholder-gray-400 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Add Content */}
            <div
              className="p-6 md:w-1/2 border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto bg-white"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="space-y-0 flex flex-col h-full">
                <h2 className="text-sm font-medium text-gray-700 mb-2">Add Content</h2>

                {/* Search Content */}
                <div className="relative mb-4 flex items-center">
                  <Search className="h-4 w-4 text-gray-400 absolute left-4" />
                  <input
                    type="text"
                    placeholder="Search content to add"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 pl-10 pr-4 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent placeholder-gray-400 bg-gray-50 mb-2"
                  />
                </div>

                {/* Selected Content Count */}
                <div className="text-sm text-gray-600 mb-2 mt-3">
                  {selectedCourses.length + selectedResources.length} items selected
                </div>

                {/* Content List */}
                <div
                  className="space-y-3 flex-1 overflow-y-auto"
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
                        className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-gray-300"
                        onClick={() => handleCourseToggle(courseSearchResult?.data?.course_id)}
                      >
                        <div className="flex items-center p-3 bg-white">
                          <div className="w-12 h-12 relative flex-shrink-0 mr-3 rounded-md overflow-hidden">
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
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
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
                        className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer transition-colors hover:border-gray-300"
                        onClick={() => handleResourceToggle(resourceSearchResult?.id)}
                      >
                        <div className="flex items-center p-3 bg-white">
                          <div className="w-12 h-12 relative flex-shrink-0 mr-3 rounded-md overflow-hidden">
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
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
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
                    <div className="text-center py-8 border border-gray-200 rounded-lg">
                      <p className="text-gray-500">
                        No content found
                        {`${searchQuery.length > 2 ? ` matching "${searchQuery}"` : ''}`}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with action buttons */}
          <div className="p-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white mt-auto">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                !pathwayData.name ||
                (selectedCourses.length === 0 && selectedResources.length === 0)
              }
              className={`flex items-center gap-0 px-5 py-2.5 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md text-sm font-medium ${
                !pathwayData.name ||
                (selectedCourses.length === 0 && selectedResources.length === 0)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:opacity-[var(--button-primary-hover-opacity)]'
              } transition-opacity shadow-sm`}
            >
              Create Pathway
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
