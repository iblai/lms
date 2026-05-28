'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { SkeletonPathwayBox } from '@/components/skeleton-pathway-box';
import { useProfilePrograms } from '@/hooks/profile/use-profile-programs';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { CustomProgramEnrollmentPlus } from '@/types/program';
import { getRandomCourseImage } from '@/utils/helpers';
import { config } from '@/lib/config';

export default function ProgramsPage() {
  const router = useRouter();
  const tenant = useTenantParam();
  const { metadataLoaded, isSkillsAssignmentsFeatureHidden } = useTenantMetadata({
    org: tenant,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const ENROLLED_TAB = 'enrolled';
  const ASSIGNED_TAB = 'assigned';
  const [activeTab, setActiveTab] = useState<'enrolled' | 'assigned' | 'catalog'>(ENROLLED_TAB); // "my" or "assigned"
  const [randomImage] = useState(() => getRandomCourseImage());
  const {
    programs,
    filteredPrograms,
    isLoading,
    isError,
    setFilteredPrograms,
    setPrograms,
    programCompletions,
  } = useProfilePrograms({
    searchQuery,
    activeTab,
  });

  const handleProgramTabChange = (tab: 'enrolled' | 'assigned' | 'catalog') => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    setSearchQuery('');
    setFilteredPrograms([]);
    setPrograms([]);
  };

  return (
    <>
      <div className="p-6">
        {/* Programs Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => handleProgramTabChange(ENROLLED_TAB)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === ENROLLED_TAB
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              My programs
            </button>
            {metadataLoaded && !isSkillsAssignmentsFeatureHidden() && (
              <button
                onClick={() => handleProgramTabChange(ASSIGNED_TAB)}
                className={`border-b-2 px-1 py-2 text-sm font-medium ${
                  activeTab === ASSIGNED_TAB
                    ? 'border-amber-500 text-amber-500'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Assigned programs
              </button>
            )}
            {/* <button
              onClick={() => handleProgramTabChange(ENROLLED_TAB)}
              className={`py-2 px-1 text-sm font-medium border-b-2 ${
                activeTab === ENROLLED_TAB
                  ? "border-amber-500 text-amber-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Enrolled programs
            </button> */}
          </div>
        </div>

        {/* Search Bar and Create Program Button */}
        <div className="mb-6 flex items-center justify-between">
          <div className="relative w-64">
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
        </div>
        {((!isLoading && isError) || (!isLoading && !isError && programs.length === 0)) && (
          <DefaultEmptyBox message="No programs found." />
        )}
        {!isLoading &&
          !isError &&
          programs.length > 0 &&
          filteredPrograms.length === 0 &&
          searchQuery.length > 2 && (
            <DefaultEmptyBox message={`No programs found matching "${searchQuery}" query.`} />
          )}

        {/* Programs Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {/* Program Cards */}
          {isLoading && <SkeletonMultiplier Skeleton={SkeletonPathwayBox} multiplier={4} />}
          {!isLoading &&
            !isError &&
            filteredPrograms.length > 0 &&
            filteredPrograms.map((program: CustomProgramEnrollmentPlus, index: number) => (
              <div
                key={index}
                className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                onClick={() => router.push(`/platform/${tenant}/programs/${program.program_id}`)}
                data-testid={'program-card'}
              >
                <div className="relative h-32 w-full overflow-hidden">
                  <Image
                    src={
                      program.program_metadata?.card_image
                        ? String(program.program_metadata?.card_image).startsWith('http')
                          ? program.program_metadata?.card_image
                          : config.urls.lms() + program.program_metadata?.card_image
                        : randomImage
                    }
                    alt={program.name || ''}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = randomImage;
                    }}
                  />
                  <div
                    className="absolute bottom-2 left-2 rounded bg-amber-500 px-2 py-1 text-xs text-white"
                    data-testid="program-badge"
                  >
                    PROGRAM
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-800">{program.name || ''}</h3>
                  {programCompletions.length > 0 && programCompletions[index] && (
                    <div className="space-y-1">
                      {programCompletions.length > 0 && programCompletions[index] && (
                        <>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-gray-800">
                              {programCompletions[index].completion_percentage || 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className="h-1.5 rounded-full bg-amber-500"
                              style={{
                                width: `${programCompletions[index].completion_percentage}%`,
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
    </>
  );
}
