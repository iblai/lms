import { test as setup, createAuthSetup } from '@iblai/iblai-js/playwright';

const SKILL_HOST = process.env.SKILLS_HOST || '';
const AUTH_HOST = process.env.AUTH_HOST || '';

setup(
  'authenticate',
  createAuthSetup({
    hostUrl: SKILL_HOST,
    authHost: AUTH_HOST,
    appName: 'skills',
    postLoginUrlMatcher: (url) => url.href.includes('/home') || url.href.includes('/start'),
    authFlow:
      (process.env.AUTH_FLOW as 'username_password' | 'magic_link' | 'sso' | 'direct_sso') ||
      'username_password',
    authIdp: process.env.AUTH_IDP,
  }),
);
