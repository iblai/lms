const env = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_DM_URL: process.env.NEXT_PUBLIC_DM_URL,
  NEXT_PUBLIC_DM_URL_TEST: process.env.NEXT_PUBLIC_DM_URL_TEST,
  NEXT_PUBLIC_AXD_URL: process.env.NEXT_PUBLIC_AXD_URL,
  NEXT_PUBLIC_LMS_URL: process.env.NEXT_PUBLIC_LMS_URL,
  NEXT_PUBLIC_STUDIO_URL: process.env.NEXT_PUBLIC_STUDIO_URL,
  NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
  NEXT_PUBLIC_MFE_URL: process.env.NEXT_PUBLIC_MFE_URL,
  NEXT_PUBLIC_SPA_ANALYTICS_URL: process.env.NEXT_PUBLIC_SPA_ANALYTICS_URL,
  NEXT_PUBLIC_HIDE_RECOMMENDED_TAB: process.env.NEXT_PUBLIC_HIDE_RECOMMENDED_TAB,
  NEXT_PUBLIC_DISCOVER_FACETS_FILTERS_TO_HIDE:
    process.env.NEXT_PUBLIC_DISCOVER_FACETS_FILTERS_TO_HIDE,
  NEXT_PUBLIC_COURSE_ELIGIBILITY_ENABLED: process.env.NEXT_PUBLIC_COURSE_ELIGIBILITY_ENABLED,
  NEXT_PUBLIC_ENABLE_START_ROLE: process.env.NEXT_PUBLIC_ENABLE_START_ROLE,
  NEXT_PUBLIC_USE_FOOTER_MENUS: process.env.NEXT_PUBLIC_USE_FOOTER_MENUS,
  NEXT_PUBLIC_FOOTER_MENUS: process.env.NEXT_PUBLIC_FOOTER_MENUS,
  NEXT_PUBLIC_COPYRIGHT: process.env.NEXT_PUBLIC_COPYRIGHT,
  NEXT_PUBLIC_MENTOR_URL: process.env.NEXT_PUBLIC_MENTOR_URL,
  NEXT_PUBLIC_ENABLE_MENTOR: process.env.NEXT_PUBLIC_ENABLE_MENTOR,
  NEXT_PUBLIC_ENABLE_GRAVATAR_ON_PROFILE_PIC:
    process.env.NEXT_PUBLIC_ENABLE_GRAVATAR_ON_PROFILE_PIC,
  NEXT_PUBLIC_DEFAULT_EMBEDDED_MENTOR_NAME: process.env.NEXT_PUBLIC_DEFAULT_EMBEDDED_MENTOR_NAME,
  NEXT_PUBLIC_PLATFORM_BASE_DOMAIN: process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN,
  NEXT_PUBLIC_ENABLE_RBAC: process.env.NEXT_PUBLIC_ENABLE_RBAC,
};

const runtimeEnv = () => (typeof window !== 'undefined' ? window.__ENV__ || {} : {});

export const getEnv = (key: keyof typeof env, fallback = ''): string => {
  return runtimeEnv()[key] ?? env[key] ?? fallback;
};

export const config = {
  environment: () => getEnv('NODE_ENV', 'development'),
  urls: {
    dm: () => getEnv('NEXT_PUBLIC_DM_URL', 'https://base.manager.iblai.app'),
    axd: () => getEnv('NEXT_PUBLIC_AXD_URL', 'https://base.manager.iblai.app'),
    lms: () => getEnv('NEXT_PUBLIC_LMS_URL', 'https://learn.iblai.app'),
    studio: () => getEnv('NEXT_PUBLIC_STUDIO_URL', 'https://studio.learn.iblai.app'),
    auth: () => getEnv('NEXT_PUBLIC_AUTH_URL', 'https://login.iblai.app'),
    mfe: () => getEnv('NEXT_PUBLIC_MFE_URL', 'https://apps.learn.iblai.app'),
    analytics: () => getEnv('NEXT_PUBLIC_SPA_ANALYTICS_URL', 'https://analytics.iblai.app'),
    mentor: () => getEnv('NEXT_PUBLIC_MENTOR_URL', 'https://mentorai.iblai.app'),
  },
  settings: {
    hideRecommendedTab: () => getEnv('NEXT_PUBLIC_HIDE_RECOMMENDED_TAB', 'false') === 'true',
    discoverFacetsToHide: () => getEnv('NEXT_PUBLIC_DISCOVER_FACETS_FILTERS_TO_HIDE', ''),
    appName: () => 'skills',
    courseEligibilityEnabled: () =>
      getEnv('NEXT_PUBLIC_COURSE_ELIGIBILITY_ENABLED', 'false') === 'true',
    startPageEnabled: () => getEnv('NEXT_PUBLIC_ENABLE_START_ROLE', 'false') === 'true',
    footerMenusEnabled: () => getEnv('NEXT_PUBLIC_USE_FOOTER_MENUS', 'false') === 'true',
    footerMenus: () => getEnv('NEXT_PUBLIC_FOOTER_MENUS', ''),
    copyright: () => getEnv('NEXT_PUBLIC_COPYRIGHT', ''),
    mentorEnabled: () => getEnv('NEXT_PUBLIC_ENABLE_MENTOR', 'true') === 'true',
    enableGravatarOnProfilePic: () => getEnv('NEXT_PUBLIC_ENABLE_GRAVATAR_ON_PROFILE_PIC', 'true'),
    defaultEmbeddedMentorName: () => getEnv('NEXT_PUBLIC_DEFAULT_EMBEDDED_MENTOR_NAME', 'mentorAI'),
    platformBaseDomain: () => getEnv('NEXT_PUBLIC_PLATFORM_BASE_DOMAIN', ''),
    enableRBAC: () => getEnv('NEXT_PUBLIC_ENABLE_RBAC', 'false') === 'true',
  },
};
