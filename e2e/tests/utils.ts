type authFlow = 'username_password' | 'magic_link' | 'sso' | 'direct_sso';

export const SKILL_HOST = process.env.SKILLS_HOST || '';
export const AUTH_HOST = process.env.AUTH_HOST || '';
export const MENTOR_NEXTJS_HOST = process.env.MENTOR_NEXTJS_HOST || '';
export const EMBED_URL =
  process.env.EMBED_URL ||
  'https://conradmugabe.vercel.app/' ||
  'https://en.wikipedia.org/wiki/Main_Page';
export const INVITE_USERNAME = process.env.INVITE_USERNAME || '';
export const INVITE_USER_PASSWORD = process.env.INVITE_USER_PASSWORD || '';

export const skillsUrlsToTest = [
  '/discover',
  '/profile/public-profile',
  '/recommended',
  '/profile/skills',
  '/profile/credentials',
  '/profile/pathways',
  '/profile/programs',
  '/profile/courses',
];
