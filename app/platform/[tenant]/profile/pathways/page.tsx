'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { CreatePathwayModal } from '@/components/create-pathway-modal';
import { useProfilePathways } from '@/hooks/profile/use-profile-pathways';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { SkeletonPathwayBox } from '@/components/skeleton-pathway-box';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { PathwayEnrollmentPlus } from '@iblai/iblai-api';
import { getRandomCourseImage } from '@/utils/helpers';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

export default function PathwaysPage() {
  const tenant = useTenantParam();
  const router = useRouter();
  const { metadataLoaded, isSkillsAssignmentsFeatureHidden } = useTenantMetadata({
    org: tenant,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const CATALOG_TAB = 'catalog';
  const ASSIGNED_TAB = 'assigned';
  const ENROLLED_TAB = 'enrolled';
  const [activeTab, setActiveTab] = useState<'catalog' | 'assigned' | 'enrolled'>(CATALOG_TAB); // "my" or "assigned"
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const {
    filteredPathways,
    isLoading,
    pathways,
    isError,
    setPathways,
    setFilteredPathways,
    pathwayCompletions,
  } = useProfilePathways({
    searchQuery,
    contentType: activeTab,
  });

  const handlePathwayTabChange = (tab: 'catalog' | 'assigned' | 'enrolled') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setSearchQuery('');
    setFilteredPathways([]);
  };

  const handleCreatePathway = (pathwayData: PathwayEnrollmentPlus) => {
    // In a real app, you would send this data to your API
    setPathways([...pathways, pathwayData]);
    setFilteredPathways([...filteredPathways, pathwayData]);
  };

  const [randomImage] = useState(() => getRandomCourseImage());

  return (
    <>
      <div className="p-6">
        {/* Pathways Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => handlePathwayTabChange(CATALOG_TAB)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === CATALOG_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              My pathways
            </button>
            {metadataLoaded && !isSkillsAssignmentsFeatureHidden() && (
              <button
                onClick={() => handlePathwayTabChange(ASSIGNED_TAB)}
                className={`border-b-2 px-1 py-2 text-sm font-medium ${
                  activeTab === ASSIGNED_TAB
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Assigned pathways
              </button>
            )}
            <button
              onClick={() => handlePathwayTabChange(ENROLLED_TAB)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === ENROLLED_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Enrolled pathways
            </button>
          </div>
        </div>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-gray-100 py-2 pr-4 pl-10 text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          {activeTab === CATALOG_TAB && (
            <button
              className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Create Pathway</span>
            </button>
          )}
        </div>

        {((!isLoading && isError) || (!isLoading && !isError && pathways.length === 0)) && (
          <DefaultEmptyBox message="No pathways found." />
        )}
        {!isLoading &&
          !isError &&
          filteredPathways.length === 0 &&
          searchQuery.length > 2 &&
          pathways.length > 0 && (
            <DefaultEmptyBox message={`No pathways found matching ${searchQuery} query.`} />
          )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {isLoading && <SkeletonMultiplier Skeleton={SkeletonPathwayBox} multiplier={4} />}
          {!isLoading &&
            !isError &&
            filteredPathways.length > 0 &&
            filteredPathways.map((pathway, index) => (
              <div
                key={index}
                data-testid="pathway-card"
                className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                onClick={() =>
                  router.push(`/platform/${tenant}/pathways/${(pathway as any)?.pathway_uuid}`)
                }
              >
                <div className="relative h-32 w-full overflow-hidden">
                  <Image
                    src={pathway?.metadata?.banner_image_asset_path || randomImage}
                    alt={pathway?.name || ''}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-amber-500 px-2 py-1 text-xs text-white">
                    PATHWAY
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-800">{pathway?.name || ''}</h3>
                  {pathwayCompletions.length > 0 && pathwayCompletions[index] && (
                    <div className="space-y-1">
                      {pathwayCompletions.length > 0 && pathwayCompletions[index] && (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-gray-800">
                              {pathwayCompletions[index].completion_percentage || 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className="h-1.5 rounded-full bg-amber-500"
                              style={{
                                width: `${pathwayCompletions[index].completion_percentage}%`,
                              }}
                            ></div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Create Pathway Dialog */}
      {createDialogOpen && (
        <CreatePathwayModal
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          // @ts-expect-error investigate
          onSave={handleCreatePathway}
        />
      )}
    </>
  );
}
