import { getTenant, getUserId, getUserName } from '@/utils/helpers';
import { useState, useEffect } from 'react';
import { ActivityStats } from '@/types/catalog';
import {
  // @ts-ignore
  useLazyGetUserReportedSkillsQuery,
  // @ts-ignore
  useLazyGetUserSkillsPointsQuery,
  // @ts-ignore
  useLazyGetUserDesiredSkillsQuery,
  // @ts-ignore
  useLazyGetPerLearnerInfoQuery,
} from '@iblai/iblai-js/data-layer';
import _ from 'lodash';
import { useLazyGetUserCredentialsQuery } from '@/services/credentials';
import { useLazyGetUserPerLearnerInfoQuery } from '@/services/perlearner';
import { useLazyGetUserEnrolledCoursesQuery } from '@/services/courses';
import {
  useLazyGetUserCatalogPathwaysQuery,
  useLazyGetUserEnrolledProgramsQuery,
} from '@/services/catalog';

export const useProfileActivityStats = () => {
  const [getUserSkillsPoints, { isError: isErrorGetUserSkillsPoints }] =
    useLazyGetUserSkillsPointsQuery();
  const [getUserReportedSkills, { isError: isErrorGetUserReportedSkills }] =
    useLazyGetUserReportedSkillsQuery();
  const [getUserDesiredSkills, { isError: isErrorGetUserDesiredSkills }] =
    useLazyGetUserDesiredSkillsQuery();
  const [getUserCredentials, { isError: isErrorGetUserCredentials }] =
    useLazyGetUserCredentialsQuery();
  const [getUserEnrolledCourses, { isError: isErrorGetUserEnrolledCourses }] =
    useLazyGetUserEnrolledCoursesQuery();
  const [getUserEnrolledPrograms, { isError: isEnrolledProgramsError }] =
    useLazyGetUserEnrolledProgramsQuery();
  const [getUserCatalogPathways, { error: isCatalogPathwaysError }] =
    useLazyGetUserCatalogPathwaysQuery();
  const [getPerLearnerInfo, { isError: isErrorgetPerLearnerInfo }] =
    useLazyGetPerLearnerInfoQuery();
  const [getUserPerLearnerInfo, { isError: isErrorGetUserPerLearnerInfo }] =
    useLazyGetUserPerLearnerInfoQuery();

  const [stats, setStats] = useState<ActivityStats[]>([
    { value: 0, label: 'Points', loading: true },
    { value: 3, label: 'Skills', loading: true },
    { value: 0, label: 'Credentials', loading: true },
    { value: 4, label: 'Courses', loading: true },
    { value: 0, label: 'Programs', loading: true },
    { value: 0, label: 'Pathways', loading: true },
    { value: '0h', label: 'Time Spent', loading: true },
    { value: 0, label: 'Assessments', loading: true },
    { value: 0, label: 'Videos', loading: true },
  ]);

  const updateSingleStat = (stat: ActivityStats) => {
    setStats((oldStats) => {
      return oldStats.map((s) => {
        return s.label === stat.label ? stat : s;
      });
    });
  };

  const handleSkillsPointActivityStats = async () => {
    const label = 'Points';
    try {
      const response = await getUserSkillsPoints(
        [
          {
            userId: getUserId(),
            username: getUserName(),
          },
        ],
        true,
      );
      if (isErrorGetUserSkillsPoints || _.isEmpty(response?.data?.skill_points)) {
        throw new Error();
      }
      updateSingleStat({
        value:
          _.sumBy(
            Object.values(response.data?.skill_points || {}),
            (skill: any) => skill.total_points,
          ) || 0,
        label,
        loading: false,
      });
    } catch {
      updateSingleStat({
        value: 0,
        label,
        loading: false,
      });
    }
  };

  const handleActivitySkillsStats = async () => {
    const label = 'Skills';
    try {
      const reportedSkills = await getUserReportedSkills(
        [
          {
            userId: getUserId(),
            username: getUserName(),
          },
        ],
        true,
      );
      let skillsCount = 0;
      if (isErrorGetUserDesiredSkills && isErrorGetUserReportedSkills) {
        throw new Error();
      }
      if (!isErrorGetUserReportedSkills) {
        skillsCount = reportedSkills?.data?.skills?.length || 0;
      }
      const earnedSkills = await getUserDesiredSkills(
        [
          {
            userId: getUserId(),
            username: getUserName(),
          },
        ],
        true,
      );
      if (!isErrorGetUserDesiredSkills) {
        skillsCount += earnedSkills?.data?.skills?.length || 0;
      }
      updateSingleStat({
        value: skillsCount,
        label,
        loading: false,
      });
    } catch {
      updateSingleStat({
        value: 0,
        label,
        loading: false,
      });
    }
  };

  const handleCredentialsActivityStats = async () => {
    const label = 'Credentials';
    try {
      const response = await getUserCredentials(
        {
          org: getTenant(),
          username: getUserName(),
        },
        true,
      );
      if (isErrorGetUserCredentials || _.isEmpty(response?.data)) {
        throw new Error();
      }
      updateSingleStat({
        value: response?.data?.data?.length || 0,
        label,
        loading: false,
      });
    } catch {
      updateSingleStat({
        value: 0,
        label,
        loading: false,
      });
    }
  };

  const handleCoursesActivityStats = async () => {
    // TODO: SDK to return multuple courses
    const label = 'Courses';
    try {
      const response = await getUserEnrolledCourses(
        {
          username: getUserName(),
        },
        true,
      );
      if (isErrorGetUserEnrolledCourses || _.isEmpty(response.data)) {
        throw new Error();
      }
      updateSingleStat({
        value: response?.data?.count || 0,
        label,
        loading: false,
      });
    } catch {
      updateSingleStat({
        value: 0,
        label,
        loading: false,
      });
    }
  };

  const handleProgramsActivityStats = async () => {
    // TODO: SDK to return multuple programs
    const label = 'Programs';
    try {
      const response = await getUserEnrolledPrograms(
        {
          username: getUserName(),
          platform_key: getTenant(),
        },
        true,
      );
      if (isEnrolledProgramsError || _.isEmpty(response.data)) {
        throw new Error();
      }
      updateSingleStat({
        value: response?.data?.length || 0,
        label,
        loading: false,
      });
    } catch {
      updateSingleStat({
        value: 0,
        label,
        loading: false,
      });
    }
  };

  const filterUniquePathways = (data: any) => {
    const seen = new Set();
    return data.filter((item: any) => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  };

  const handlePathwaysActivityStats = async () => {
    // TODO: SDK to return multuple pathways
    const pathwaysLabel = 'Pathways';
    try {
      const response = await getUserCatalogPathways(
        {
          username: getUserName(),
          platform_key: getTenant(),
        },
        true,
      );
      if (isCatalogPathwaysError || _.isEmpty(response.data)) {
        throw new Error();
      }
      const uniquePathways = filterUniquePathways(response.data);
      updateSingleStat({
        value: uniquePathways?.length || 0,
        label: pathwaysLabel,
        loading: false,
      });
    } catch {
      updateSingleStat({
        value: 0,
        label: pathwaysLabel,
        loading: false,
      });
    }
  };

  const handlePerLearnerInfoStats = async () => {
    const assessmentsLabel = 'Assessments';
    const videosLabel = 'Videos';
    try {
      const response = await getPerLearnerInfo(
        [
          {
            org: getTenant(),
            //@ts-ignore
            userId: getUserName(),
            format: 'json',
            includeMainPlatform: true,
          },
        ],
        true,
      );
      if (isErrorgetPerLearnerInfo || _.isEmpty(response.data)) {
        throw new Error();
      }
      updateSingleStat({
        value: response?.data?.data?.total_assessments || 0,
        label: assessmentsLabel,
        loading: false,
      });
      updateSingleStat({
        value: response?.data?.data?.total_videos || 0,
        label: videosLabel,
        loading: false,
      });
    } catch {
      updateSingleStat({
        value: 0,
        label: assessmentsLabel,
        loading: false,
      });
      updateSingleStat({
        value: 0,
        label: videosLabel,
        loading: false,
      });
    }
  };

  const handleTimeSpentStat = async () => {
    const timeSpentLabel = 'Time Spent';
    try {
      // Same per-learner meta endpoint the old profile-sidebar All Time
      // box used — it carries `total_time_spent` in seconds.
      const response = await getUserPerLearnerInfo(
        {
          org: getTenant(),
          username: getUserName(),
          query: { meta: true },
        },
        true,
      );
      if (isErrorGetUserPerLearnerInfo || _.isEmpty(response.data)) {
        throw new Error();
      }
      const totalTimeSpentSeconds = response?.data?.data?.total_time_spent;
      const hours =
        typeof totalTimeSpentSeconds === 'number' && !isNaN(totalTimeSpentSeconds)
          ? Math.round(totalTimeSpentSeconds / 3600)
          : 0;
      updateSingleStat({
        value: `${hours}h`,
        label: timeSpentLabel,
        loading: false,
      });
    } catch {
      updateSingleStat({
        value: '0h',
        label: timeSpentLabel,
        loading: false,
      });
    }
  };

  useEffect(() => {
    handleSkillsPointActivityStats();
    handleActivitySkillsStats();
    handleCredentialsActivityStats();
    handleCoursesActivityStats();
    handleProgramsActivityStats();
    handlePathwaysActivityStats();
    handlePerLearnerInfoStats();
    handleTimeSpentStat();
  }, []);

  return {
    stats,
  };
};
