import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('config.settings.supportEmail', () => {
  beforeEach(() => {
    // Ensure no runtime env leaks between tests
    if (typeof window !== 'undefined') {
      delete (window as any).__ENV__;
    }
  });

  afterEach(() => {
    vi.resetModules();
    if (typeof window !== 'undefined') {
      delete (window as any).__ENV__;
    }
  });

  it('returns the default fallback when env var is not set', async () => {
    const { config } = await import('@/lib/config');
    // When NEXT_PUBLIC_SUPPORT_EMAIL is not set in either runtime or process.env
    // and no __ENV__ override, it should fall back to 'support@ibl.ai'
    const result = config.settings.supportEmail();
    expect(result).toBe('support@ibl.ai');
  });

  it('returns the runtime env value when window.__ENV__ is set', async () => {
    (window as any).__ENV__ = { NEXT_PUBLIC_SUPPORT_EMAIL: 'help@example.com' };
    const { config } = await import('@/lib/config');
    expect(config.settings.supportEmail()).toBe('help@example.com');
  });

  it('runtime env takes precedence over process.env', async () => {
    (window as any).__ENV__ = { NEXT_PUBLIC_SUPPORT_EMAIL: 'runtime@example.com' };
    const { config } = await import('@/lib/config');
    expect(config.settings.supportEmail()).toBe('runtime@example.com');
  });
});

describe('getEnv', () => {
  afterEach(() => {
    vi.resetModules();
    if (typeof window !== 'undefined') {
      delete (window as any).__ENV__;
    }
  });

  it('returns fallback when key is absent from all sources', async () => {
    const { getEnv } = await import('@/lib/config');
    expect(getEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'fallback@test.com')).toBe('fallback@test.com');
  });

  it('returns window.__ENV__ value when present', async () => {
    (window as any).__ENV__ = { NEXT_PUBLIC_SUPPORT_EMAIL: 'env@runtime.com' };
    const { getEnv } = await import('@/lib/config');
    expect(getEnv('NEXT_PUBLIC_SUPPORT_EMAIL', 'fallback@test.com')).toBe('env@runtime.com');
  });

  it('returns empty string as default fallback when no fallback provided', async () => {
    const { getEnv } = await import('@/lib/config');
    expect(getEnv('NEXT_PUBLIC_SUPPORT_EMAIL')).toBe('');
  });
});
