import { createApi } from '@reduxjs/toolkit/query/react';
import { ReportedSkills } from '@/types/skills';
import { iblFetchBaseQuery } from '@/lib/utils';
import { SERVICES } from '@/lib/constants';

// Define a service using a base URL and expected endpoints
export const SkillsSlice = createApi({
  reducerPath: 'SkillsSlice',
  baseQuery: iblFetchBaseQuery,
  endpoints: (builder) => ({
    getReportedSkills: builder.query<ReportedSkills, string>({
      query: (user_id) => ({
        url: `/api/catalog/skills/reported/?user_id=${user_id}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
    getEarnedSkills: builder.query<ReportedSkills, string>({
      //query: (queryParams) => `/api/catalog/milestones/skill_points/user/?${new URLSearchParams(queryParams).toString()}`,
      query: (username) => ({
        url: `/api/catalog/milestones/skill_points/user/?username=${username}`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetReportedSkillsQuery,
  useLazyGetReportedSkillsQuery,
  useGetEarnedSkillsQuery,
  useLazyGetEarnedSkillsQuery,
} = SkillsSlice;
