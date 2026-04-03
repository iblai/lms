import { describe, it, expect } from 'vitest';
import { appVersion } from '../version';
import pkg from '../../package.json';

describe('version', () => {
  it('exports appVersion', () => {
    expect(appVersion).toBeDefined();
  });

  it('appVersion matches package.json version', () => {
    expect(appVersion).toBe(pkg.version);
  });

  it('appVersion is a string', () => {
    expect(typeof appVersion).toBe('string');
  });

  it('appVersion follows semver format', () => {
    // Semver pattern: major.minor.patch with optional pre-release
    const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
    expect(appVersion).toMatch(semverRegex);
  });

  it('appVersion is not empty', () => {
    expect(appVersion.length).toBeGreaterThan(0);
  });
});
