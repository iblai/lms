export type SkillRating = {
  skill: string;
  rating: number | null;
};

export interface OnboardingSlideProps {
  onNext: () => void;
  onPrev: () => void;
  /* searchQuery: string
  setSearchQuery: (query: string) => void */
}

export interface RoleSelectionProps extends OnboardingSlideProps {
  selectedRoles: string[];
  toggleRole: (role: string) => void;
}

export interface SkillsSlideProps extends OnboardingSlideProps {
  selectedSkills: string[];
  toggleSkill: (skill: string) => void;
  skillRatings: SkillRating[];
  setSkillRating: (skill: string, rating: number) => void;
  getSkillRating: (skill: string) => number | null;
}

export interface ProfileSlideProps extends OnboardingSlideProps {
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
}

export interface FinalSlideProps extends OnboardingSlideProps {
  handleGetStarted: () => void;
}
