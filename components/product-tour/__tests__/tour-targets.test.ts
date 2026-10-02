import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  findSidebarFooter,
  isTourTargetVisible,
  resolveTourTarget,
  SEARCH_TARGET_SELECTOR,
  TOUR_TARGET,
  tourSelector,
} from '../tour-targets';

const SIDEBAR_HTML = `
  <div data-slot="sidebar">
    <aside data-state="collapsed">
      <div class="shrink-0" id="header"></div>
      <nav id="nav"></nav>
      <div class="shrink-0 space-y-0.5 border-t border-[#e2e8f0] px-2 py-2" id="footer">
        <button type="button" aria-label="Management">M</button>
      </div>
    </aside>
  </div>
`;

describe('tour targets', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('builds data-tour selectors for the host-owned hooks', () => {
    expect(tourSelector(TOUR_TARGET.profile)).toBe('[data-tour="profile"]');
    expect(tourSelector(TOUR_TARGET.discover)).toBe('[data-tour="discover"]');
  });

  it('targets the SDK search form inside the banner', () => {
    document.body.innerHTML = '<header><nav><form role="search"><input /></form></nav></header>';
    expect(document.querySelector(SEARCH_TARGET_SELECTOR)).not.toBeNull();
  });

  describe('findSidebarFooter', () => {
    it('returns the border-t block that closes the sidebar aside', () => {
      document.body.innerHTML = SIDEBAR_HTML;
      expect(findSidebarFooter()?.id).toBe('footer');
    });

    it('returns null when no sidebar is mounted', () => {
      document.body.innerHTML = '<div>no sidebar here</div>';
      expect(findSidebarFooter()).toBeNull();
    });

    it('returns null when the aside does not end with the footer block', () => {
      document.body.innerHTML = `
        <div data-slot="sidebar"><aside data-state="expanded"><nav></nav><div class="px-2"></div></aside></div>`;
      expect(findSidebarFooter()).toBeNull();
    });

    it('returns null for an empty aside', () => {
      document.body.innerHTML =
        '<div data-slot="sidebar"><aside data-state="expanded"></aside></div>';
      expect(findSidebarFooter()).toBeNull();
    });

    it('searches from a custom root', () => {
      const root = document.createElement('div');
      root.innerHTML = SIDEBAR_HTML;
      expect(findSidebarFooter(root)?.id).toBe('footer');
      expect(findSidebarFooter()).toBeNull();
    });
  });

  describe('resolveTourTarget', () => {
    it('resolves a selector', () => {
      document.body.innerHTML = '<div data-tour="profile" id="p"></div>';
      expect(resolveTourTarget('[data-tour="profile"]')?.id).toBe('p');
    });

    it('calls a getter', () => {
      const el = document.createElement('div');
      expect(resolveTourTarget(() => el)).toBe(el);
      expect(resolveTourTarget(() => null)).toBeNull();
    });

    it('passes an element through', () => {
      const el = document.createElement('span');
      expect(resolveTourTarget(el)).toBe(el);
    });

    it('unwraps a ref', () => {
      const el = document.createElement('span');
      expect(resolveTourTarget({ current: el })).toBe(el);
      expect(resolveTourTarget({ current: null })).toBeNull();
    });
  });

  describe('isTourTargetVisible', () => {
    it('is false when the target is missing', () => {
      expect(isTourTargetVisible('[data-tour="nope"]')).toBe(false);
    });

    it('is false when the element has no layout boxes (display: none)', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      // jsdom reports no client rects for anything, which mirrors display:none.
      expect(isTourTargetVisible(el)).toBe(false);
    });

    it('is true when the element is laid out', () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      vi.spyOn(el, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
      expect(isTourTargetVisible(el)).toBe(true);
    });
  });
});
