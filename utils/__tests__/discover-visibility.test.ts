import { describe, it, expect } from 'vitest';
import { isDiscoverEnabled } from '../discover-visibility';

describe('isDiscoverEnabled', () => {
  it('is disabled when hideDiscoverTab is true, regardless of metadata', () => {
    expect(isDiscoverEnabled({ hideDiscoverTab: true, enableDiscoverPage: true })).toBe(false);
    expect(isDiscoverEnabled({ hideDiscoverTab: true, enableDiscoverPage: false })).toBe(false);
    expect(isDiscoverEnabled({ hideDiscoverTab: true, enableDiscoverPage: null })).toBe(false);
    expect(isDiscoverEnabled({ hideDiscoverTab: true, enableDiscoverPage: undefined })).toBe(false);
  });

  it('treats null/undefined/true enable_discover_page as enabled', () => {
    expect(isDiscoverEnabled({ hideDiscoverTab: false, enableDiscoverPage: true })).toBe(true);
    expect(isDiscoverEnabled({ hideDiscoverTab: false, enableDiscoverPage: null })).toBe(true);
    expect(isDiscoverEnabled({ hideDiscoverTab: false, enableDiscoverPage: undefined })).toBe(true);
  });

  it('is disabled only when enable_discover_page is explicitly false', () => {
    expect(isDiscoverEnabled({ hideDiscoverTab: false, enableDiscoverPage: false })).toBe(false);
  });
});
