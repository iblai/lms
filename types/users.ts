export interface ProfileImage {
  has_image: boolean;
  image_url_full: string;
  image_url_large: string;
  image_url_medium: string;
  image_url_small: string;
}

export interface SocialLink {
  platform: string;
  social_link: string;
}

export interface TourTooltips {
  loaded_on_skills_spa: boolean;
  loaded_on_analytics_spa: boolean;
}

export interface PublicMetadata {
  bio: string;
  name: string;
  about: string;
  language: string;
  social_links: SocialLink[];
  profile_image: ProfileImage;
  tour_tooltips: TourTooltips;
  is_profile_public: boolean;
  enable_sidebar_ai_mentor_display: boolean;
  enable_skills_leaderboard_display: boolean;
}

export interface UserMetadata {
  account_privacy: string;
  profile_image: ProfileImage;
  username: string;
  bio: string;
  course_certificates: any | null;
  country: string | null;
  date_joined: string;
  language_proficiencies: any[];
  level_of_education: string | null;
  social_links: SocialLink[];
  time_zone: string | null;
  accomplishments_shared: boolean;
  name: string;
  email: string;
  id: number;
  verified_name: string | null;
  extended_profile: any[];
  gender: string | null;
  state: string | null;
  goals: any | null;
  is_active: boolean;
  last_login: string;
  mailing_address: string | null;
  requires_parental_consent: boolean;
  secondary_email: string | null;
  secondary_email_enabled: boolean | null;
  year_of_birth: number;
  phone_number: string | null;
  activation_key: string | null;
  pending_name_change: string | null;
  about: string;
  language: string;
  public_metadata: PublicMetadata;
  is_profile_public: boolean;
}
