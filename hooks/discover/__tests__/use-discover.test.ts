import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: vi.fn(() => 'https://lms.example.com'),
    },
  },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

const mockPagination = { count: 0, current_page: 1, total_pages: 1 };
const mockCatalog = vi.hoisted(() => ({
  handleSearch: vi.fn(),
  isError: false,
  pagination: { count: 0, current_page: 1, total_pages: 1 },
}));
vi.mock('@/hooks/search/use-personnalized-catalog', () => ({
  usePersonnalizedCatalog: vi.fn(() => mockCatalog),
}));

const mockTenantMetadata = vi.hoisted(() => ({
  metadata: { skills_include_community_courses: false },
}));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => mockTenantMetadata),
  isLoggedIn: vi.fn(() => true),
}));

// use-debounce — execute synchronously so effects can be observed in tests
vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => fn,
}));

import { useDiscover } from '../use-discover';

describe('useDiscover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: { facets: {}, results: [] },
    }));
    mockCatalog.isError = false;
    mockCatalog.pagination = mockPagination;
    mockTenantMetadata.metadata = { skills_include_community_courses: false };
    // jsdom needs a writable href for handleSelectFacets("q", ...)
    Object.defineProperty(window, 'location', {
      value: new URL('https://app.example.com/discover'),
      writable: true,
    });
  });

  it('returns expected shape', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => {
      expect(result.current).toHaveProperty('contents');
    });
    expect(result.current).toHaveProperty('facets');
    expect(result.current).toHaveProperty('filteredFacets');
    expect(result.current).toHaveProperty('contentsLoading');
    expect(result.current).toHaveProperty('facetsLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('handleToggleFacet');
    expect(result.current).toHaveProperty('handleSelectFacets');
    expect(result.current).toHaveProperty('selectedFacets');
    expect(result.current).toHaveProperty('isFacetTermSelected');
    expect(result.current).toHaveProperty('handleFormatContents');
    expect(result.current).toHaveProperty('pagination');
    expect(result.current).toHaveProperty('page');
    expect(result.current).toHaveProperty('setPage');
    expect(result.current).toHaveProperty('handleFilterFacets');
    expect(result.current).toHaveProperty('setSelectedFacets');
  });

  it('initializes with defaults', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => {
      expect(result.current.facetsLoading).toBe(false);
    });
    expect(result.current.page).toBe(1);
    expect(result.current.contents).toEqual([]);
    expect(result.current.facets).toEqual([]);
    expect(result.current.filteredFacets).toEqual([]);
    expect(result.current.selectedFacets).toEqual({ content: ['courses'] });
  });

  it('triggers handleSearch with returnFacet=true on initial mount', async () => {
    renderHook(() => useDiscover({}));
    await waitFor(() => {
      expect(mockCatalog.handleSearch).toHaveBeenCalled();
    });
    const calls = mockCatalog.handleSearch.mock.calls;
    expect(calls[0][0]).toMatchObject({
      username: 'test-user',
      returnFacet: true,
      tenant: 'test-tenant',
    });
  });

  it('omits tenant when skills_include_community_courses is true', async () => {
    mockTenantMetadata.metadata = { skills_include_community_courses: true };
    renderHook(() => useDiscover({}));
    await waitFor(() => {
      expect(mockCatalog.handleSearch).toHaveBeenCalled();
    });
    const calls = mockCatalog.handleSearch.mock.calls;
    expect(calls[0][0].tenant).toBeUndefined();
  });

  it('isFacetTermSelected returns true for selected terms', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    expect(result.current.isFacetTermSelected('content', 'courses')).toBe(true);
    expect(result.current.isFacetTermSelected('content', 'pathways')).toBe(false);
    expect(result.current.isFacetTermSelected('nonexistent', 'foo')).toBeFalsy();
  });

  it('handleSelectFacets adds a term to an existing facet', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    act(() => {
      result.current.handleSelectFacets('language', 'en');
    });
    expect(result.current.selectedFacets.language).toEqual(['en']);
  });

  it('handleSelectFacets removes the term when already selected', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    act(() => {
      result.current.handleSelectFacets('content', 'courses');
    });
    expect(result.current.selectedFacets.content).toEqual([]);
  });

  it('handleSelectFacets("q", term) updates the URL and pushes the new query', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    act(() => {
      result.current.handleSelectFacets('q', 'hello');
    });
    expect(mockPush).toHaveBeenCalled();
    const pushed = mockPush.mock.calls[0][0];
    expect(pushed).toContain('q=');
    expect(result.current.selectedFacets.q).toEqual(['hello']);
  });

  it('handleSelectFacets initializes selectedFacets if it was empty', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    act(() => {
      result.current.setSelectedFacets(null as any);
    });
    act(() => {
      result.current.handleSelectFacets('topics', 'ai');
    });
    expect(result.current.selectedFacets).toEqual({ topics: ['ai'] });
  });

  it('formats facets with terms object', async () => {
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: {
        facets: {
          language: { terms: { en: 5, fr: 0 } },
          level: { introductory: 2, advanced: 0 },
        },
        results: [],
      },
    }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    const language = result.current.facets.find((f) => f.slug === 'language');
    expect(language).toBeDefined();
    expect(language!.terms).toEqual([{ key: 'en', count: 5 }]);
    const level = result.current.facets.find((f) => f.slug === 'level');
    expect(level).toBeDefined();
    expect(level!.terms).toEqual([{ key: 'introductory', count: 2 }]);
  });

  it('omits facets whose terms have all-zero counts', async () => {
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: {
        facets: {
          empty: { terms: { foo: 0 } },
          empty2: { foo: 0 },
        },
        results: [],
      },
    }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    expect(result.current.facets).toEqual([]);
  });

  it('handleToggleFacet flips the expanded flag for a single facet', async () => {
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: {
        facets: { language: { terms: { en: 1 } } },
        results: [],
      },
    }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleToggleFacet('language');
    });
    expect(result.current.facets.find((f) => f.slug === 'language')!.expanded).toBe(true);
  });

  it('handleFilterFacets narrows terms by search input', async () => {
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: {
        facets: { language: { terms: { english: 1, french: 1 } } },
        results: [],
      },
    }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleFilterFacets('language', 'eng');
    });
    const lang = result.current.filteredFacets.find((f) => f.slug === 'language');
    expect(lang!.terms).toEqual([{ key: 'english', count: 1 }]);
  });

  it('handleFilterFacets falls back to all facets when search is empty', async () => {
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: {
        facets: { language: { terms: { english: 1 } } },
        results: [],
      },
    }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleFilterFacets('language', '');
    });
    expect(result.current.filteredFacets).toEqual(result.current.facets);
  });

  it('handleFilterFacets falls back to all facets when no terms match', async () => {
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: {
        facets: { language: { terms: { english: 1 } } },
        results: [],
      },
    }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleFilterFacets('language', 'xx');
    });
    expect(result.current.filteredFacets).toEqual(result.current.facets);
  });

  it('handleFormatContents formats a program', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    const formatted = result.current.handleFormatContents({
      type: 'program',
      data: {
        name: 'My Program',
        program_id: 'pid',
        program_key: 'pkey',
        platform: 'ten',
        data: { card_image: 'https://cdn.example.com/img.png' },
      },
    } as any);
    expect(formatted.title).toBe('My Program');
    expect(formatted.contentType).toBe('program');
    expect(formatted.url).toBe('/programs/pkey?platform=ten');
    expect(formatted.image).toBe('https://cdn.example.com/img.png');
    expect(formatted.id).toBe('pid');
  });

  it('handleFormatContents prepends LMS URL when program image is relative', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    const formatted = result.current.handleFormatContents({
      type: 'program',
      data: { name: 'P', program_id: 'p', program_key: 'pk', data: { card_image: '/i.png' } },
    } as any);
    expect(formatted.image).toBe('https://lms.example.com/i.png');
  });

  it('handleFormatContents falls back to empty image when none provided', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    const formatted = result.current.handleFormatContents({
      type: 'program',
      data: { name: 'P', program_id: 'p', program_key: 'pk', data: {} },
    } as any);
    expect(formatted.image).toBe('');
  });

  it('handleFormatContents formats a pathway', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    const formatted = result.current.handleFormatContents({
      type: 'pathway',
      data: {
        name: 'Path',
        pathway_uuid: 'uuid-1',
        pathway_id: 'pid 1',
        platform: 'ten',
      },
    } as any);
    expect(formatted.contentType).toBe('pathway');
    expect(formatted.url).toContain('/pathways/uuid-1');
    expect(formatted.url).toContain('user_related=false');
    expect(formatted.id).toBe('uuid-1');
  });

  it('handleFormatContents formats a course (default case)', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    const formatted = result.current.handleFormatContents({
      type: 'course',
      data: {
        name: 'Course 1',
        course_id: 'cid',
        edx_data: { course_image_asset_path: '/asset.png' },
      },
    } as any);
    expect(formatted.contentType).toBe('course');
    expect(formatted.url).toBe('/courses/cid');
    expect(formatted.image).toBe('https://lms.example.com/asset.png');
    expect(formatted.id).toBe('cid');
  });

  it('handleFetchData sets contents on success', async () => {
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: { facets: {}, results: [{ type: 'course', data: { course_id: 'c1' } }] },
    }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.contents.length).toBeGreaterThan(0));
    expect(result.current.contents).toHaveLength(1);
  });

  it('handleFetchData clears facets and stops loading when handleSearch throws', async () => {
    mockCatalog.handleSearch = vi.fn(async () => {
      throw new Error('boom');
    });
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    expect(result.current.facets).toEqual([]);
    expect(result.current.filteredFacets).toEqual([]);
    expect(result.current.contentsLoading).toBe(false);
  });

  it('handleFetchData clears facets and stops loading when isError is true', async () => {
    mockCatalog.isError = true;
    mockCatalog.handleSearch = vi.fn(async () => ({ data: { facets: {}, results: [] } }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    expect(result.current.facets).toEqual([]);
  });

  it('handleFormatFacets recovers from an internal failure', async () => {
    // Returning a non-object forces Object.keys to throw inside handleFormatFacets
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: { facets: null, results: [] },
    }));
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    expect(result.current.facets).toEqual([]);
  });

  it('passes selected facet params through to handleSearch', async () => {
    const { result } = renderHook(() => useDiscover({ limit: 5 }));
    await waitFor(() => expect(mockCatalog.handleSearch).toHaveBeenCalled());
    mockCatalog.handleSearch = vi.fn(async () => ({
      data: { facets: {}, results: [] },
    }));
    act(() => {
      result.current.setSelectedFacets({
        q: ['hello'],
        content: ['courses'],
        language: ['en'],
        level: ['intro'],
        provider: ['mit'],
        topics: ['ai'],
        tags: ['t'],
        promotion: ['p'],
        'course duration': ['short'],
        certificate: ['yes'],
        price: ['free', 'paid'],
        subject: ['cs'],
        skills: ['react'],
      } as any);
      result.current.setPage(2);
    });
    await waitFor(() => expect(mockCatalog.handleSearch).toHaveBeenCalled());
    const [args] = mockCatalog.handleSearch.mock.calls.at(-1)!;
    expect(args).toMatchObject({
      query: 'hello',
      content: ['courses'],
      language: ['en'],
      level: ['intro'],
      provider: ['mit'],
      topics: ['ai'],
      tags: ['t'],
      promotion: ['p'],
      duration: ['short'],
      certificate: ['yes'],
      price: 'paid',
      subject: ['cs'],
      skills: ['react'],
      limit: 5,
      offset: 5,
    });
  });
});
