'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Search, Plus } from 'lucide-react';
import { PathwayDetailModal } from '@/components/pathway-detail-modal';
import { CreatePathwayModal } from '@/components/create-pathway-modal';
import { useProfilePathways } from '@/hooks/profile/use-profile-pathways';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { SkeletonPathwayBox } from '@/components/skeleton-pathway-box';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { PathwayEnrollmentPlus } from '@iblai/iblai-api';
import { getRandomCourseImage, getTenant } from '@/utils/helpers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';

export default function PathwaysPage() {
  const { metadataLoaded, isSkillsAssignmentsFeatureHidden } = useTenantMetadata({
    org: getTenant(),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const CATALOG_TAB = 'catalog';
  const ASSIGNED_TAB = 'assigned';
  const ENROLLED_TAB = 'enrolled';
  const [activeTab, setActiveTab] = useState<'catalog' | 'assigned' | 'enrolled'>(CATALOG_TAB); // "my" or "assigned"
  const [selectedPathway, setSelectedPathway] = useState<any>(null);
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
        <div className="border-b border-gray-200 mb-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handlePathwayTabChange(CATALOG_TAB)}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === CATALOG_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My pathways
            </button>
            {metadataLoaded && !isSkillsAssignmentsFeatureHidden() && (
              <button
                onClick={() => handlePathwayTabChange(ASSIGNED_TAB)}
                className={`py-2 px-1 text-sm font-medium border-b-2 ${
                  activeTab === ASSIGNED_TAB
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Assigned pathways
              </button>
            )}
            <button
              onClick={() => handlePathwayTabChange(ENROLLED_TAB)}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === ENROLLED_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Enrolled pathways
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          {activeTab === CATALOG_TAB && (
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] px-4 py-2 rounded-md hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {isLoading && <SkeletonMultiplier Skeleton={SkeletonPathwayBox} multiplier={4} />}
          {!isLoading &&
            !isError &&
            filteredPathways.length > 0 &&
            filteredPathways.map((pathway, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPathway(pathway)}
              >
                <div className="relative h-32 w-full overflow-hidden">
                  <Image
                    src={pathway?.metadata?.banner_image_asset_path || randomImage}
                    alt={pathway?.name || ''}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                    PATHWAY
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-2">{pathway?.name || ''}</h3>
                  {pathwayCompletions.length > 0 && pathwayCompletions[index] && (
                    <div className="space-y-1">
                      {pathwayCompletions.length > 0 && pathwayCompletions[index] && (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-800 font-medium">
                              {pathwayCompletions[index].completion_percentage || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full"
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
      {/* Pathway Detail Modal */}
      {selectedPathway && (
        <PathwayDetailModal pathway={selectedPathway} onClose={() => setSelectedPathway(null)} />
      )}

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
