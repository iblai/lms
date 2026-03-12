'use client';

import { useProfileSkills } from '@/hooks/profile/use-profile-skills';
import { SkeletonMultiplier } from '../skeleton-multiplier';
import { SkeletonSkillBox } from '../skeleton-skill-box';
import { DefaultEmptyBox } from '../default-empty-box';
import { SkillBox } from '../skill-box';
import _ from 'lodash';

export const SkillsBox = () => {
  const {
    earnedSkills,
    desiredSkills,
    selfReportedSkills,
    earnedSkillsLoading,
    desiredSkillsLoading,
    selfReportedSkillsLoading,
    earnedSkillsError,
    desiredSkillsError,
    selfReportedSkillsError,
  } = useProfileSkills();
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">Skills</h2>

      {/* Earned Skills Section */}
      <div className="mb-6">
        <h3 className="text-base font-medium text-gray-700 mb-4">Earned</h3>
        {!earnedSkillsLoading && (earnedSkillsError || _.isEmpty(earnedSkills?.resources)) && (
          <DefaultEmptyBox className="w-full" message="You don't have any earned skills yet." />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {earnedSkillsLoading && <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />}
          {!earnedSkillsLoading &&
            !earnedSkillsError &&
            !_.isEmpty(earnedSkills?.resources) &&
            earnedSkills?.resources.map((skill: any, index: number) => (
              <SkillBox
                key={index}
                onSkillClick={() => {}}
                skill={{
                  name: skill.name || '',
                  level: skill.points || 0,
                  starred: false,
                }}
              />
            ))}
        </div>
      </div>

      {/* Self-Reported Skills */}
      <div className="mb-6">
        <h3 className="text-base font-medium text-gray-700 mb-4">Self-Reported</h3>
        {!selfReportedSkillsLoading && selfReportedSkillsError && (
          <DefaultEmptyBox
            className="w-full"
            message="You don't have any self-reported skills yet."
          />
        )}
        {!selfReportedSkillsLoading &&
          !selfReportedSkillsError &&
          _.isEmpty(selfReportedSkills?.skills) && (
            <DefaultEmptyBox
              className="w-full"
              message="You don't have any self-reported skills yet."
            />
          )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {selfReportedSkillsLoading && (
            <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />
          )}
          {!selfReportedSkillsLoading &&
            !selfReportedSkillsError &&
            !_.isEmpty(selfReportedSkills?.skills) &&
            selfReportedSkills?.skills.map((skill: any, index: number) => (
              <SkillBox
                key={index}
                skill={{
                  name: skill.name || '',
                  level: selfReportedSkills?.data?.level?.[index] || 0,
                  starred: true,
                }}
              />
            ))}
        </div>
      </div>

      {/* Desired Skills Section */}
      <div>
        <h3 className="text-base font-medium text-gray-700 mb-4">Desired</h3>
        {!desiredSkillsLoading && desiredSkillsError && (
          <DefaultEmptyBox className="w-full" message="You don't have any desired skills yet." />
        )}
        {!desiredSkillsLoading && !desiredSkillsError && _.isEmpty(desiredSkills?.skills) && (
          <DefaultEmptyBox className="w-full" message="You don't have any desired skills yet." />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {desiredSkillsLoading && (
            <SkeletonMultiplier Skeleton={SkeletonSkillBox} multiplier={6} />
          )}
          {!desiredSkillsLoading &&
            !desiredSkillsError &&
            !_.isEmpty(desiredSkills?.skills) &&
            desiredSkills?.skills.map((skill: any, index: number) => (
              <SkillBox
                key={index}
                showRating={false}
                skill={{
                  name: skill.name || '',
                  level: desiredSkills?.data?.level[index] || 0,
                  starred: true,
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};
