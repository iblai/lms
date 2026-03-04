export interface EducationRequestBody {
    id?: number;
    degree: string;
    field_of_study: string;
    institution_id: number;
    location?: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    grade: string;
    activities: string;
    description: string;
    start_month?: string | number;
    end_month?: string | number;
}

export interface InstitutionRequestBody {
    name: string;
    institution_type: string;
    accreditation: string;
    year_of_establishment: string;
    location: string;
    website: string;
    is_current: boolean;
}

export interface UploadedFile {
    name: string;
    url: string;
    type: string;
}

/**
 * Interface pour les données de formulaire lors de l'upload de médias
 * Utilisée avec FormData pour l'envoi de fichiers
 */
export interface UploadMediaRequestBody {
    link_1?: string;
    user: string;
    platform: string;
    file?: File;
}

export interface SocialLink {
    platform: string;
    social_link: string;
}

export interface ProfileImage {
    has_image: boolean;
    image_url_full: string;
    image_url_large: string;
    image_url_small: string;
    image_url_medium: string;
}

export interface TourTooltips {
    loaded_on_skills_spa: boolean;
}

export interface PublicMetadata {
    bio: string;
    name: string;
    about: string;
    language: string;
    social_links: SocialLink[];
    profile_image: ProfileImage;
    tour_tooltips: TourTooltips;
    enable_sidebar_ai_mentor_display: boolean;
}

export interface UserInfo {
    id: number;
    username: string;
    email: string;
    active: boolean;
    edx_data: null;
    user_id: number;
    bio: string;
    name: string;
    about: string;
    language: string;
    social_links: SocialLink[];
    public_metadata: PublicMetadata;
}

export interface File {
    name: string;
    url: string;
    type: string;
}

export interface Link {
    url: string;
}

export interface UserMediaResponse {
    id: number;
    user: number;
    user_info?: UserInfo;
    platform: string;
    files?: UploadedFile[];
    links?: Link[];
}
