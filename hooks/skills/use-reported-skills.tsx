import { getUserId } from '@/utils/helpers';
import { useGetReportedSkillsQuery } from '@/services/skills';

export function useReportedSkills() {
  const { data, isLoading, error } = useGetReportedSkillsQuery(getUserId());

  return { reportedSkills: data, isLoading, error };
}
