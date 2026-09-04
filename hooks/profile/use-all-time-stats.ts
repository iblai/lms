import { getTenant, getUserId, getUserName } from '@/utils/helpers';
import { useState, useEffect } from 'react';
import {
  // @ts-ignore
  useLazyGetUserReportedSkillsQuery,
  // @ts-ignore
  useLazyGetUserDesiredSkillsQuery,
} from '@iblai/iblai-js/data-layer';
import isEmpty from 'lodash/isEmpty';
import { useLazyGetUserCredentialsQuery } from '@/services/credentials';
import { useLazyGetUserEnrolledCoursesQuery } from '@/services/courses';

export const useAllTimeStats = () => {
  const [getUserReportedSkills, { isError: isErrorGetUserReportedSkills }] =
    useLazyGetUserReportedSkillsQuery();
  const [getUserDesiredSkills, { isError: isErrorGetUserDesiredSkills }] =
    useLazyGetUserDesiredSkillsQuery();
  const [getUserCredentials, { isError: isErrorGetUserCredentials }] =
    useLazyGetUserCredentialsQuery();
  const [getUserEnrolledCourses, { isError: isErrorGetUserEnrolledCourses }] =
    useLazyGetUserEnrolledCoursesQuery();

  const [courses, setCourses] = useState(0);
  const [credentials, setCredentials] = useState(0);
  const [skills, setSkills] = useState(0);

  const handleSkillsStats = async () => {
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
        throw new Error('Both reported- and desired-skills requests failed');
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
      setSkills(skillsCount);
    } catch (error) {
      console.error('Failed to load all-time skills count:', error);
      setSkills(0);
    }
  };

  const handleCredentialsStats = async () => {
    try {
      const response = await getUserCredentials(
        {
          org: getTenant(),
          username: getUserName(),
        },
        true,
      );
      if (isErrorGetUserCredentials || isEmpty(response?.data)) {
        throw new Error('Credentials request failed or returned no data');
      }
      setCredentials(response?.data?.data?.length || 0);
    } catch (error) {
      console.error('Failed to load all-time credentials count:', error);
      setCredentials(0);
    }
  };

  const handleCoursesStats = async () => {
    try {
      const response = await getUserEnrolledCourses(
        {
          username: getUserName(),
        },
        true,
      );
      if (isErrorGetUserEnrolledCourses || isEmpty(response.data)) {
        throw new Error('Enrolled courses request failed or returned no data');
      }
      setCourses(response?.data?.count || 0);
    } catch (error) {
      console.error('Failed to load all-time courses count:', error);
      setCourses(0);
    }
  };

  useEffect(() => {
    handleSkillsStats();
    handleCredentialsStats();
    handleCoursesStats();
  }, []);

  return {
    courses,
    credentials,
    skills,
  };
};
