import { describe, it, expect } from 'vitest';

import { hasUserOnboarding, resolveOnboardingFlow } from '../onboarding-flow';

const withAgent = {
  user_onboarding_form: {
    version: 1,
    enabled: true,
    sections: [],
    agent: { mentor_unique_id: 'agent-1', name: 'Guide' },
  },
};

const turnedOff = {
  user_onboarding_form: { ...withAgent.user_onboarding_form, enabled: false },
};

describe('hasUserOnboarding', () => {
  it('needs the flow switched on with something in it', () => {
    expect(hasUserOnboarding(withAgent)).toBe(true);
    expect(hasUserOnboarding(turnedOff)).toBe(false);
    expect(hasUserOnboarding({ platform_name: 'Acme' })).toBe(false);
    expect(hasUserOnboarding(undefined)).toBe(false);
  });
});

describe('resolveOnboardingFlow', () => {
  it('gives members the member flow, whatever the param says', () => {
    expect(resolveOnboardingFlow({ isAdmin: false, metadata: withAgent })).toBe('user');
    expect(resolveOnboardingFlow({ isAdmin: false, flowParam: 'admin', metadata: withAgent })).toBe(
      'user',
    );
    // Even with nothing configured — the wizard explains that itself.
    expect(resolveOnboardingFlow({ isAdmin: false, metadata: undefined })).toBe('user');
  });

  it('defaults an admin to the member flow when the tenant has one', () => {
    expect(resolveOnboardingFlow({ isAdmin: true, metadata: withAgent })).toBe('user');
  });

  it('falls back to the setup flow when the tenant has no member onboarding', () => {
    expect(resolveOnboardingFlow({ isAdmin: true, metadata: turnedOff })).toBe('admin');
    expect(resolveOnboardingFlow({ isAdmin: true, metadata: {} })).toBe('admin');
  });

  it('lets the param override the default either way', () => {
    expect(resolveOnboardingFlow({ isAdmin: true, flowParam: 'admin', metadata: withAgent })).toBe(
      'admin',
    );
    expect(resolveOnboardingFlow({ isAdmin: true, flowParam: 'user', metadata: {} })).toBe('user');
    // Anything else is not a choice — fall back to the default.
    expect(resolveOnboardingFlow({ isAdmin: true, flowParam: 'nonsense', metadata: {} })).toBe(
      'admin',
    );
  });
});
