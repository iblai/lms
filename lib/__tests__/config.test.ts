import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Type assertion to allow modifying process.env
const processEnv = process.env as Record<string, string | undefined>;

describe('config module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Clear window.__ENV__
    if (typeof window !== 'undefined') {
      (window as unknown as { __ENV__?: Record<string, string> }).__ENV__ = undefined;
    }
  });

  afterEach(() => {
    // Restore original env
    Object.keys(processEnv).forEach((key) => {
      if (!(key in originalEnv)) {
        delete processEnv[key];
      }
    });
    Object.assign(processEnv, originalEnv);
  });

  describe('getEnv', () => {
    it('returns process.env value when window.__ENV__ is not available', async () => {
      processEnv.NEXT_PUBLIC_API_BASE_URL = 'test-base-value';

      const { getEnv } = await import('../config');
      expect(getEnv('NEXT_PUBLIC_API_BASE_URL')).toBe('test-base-value');
    });

    it('returns fallback when env value is undefined', async () => {
      delete processEnv.NEXT_PUBLIC_API_BASE_URL;

      const { getEnv } = await import('../config');
      expect(getEnv('NEXT_PUBLIC_API_BASE_URL', 'fallback-value')).toBe('fallback-value');
    });

    it('returns empty string as default fallback when value is undefined', async () => {
      delete processEnv.NEXT_PUBLIC_API_BASE_URL;

      const { getEnv } = await import('../config');
      expect(getEnv('NEXT_PUBLIC_API_BASE_URL')).toBe('');
    });

    it('prioritizes window.__ENV__ over process.env', async () => {
      processEnv.NEXT_PUBLIC_API_BASE_URL = 'process-value';
      (window as unknown as { __ENV__: Record<string, string> }).__ENV__ = {
        NEXT_PUBLIC_API_BASE_URL: 'window-value',
      };

      const { getEnv } = await import('../config');
      expect(getEnv('NEXT_PUBLIC_API_BASE_URL')).toBe('window-value');
    });

    it('falls back to process.env when key not in window.__ENV__', async () => {
      processEnv.NEXT_PUBLIC_AUTH_URL = 'auth-process-value';
      (window as unknown as { __ENV__: Record<string, string> }).__ENV__ = {
        NEXT_PUBLIC_API_BASE_URL: 'base-window-value',
      };

      const { getEnv } = await import('../config');
      expect(getEnv('NEXT_PUBLIC_AUTH_URL')).toBe('auth-process-value');
    });

    it('returns the value when env is set (not the fallback)', async () => {
      processEnv.NEXT_PUBLIC_API_BASE_URL = 'actual-value';

      const { getEnv } = await import('../config');
      expect(getEnv('NEXT_PUBLIC_API_BASE_URL', 'fallback')).toBe('actual-value');
    });
  });

  describe('config.environment', () => {
    it('returns NODE_ENV value', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const { config } = await import('../config');
      expect(config.environment()).toBe('production');

      vi.unstubAllEnvs();
    });

    it('returns development as default when NODE_ENV is undefined', async () => {
      vi.stubEnv('NODE_ENV', undefined as unknown as string);

      const { config } = await import('../config');
      expect(config.environment()).toBe('development');

      vi.unstubAllEnvs();
    });
  });

  describe('config.urls', () => {
    it('returns dm url derived from default api base url', async () => {
      delete processEnv.NEXT_PUBLIC_API_BASE_URL;

      const { config } = await import('../config');
      expect(config.urls.dm()).toBe('https://api.iblai.app/dm');
    });

    it('returns dm url derived from custom api base url', async () => {
      processEnv.NEXT_PUBLIC_API_BASE_URL = 'https://custom.api.url';

      const { config } = await import('../config');
      expect(config.urls.dm()).toBe('https://custom.api.url/dm');
    });

    it('returns axd url derived from api base url', async () => {
      delete processEnv.NEXT_PUBLIC_API_BASE_URL;

      const { config } = await import('../config');
      expect(config.urls.axd()).toBe('https://api.iblai.app/axd');
    });

    it('returns lms url derived from api base url', async () => {
      delete processEnv.NEXT_PUBLIC_API_BASE_URL;

      const { config } = await import('../config');
      expect(config.urls.lms()).toBe('https://lms.iblai.app');
    });

    it('returns studio url derived from api base url', async () => {
      delete processEnv.NEXT_PUBLIC_API_BASE_URL;

      const { config } = await import('../config');
      expect(config.urls.studio()).toBe('https://api.iblai.app/studio');
    });

    it('returns auth url with default fallback when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_AUTH_URL;

      const { config } = await import('../config');
      expect(config.urls.auth()).toBe('https://login.iblai.app');
    });

    it('returns mfe url with default fallback when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_MFE_URL;

      const { config } = await import('../config');
      expect(config.urls.mfe()).toBe('https://apps.learn.iblai.app');
    });

    it('returns analytics url with default fallback when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_SPA_ANALYTICS_URL;

      const { config } = await import('../config');
      expect(config.urls.analytics()).toBe('https://analytics.iblai.app');
    });

    it('returns mentor url with default fallback when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_MENTOR_URL;

      const { config } = await import('../config');
      expect(config.urls.mentor()).toBe('https://mentorai.iblai.app');
    });
  });

  describe('config.settings', () => {
    it('returns hideRecommendedTab as false by default', async () => {
      delete processEnv.NEXT_PUBLIC_HIDE_RECOMMENDED_TAB;

      const { config } = await import('../config');
      expect(config.settings.hideRecommendedTab()).toBe(false);
    });

    it('returns hideRecommendedTab as true when set', async () => {
      processEnv.NEXT_PUBLIC_HIDE_RECOMMENDED_TAB = 'true';

      const { config } = await import('../config');
      expect(config.settings.hideRecommendedTab()).toBe(true);
    });

    it('returns discoverFacetsToHide with empty default when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_DISCOVER_FACETS_FILTERS_TO_HIDE;

      const { config } = await import('../config');
      expect(config.settings.discoverFacetsToHide()).toBe('');
    });

    it('returns discoverFacetsToHide when configured', async () => {
      processEnv.NEXT_PUBLIC_DISCOVER_FACETS_FILTERS_TO_HIDE = 'facet1,facet2';

      const { config } = await import('../config');
      expect(config.settings.discoverFacetsToHide()).toBe('facet1,facet2');
    });

    it('returns appName as skills', async () => {
      const { config } = await import('../config');
      expect(config.settings.appName()).toBe('skills');
    });

    it('returns courseEligibilityEnabled as false by default', async () => {
      delete processEnv.NEXT_PUBLIC_COURSE_ELIGIBILITY_ENABLED;

      const { config } = await import('../config');
      expect(config.settings.courseEligibilityEnabled()).toBe(false);
    });

    it('returns courseEligibilityEnabled as true when set', async () => {
      processEnv.NEXT_PUBLIC_COURSE_ELIGIBILITY_ENABLED = 'true';

      const { config } = await import('../config');
      expect(config.settings.courseEligibilityEnabled()).toBe(true);
    });

    it('returns startPageEnabled as false by default', async () => {
      delete processEnv.NEXT_PUBLIC_ENABLE_START_ROLE;

      const { config } = await import('../config');
      expect(config.settings.startPageEnabled()).toBe(false);
    });

    it('returns startPageEnabled as true when set', async () => {
      processEnv.NEXT_PUBLIC_ENABLE_START_ROLE = 'true';

      const { config } = await import('../config');
      expect(config.settings.startPageEnabled()).toBe(true);
    });

    it('returns footerMenusEnabled as false by default', async () => {
      delete processEnv.NEXT_PUBLIC_USE_FOOTER_MENUS;

      const { config } = await import('../config');
      expect(config.settings.footerMenusEnabled()).toBe(false);
    });

    it('returns footerMenusEnabled as true when set', async () => {
      processEnv.NEXT_PUBLIC_USE_FOOTER_MENUS = 'true';

      const { config } = await import('../config');
      expect(config.settings.footerMenusEnabled()).toBe(true);
    });

    it('returns footerMenus with empty default when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_FOOTER_MENUS;

      const { config } = await import('../config');
      expect(config.settings.footerMenus()).toBe('');
    });

    it('returns footerMenus when configured', async () => {
      processEnv.NEXT_PUBLIC_FOOTER_MENUS = '[{"label":"Home","url":"/"}]';

      const { config } = await import('../config');
      expect(config.settings.footerMenus()).toBe('[{"label":"Home","url":"/"}]');
    });

    it('returns copyright with empty default when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_COPYRIGHT;

      const { config } = await import('../config');
      expect(config.settings.copyright()).toBe('');
    });

    it('returns copyright when configured', async () => {
      processEnv.NEXT_PUBLIC_COPYRIGHT = '© 2025 Company';

      const { config } = await import('../config');
      expect(config.settings.copyright()).toBe('© 2025 Company');
    });

    it('returns mentorEnabled as true when not set (default fallback is true)', async () => {
      delete processEnv.NEXT_PUBLIC_ENABLE_MENTOR;

      const { config } = await import('../config');
      // Default is 'true' so getEnv returns 'true' as fallback
      // Then 'true' === 'true' is true
      expect(config.settings.mentorEnabled()).toBe(true);
    });

    it('returns mentorEnabled as true when set to true', async () => {
      processEnv.NEXT_PUBLIC_ENABLE_MENTOR = 'true';

      const { config } = await import('../config');
      expect(config.settings.mentorEnabled()).toBe(true);
    });

    it('returns mentorEnabled as false when set to false', async () => {
      processEnv.NEXT_PUBLIC_ENABLE_MENTOR = 'false';

      const { config } = await import('../config');
      expect(config.settings.mentorEnabled()).toBe(false);
    });

    it('returns enableGravatarOnProfilePic with default true when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_ENABLE_GRAVATAR_ON_PROFILE_PIC;

      const { config } = await import('../config');
      expect(config.settings.enableGravatarOnProfilePic()).toBe('true');
    });

    it('returns enableGravatarOnProfilePic when configured', async () => {
      processEnv.NEXT_PUBLIC_ENABLE_GRAVATAR_ON_PROFILE_PIC = 'false';

      const { config } = await import('../config');
      expect(config.settings.enableGravatarOnProfilePic()).toBe('false');
    });

    it('returns defaultEmbeddedMentorName with default when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_DEFAULT_EMBEDDED_MENTOR_NAME;

      const { config } = await import('../config');
      expect(config.settings.defaultEmbeddedMentorName()).toBe('mentorAI');
    });

    it('returns defaultEmbeddedMentorName when configured', async () => {
      processEnv.NEXT_PUBLIC_DEFAULT_EMBEDDED_MENTOR_NAME = 'customMentor';

      const { config } = await import('../config');
      expect(config.settings.defaultEmbeddedMentorName()).toBe('customMentor');
    });

    it('returns platformBaseDomain with empty default when undefined', async () => {
      delete processEnv.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN;

      const { config } = await import('../config');
      expect(config.settings.platformBaseDomain()).toBe('');
    });

    it('returns platformBaseDomain when configured', async () => {
      processEnv.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN = 'example.com';

      const { config } = await import('../config');
      expect(config.settings.platformBaseDomain()).toBe('example.com');
    });

    it('returns enableRBAC as false by default', async () => {
      delete processEnv.NEXT_PUBLIC_ENABLE_RBAC;

      const { config } = await import('../config');
      expect(config.settings.enableRBAC()).toBe(false);
    });

    it('returns enableRBAC as true when set', async () => {
      processEnv.NEXT_PUBLIC_ENABLE_RBAC = 'true';

      const { config } = await import('../config');
      expect(config.settings.enableRBAC()).toBe(true);
    });
  });
});
