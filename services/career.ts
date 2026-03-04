import { createApi } from '@reduxjs/toolkit/query/react';
import { Company, Education, Experience, Institution } from '@iblai/iblai-api';
import { EducationRequestBody, UserMediaResponse } from '@/types/career';
import { SERVICES } from '@/lib/constants';
import { iblFetchBaseQuery } from '@/lib/utils';

// Define a service using a base URL and expected endpoints
export const CareerSlice = createApi({
  reducerPath: 'CareerSlice',
  baseQuery: iblFetchBaseQuery,
  tagTypes: [
    'user-education',
    'user-experience',
    'user-institution',
    'user-company',
    'user-resume',
  ],
  endpoints: (builder) => ({
    getUserEducation: builder.query<Education[], { username: string; platform_key: string }>({
      query: ({ username, platform_key }) => ({
        url: `/api/career/orgs/${platform_key}/education/users/${username}/`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      providesTags: ['user-education'],
    }),
    getUserExperience: builder.query<Experience[], { username: string; platform_key: string }>({
      query: ({ username, platform_key }) => ({
        url: `/api/career/orgs/${platform_key}/experience/users/${username}/`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      providesTags: ['user-experience'],
    }),
    getUserInstitutions: builder.query<Institution[], { username: string; platform_key: string }>({
      query: ({ username, platform_key }) => ({
        url: `/api/career/orgs/${platform_key}/institutions/users/${username}/`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      providesTags: ['user-institution'],
    }),
    getUserCompanies: builder.query<Company[], { username: string; platform_key: string }>({
      query: ({ username, platform_key }) => ({
        url: `/api/career/orgs/${platform_key}/companies/users/${username}/`,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      providesTags: ['user-company'],
    }),
    createUserEducation: builder.mutation<
      Education,
      {
        username: string;
        platform_key: string;
        education: EducationRequestBody;
      }
    >({
      query: ({ username, platform_key, education }) => ({
        url: `/api/career/orgs/${platform_key}/education/users/${username}/`,
        method: 'POST',
        body: education,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      invalidatesTags: ['user-education'],
    }),
    updateUserEducation: builder.mutation<
      Education,
      {
        username: string;
        platform_key: string;
        education_id: string;
        education: EducationRequestBody;
      }
    >({
      query: ({ username, platform_key, education_id, education }) => ({
        url: `/api/career/orgs/${platform_key}/education/users/${username}/?id=${education_id}`,
        method: 'PUT',
        body: education,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      invalidatesTags: ['user-education'],
    }),
    updateUserExperience: builder.mutation<
      Experience,
      {
        username: string;
        platform_key: string;
        experience_id: string;
        experience: Partial<Experience>;
      }
    >({
      query: ({ username, platform_key, experience_id, experience }) => ({
        url: `/api/career/orgs/${platform_key}/experience/users/${username}/?id=${experience_id}`,
        method: 'PUT',
        body: experience,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      invalidatesTags: ['user-experience'],
    }),
    createUserExperience: builder.mutation<
      Experience,
      {
        username: string;
        platform_key: string;
        experience: Partial<Experience>;
      }
    >({
      query: ({ username, platform_key, experience }) => ({
        url: `/api/career/orgs/${platform_key}/experience/users/${username}/`,
        method: 'POST',
        body: experience,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      invalidatesTags: ['user-experience'],
    }),
    createUserInstitution: builder.mutation<
      Institution,
      {
        username: string;
        platform_key: string;
        institution: Partial<Institution>;
      }
    >({
      query: ({ username, platform_key, institution }) => ({
        url: `/api/career/orgs/${platform_key}/institutions/users/${username}/`,
        method: 'POST',
        body: institution,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      invalidatesTags: ['user-institution'],
    }),
    createUserCompany: builder.mutation<
      Company,
      {
        username: string;
        platform_key: string;
        company: Partial<Company>;
      }
    >({
      query: ({ username, platform_key, company }) => ({
        url: `/api/career/orgs/${platform_key}/companies/users/${username}/`,
        method: 'POST',
        body: company,
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      invalidatesTags: ['user-company'],
    }),
    deleteUserEducation: builder.mutation<
      void,
      { username: string; platform_key: string; education_id: string }
    >({
      query: ({ username, platform_key, education_id }) => ({
        url: `/api/career/orgs/${platform_key}/education/users/${username}/?id=${education_id}`,
        method: 'DELETE',
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      invalidatesTags: ['user-education'],
    }),
    deleteUserExperience: builder.mutation<
      void,
      { username: string; platform_key: string; experience_id: string }
    >({
      query: ({ username, platform_key, experience_id }) => ({
        url: `/api/career/orgs/${platform_key}/experience/users/${username}/?id=${experience_id}`,
        method: 'DELETE',
        service: SERVICES.DM,
        includeCredentials: false,
      }),
      invalidatesTags: ['user-experience'],
    }),
    createUserResume: builder.mutation<
      UserMediaResponse,
      {
        username: string;
        platform_key: string;
        resume: FormData;
        method?: 'PUT' | 'POST';
      }
    >({
      query: ({ username, platform_key, resume, method = 'PUT' }) => ({
        url: `/api/career/resume/orgs/${platform_key}/users/${username}/`,
        method: method,
        body: resume,
        formData: true,
        service: SERVICES.DM,
        includeCredentials: false,
        isJson: false,
      }),
      invalidatesTags: ['user-resume'],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetUserEducationQuery,
  useLazyGetUserEducationQuery,
  useGetUserExperienceQuery,
  useLazyGetUserExperienceQuery,
  useGetUserInstitutionsQuery,
  useLazyGetUserInstitutionsQuery,
  useCreateUserEducationMutation,
  useUpdateUserEducationMutation,
  useCreateUserInstitutionMutation,
  useCreateUserExperienceMutation,
  useUpdateUserExperienceMutation,
  useGetUserCompaniesQuery,
  useLazyGetUserCompaniesQuery,
  useCreateUserCompanyMutation,
  useDeleteUserEducationMutation,
  useDeleteUserExperienceMutation,
  useCreateUserResumeMutation,
} = CareerSlice;
