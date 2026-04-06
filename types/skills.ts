export interface ReportedSkill {
  id: number;
  name: string;
  platform_key: string | null;
  slug: string | null;
  data: any | null;
}

export interface ReportedSkillsData {
  level: number[];
}

export interface ReportedSkills {
  user_id: number;
  username: string;
  skills: ReportedSkill[];
  data: ReportedSkillsData;
}

export interface EarnedSkillPoints {
  course_points: number;
  block_points: number;
  platform_points: number;
  total_points: number;
}

export interface EarnedSkills {
  [skillName: string]: EarnedSkillPoints;
}

export interface Skill {
  id?: number;
  name: string;
}

export interface UserSkill {
  level: number;
  name: string;
  id?: number;
  starred: boolean;
  type?: string;
}

export interface CatalogSearchSkill {
  type: 'skill';
  data: {
    id: number;
    name: string;
    slug: string;
    data?: Record<string, any>;
    platform: string | null;
    platform_name: string | null;
  };
  rating?: number;
}
