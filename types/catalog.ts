import { PathwayEnrollmentPlus, ProgramEnrollmentPlus } from '@iblai/iblai-api';

export type UserSkillsPointRequest = {
  username: string;
  platform_key: string;
};

export type UserSkillsPointResponse = {
  username: string;
  platform_key: string;
  skill_points: number;
};

export type ActivityStats = {
  /** Numeric count, or a preformatted display value (e.g. "12h"). */
  value: number | string;
  label: string;
  loading: boolean;
};

export type UserAssignedPathwaysResponse = {
  count: number;
  next_page: string | null;
  previous_page: string | null;
  results: PathwayEnrollmentPlus[];
};

export type UserAssignedProgramsResponse = {
  count: number;
  next_page: string | null;
  previous_page: string | null;
  results: ProgramEnrollmentPlus[];
};
