import { ProgramEnrollmentPlus } from '@iblai/iblai-api';

export interface ProgramMetadata {
  slug?: string | null;
  subject?: string | null;
  tags?: string[] | null;
  level?: string | null;
  topics?: string[] | null;
  promotion?: string | null;
  social_team?: string | null;
  social_channels?: string[] | null;
  description?: string;
  display_price?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  enrollment_start?: string | null;
  enrollment_end?: string | null;
  language?: string | null;
  credential?: string | null;
  catalog_visibility?: string | null;
  invitation_only?: boolean | null;
  custom?: Record<string, unknown> | null;
  card_image?: string | null;
  banner_image?: string;
}

export type CustomProgramEnrollmentPlus = {
  program_metadata?: ProgramMetadata | null;
} & ProgramEnrollmentPlus;
