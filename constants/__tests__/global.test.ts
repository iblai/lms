import { describe, it, expect } from 'vitest';
import { isNonAuthPathname } from '../global';

describe('isNonAuthPathname', () => {
  it('matches the listed non-auth pages', () => {
    expect(isNonAuthPathname('/')).toBe(true);
    expect(isNonAuthPathname('/sso-login')).toBe(true);
    expect(isNonAuthPathname('/sso-login-complete')).toBe(true);
    expect(isNonAuthPathname('/version')).toBe(true);
  });

  it('does not exempt the error page — it renders inside the normal layout', () => {
    expect(isNonAuthPathname('/error/409')).toBe(false);
    expect(isNonAuthPathname('/error/404')).toBe(false);
  });

  it('matches the tenant-scoped start page', () => {
    expect(isNonAuthPathname('/platform/main/start')).toBe(true);
    expect(isNonAuthPathname('/platform/main/start/')).toBe(true);
  });

  it('does not match authenticated pages', () => {
    expect(isNonAuthPathname('/platform/main/home')).toBe(false);
    expect(isNonAuthPathname('/home')).toBe(false);
  });
});
