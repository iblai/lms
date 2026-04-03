'use client';

import {
  SkillsSkeleton,
  CredentialsSkeleton,
  AllTimeSkeleton,
  ProfileSectionSkeleton,
} from './profile-sidebar-skeletons';
import { LatestSkillsBox } from './latest-skills-box';
import { useLatestSkills } from '@/hooks/skills/use-latest-skills';
import { CredentialsListBox } from './credentials-list-box';
import { usePerLearnerInfoQuery } from '@/hooks/perlearner/use-perlearner';
import { AllTimePerLearnerBox } from './all-time-perlearner-box';
import { useUserMetadata } from '@/hooks/users/use-usermetadata';
import { UserProfileBox } from './user-profile-box';
import { useProfileCredentials } from '@/hooks/profile/use-profile-credentials';

export function ProfileSidebar() {
  const { latestSkills, latestSkillsLoading } = useLatestSkills(6);

  const { fetchedCredentials: credentials, isLoading: credentialsLoading } = useProfileCredentials({
    search: '',
  });
  const { userPerLearnerInfo, userPerLearnerInfoLoading } = usePerLearnerInfoQuery();
  const { userMetaDataLoading } = useUserMetadata();

  return (
    <aside
      className={`h-full w-full overflow-y-auto border-r border-gray-100 bg-white sm:w-80 md:block md:p-4 md:pb-20`}
    >
      {/* Profile Section */}
      {userMetaDataLoading ? <ProfileSectionSkeleton /> : <UserProfileBox />}

      {/* Latest Skills Section */}
      {latestSkillsLoading ? <SkillsSkeleton /> : <LatestSkillsBox skills={latestSkills} />}

      {/* Credentials Section */}
      {credentialsLoading ? (
        <CredentialsSkeleton />
      ) : (
        <CredentialsListBox credentials={credentials} />
      )}

      {/* All Time Section */}
      {userPerLearnerInfoLoading ? (
        <AllTimeSkeleton />
      ) : (
        <AllTimePerLearnerBox
          total_assessments={userPerLearnerInfo?.total_assessments ?? 0}
          total_time_spent={userPerLearnerInfo?.total_time_spent ?? 0}
          total_videos={userPerLearnerInfo?.total_videos ?? 0}
          course_completions={userPerLearnerInfo?.course_completions ?? 0}
        />
      )}
    </aside>
  );
}
