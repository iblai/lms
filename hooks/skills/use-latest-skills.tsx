import { useEffect, useState } from 'react';
import { getUserId, getUserName } from '@/utils/helpers';
import _ from 'lodash';
import { useGetEarnedSkillsQuery, useGetReportedSkillsQuery } from '@/services/skills';
import { Skill } from '@/types/skills';
export function useLatestSkills(maxSkills?: number) {
  const { data: reportedSkills, isLoading: reportedSkillsLoading } =
    useGetReportedSkillsQuery(getUserId());

  const { data: earnedSkills, isLoading: earnedSkillsLoading } =
    useGetEarnedSkillsQuery(getUserName());

  const [latestSkills, setLatestSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const formattedEarnedSkills = Object.keys(earnedSkills || {}).map((skill) => ({
      id: parseInt(skill),
      name: skill,
    }));
    const mixedSkills = _.shuffle([...(reportedSkills?.skills || []), ...formattedEarnedSkills]);
    const skills = maxSkills ? mixedSkills.slice(0, maxSkills) : mixedSkills;
    setLatestSkills(skills || []);
  }, [reportedSkills?.skills, earnedSkills]);

  return { latestSkills, latestSkillsLoading: reportedSkillsLoading || earnedSkillsLoading };
}
