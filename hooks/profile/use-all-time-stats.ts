import { getTenant, getUserId, getUserName } from '@/utils/helpers';
import { useState, useEffect } from 'react';
import {
  // @ts-ignore
  useLazyGetUserReportedSkillsQuery,
  // @ts-ignore
  useLazyGetUserDesiredSkillsQuery,
} from '@iblai/iblai-js/data-layer';
import _ from 'lodash';
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
      setSkills(skillsCount);
    } catch {
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
      if (isErrorGetUserCredentials || _.isEmpty(response?.data)) {
        throw new Error();
      }
      setCredentials(response?.data?.data?.length || 0);
    } catch {
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
      if (isErrorGetUserEnrolledCourses || _.isEmpty(response.data)) {
        throw new Error();
      }
      setCourses(response?.data?.count || 0);
    } catch {
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
