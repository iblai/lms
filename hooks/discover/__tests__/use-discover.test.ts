import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
  isRecommendedTabHidden: vi.fn(() => false),
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

// The declarative catalog query — the mock resolves synchronously from the
// configured payloads, keyed on whether the subscription asks for facets
// (`returnFacet`) or contents. Every subscription's params are recorded so
// tests can assert what the search would be fetched with.
const mockCatalogQuery = vi.hoisted(() => ({
  facetsData: { facets: {} } as any,
  contentsData: { results: [] } as any,
  isError: false,
  calls: [] as { params: any; skip: boolean }[],
}));
vi.mock('@/hooks/search/use-personnalized-catalog', () => ({
  usePersonnalizedCatalogQuery: vi.fn(({ params, skip }: any) => {
    mockCatalogQuery.calls.push({ params, skip: !!skip });
    const isFacetsQuery = !!params?.returnFacet;
    const data = mockCatalogQuery.isError
      ? undefined
      : isFacetsQuery
        ? mockCatalogQuery.facetsData
        : mockCatalogQuery.contentsData;
    return {
      data,
      isLoading: !data && !mockCatalogQuery.isError,
      isFetching: false,
      isError: mockCatalogQuery.isError,
      pagination: data
        ? {
            count: data.count || 0,
            current_page: data.current_page || 0,
            total_pages: data.total_pages || 0,
          }
        : null,
    };
  }),
}));

const facetCalls = () => mockCatalogQuery.calls.filter((call) => call.params?.returnFacet);
const contentCalls = () => mockCatalogQuery.calls.filter((call) => !call.params?.returnFacet);

const mockTenantMetadata = vi.hoisted(() => ({
  metadata: { skills_include_community_courses: false } as any,
  isLoading: false,
}));
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => mockTenantMetadata),
  isLoggedIn: vi.fn(() => true),
}));

// use-debounce — pass values through synchronously so effects can be
// observed in tests
vi.mock('use-debounce', () => ({
  useDebounce: (value: any) => [value],
}));

const mockEnrollments = vi.hoisted(() => ({
  enrolledIds: new Set<string>(),
  enrolledCards: { courses: [] as any[], programs: [] as any[], pathways: [] as any[] },
  enrolledTotal: 0,
  enrollmentsLoading: false,
}));
vi.mock('../use-user-enrollments', () => ({
  useUserEnrollments: vi.fn(() => mockEnrollments),
}));

const mockRecommendations = vi.hoisted(() => ({
  recommendedCourses: [] as any[],
  allRecommendedCourses: [] as any[],
  isLoading: false,
  isError: undefined,
}));
vi.mock('../../courses/use-recommended-courses', () => ({
  useRecommendedCourses: vi.fn(() => mockRecommendations),
}));

import { useDiscover } from '../use-discover';

// The one synthetic Access facet carries both user-scoped terms.
const ACCESS_FACET = {
  slug: 'enrollment',
  label: 'Access',
  expanded: true,
  terms: [
    { key: 'Enrolled', count: 0 },
    { key: 'Recommended', count: 0 },
  ],
};

describe('useDiscover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCatalogQuery.facetsData = { facets: {} };
    mockCatalogQuery.contentsData = { results: [] };
    mockCatalogQuery.isError = false;
    mockCatalogQuery.calls = [];
    mockTenantMetadata.metadata = { skills_include_community_courses: false };
    mockTenantMetadata.isLoading = false;
    mockEnrollments.enrolledIds = new Set<string>();
    mockEnrollments.enrolledCards = { courses: [], programs: [], pathways: [] };
    mockEnrollments.enrolledTotal = 0;
    mockEnrollments.enrollmentsLoading = false;
    mockRecommendations.recommendedCourses = [];
    mockRecommendations.isLoading = false;
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
    await waitFor(() => {
      expect(result.current.facets).toEqual([ACCESS_FACET]);
    });
    expect(result.current.filteredFacets).toEqual([ACCESS_FACET]);
    expect(result.current.selectedFacets).toEqual({ content: ['courses'] });
  });

  it('subscribes to the facet search with returnFacet=true', async () => {
    renderHook(() => useDiscover({}));
    await waitFor(() => {
      expect(facetCalls().length).toBeGreaterThan(0);
    });
    expect(facetCalls()[0].params).toMatchObject({
      username: 'test-user',
      returnFacet: true,
      tenant: 'test-tenant',
    });
  });

  it('omits tenant when skills_include_community_courses is true', async () => {
    mockTenantMetadata.metadata = { skills_include_community_courses: true };
    renderHook(() => useDiscover({}));
    await waitFor(() => {
      expect(facetCalls().length).toBeGreaterThan(0);
    });
    expect(facetCalls().at(-1)?.params.tenant).toBeUndefined();
    expect(contentCalls().at(-1)?.params.tenant).toBeUndefined();
  });

  it('skips the search subscriptions until tenant metadata resolves', async () => {
    mockTenantMetadata.isLoading = true;
    renderHook(() => useDiscover({}));
    await waitFor(() => {
      expect(mockCatalogQuery.calls.length).toBeGreaterThan(0);
    });
    expect(mockCatalogQuery.calls.every((call) => call.skip)).toBe(true);
  });

  it('subscribes immediately when metadata is ready', () => {
    renderHook(() => useDiscover({}));
    expect(mockCatalogQuery.calls.length).toBeGreaterThan(0);
    expect(mockCatalogQuery.calls[0].skip).toBe(false);
  });

  it('seeds the very first search subscription from initialFacets', () => {
    renderHook(() =>
      useDiscover({
        initialFacets: { q: ['machine'], content: ['programs'], enrollment: ['Enrolled'] },
      }),
    );
    // The deep-linked filters are already on the first content subscription
    // — no throwaway default-args request.
    expect(contentCalls()[0].params).toMatchObject({
      query: 'machine',
      content: ['programs'],
    });
    // The synthetic Access facet stays client-side only.
    expect(contentCalls()[0].params.enrollment).toBeUndefined();
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

  it('refetches with the facet as a search param when a facet is selected (subject)', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    act(() => {
      result.current.handleSelectFacets('subject', 'business');
    });
    await waitFor(() => {
      expect(contentCalls().at(-1)?.params).toMatchObject({ subject: ['business'] });
    });
  });

  it('maps the format facet to the selfPaced search param', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    act(() => {
      result.current.handleSelectFacets('format', 'instructor-led');
    });
    await waitFor(() => {
      expect(contentCalls().at(-1)?.params).toMatchObject({ selfPaced: ['instructor-led'] });
    });
  });

  it('refetches without the facet param when a facet term is deselected', async () => {
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facetsLoading).toBe(false));
    act(() => {
      result.current.handleSelectFacets('certificate', 'verified');
    });
    await waitFor(() => {
      expect(contentCalls().at(-1)?.params).toMatchObject({ certificate: ['verified'] });
    });
    act(() => {
      result.current.handleSelectFacets('certificate', 'verified');
    });
    await waitFor(() => {
      expect(contentCalls().at(-1)?.params.certificate).toBeUndefined();
    });
  });

  it('hides the "other" term from the Subject facet', async () => {
    mockCatalogQuery.facetsData = {
      facets: {
        subject: { terms: { business: 3, other: 5 } },
        certificate: { terms: { other: 2 } },
      },
    };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    const subject = result.current.facets.find((facet) => facet.slug === 'subject');
    expect(subject?.terms.map((term) => term.key)).toEqual(['business']);
    // Only the Subject facet hides "other" — other facets keep the term.
    const certificate = result.current.facets.find((facet) => facet.slug === 'certificate');
    expect(certificate?.terms.map((term) => term.key)).toEqual(['other']);
  });

  it('drops the Subject facet entirely when "other" is its only term', async () => {
    mockCatalogQuery.facetsData = { facets: { subject: { terms: { other: 5 } } } };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    expect(result.current.facets.find((facet) => facet.slug === 'subject')).toBeUndefined();
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
    mockCatalogQuery.facetsData = {
      facets: {
        language: { terms: { en: 5, fr: 0 } },
        level: { introductory: 2, advanced: 0 },
      },
    };
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
    mockCatalogQuery.facetsData = {
      facets: {
        empty: { terms: { foo: 0 } },
        empty2: { foo: 0 },
      },
    };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    expect(result.current.facets).toEqual([ACCESS_FACET]);
  });

  it('handleToggleFacet flips the expanded flag for a single facet', async () => {
    mockCatalogQuery.facetsData = { facets: { language: { terms: { en: 1 } } } };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleToggleFacet('language');
    });
    expect(result.current.facets.find((f) => f.slug === 'language')!.expanded).toBe(true);
  });

  it('handleFilterFacets narrows terms by search input', async () => {
    mockCatalogQuery.facetsData = { facets: { language: { terms: { english: 1, french: 1 } } } };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleFilterFacets('language', 'eng');
    });
    const lang = result.current.filteredFacets.find((f) => f.slug === 'language');
    expect(lang!.terms).toEqual([{ key: 'english', count: 1 }]);
  });

  it('handleFilterFacets restores the full term list when the search is cleared', async () => {
    mockCatalogQuery.facetsData = { facets: { language: { terms: { english: 1, french: 1 } } } };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleFilterFacets('language', 'eng');
    });
    act(() => {
      result.current.handleFilterFacets('language', '');
    });
    expect(result.current.filteredFacets).toEqual(result.current.facets);
  });

  it('handleFilterFacets shows an empty term list when nothing matches', async () => {
    mockCatalogQuery.facetsData = { facets: { language: { terms: { english: 1 } } } };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleFilterFacets('language', 'xx');
    });
    const lang = result.current.filteredFacets.find((f) => f.slug === 'language');
    expect(lang!.terms).toEqual([]);
  });

  it('filtering one facet leaves the other facets untouched', async () => {
    mockCatalogQuery.facetsData = {
      facets: {
        language: { terms: { english: 1, french: 1 } },
        subject: { terms: { business: 2, science: 3 } },
      },
    };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleFilterFacets('language', 'eng');
    });
    const subject = result.current.filteredFacets.find((f) => f.slug === 'subject');
    expect(subject!.terms.map((t) => t.key)).toEqual(['business', 'science']);
  });

  it('expanding a facet keeps another facet’s term filter intact', async () => {
    mockCatalogQuery.facetsData = {
      facets: {
        language: { terms: { english: 1, french: 1 } },
        subject: { terms: { business: 2 } },
      },
    };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    act(() => {
      result.current.handleFilterFacets('language', 'eng');
    });
    act(() => {
      result.current.handleToggleFacet('subject');
    });
    const lang = result.current.filteredFacets.find((f) => f.slug === 'language');
    expect(lang!.terms).toEqual([{ key: 'english', count: 1 }]);
    expect(result.current.filteredFacets.find((f) => f.slug === 'subject')!.expanded).toBe(true);
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

  it('exposes the search results as contents', async () => {
    mockCatalogQuery.contentsData = {
      results: [{ type: 'course', data: { course_id: 'c1' } }],
    };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.contents.length).toBeGreaterThan(0));
    expect(result.current.contents).toHaveLength(1);
  });

  it('exposes pagination from the search payload', async () => {
    mockCatalogQuery.contentsData = { results: [], count: 25, current_page: 2, total_pages: 3 };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => {
      expect(result.current.pagination).toEqual({ count: 25, current_page: 2, total_pages: 3 });
    });
  });

  it('clears facets and stops loading when the search errors', async () => {
    mockCatalogQuery.isError = true;
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.facets).toEqual([]);
    expect(result.current.filteredFacets).toEqual([]);
    expect(result.current.facetsLoading).toBe(false);
    expect(result.current.contentsLoading).toBe(false);
  });

  it('handleFormatFacets recovers from an internal failure', async () => {
    // A non-object facets payload forces Object.keys to throw inside
    // handleFormatFacets
    mockCatalogQuery.facetsData = { facets: null };
    const { result } = renderHook(() => useDiscover({}));
    await waitFor(() => expect(result.current.facets.length).toBeGreaterThan(0));
    expect(result.current.facets).toEqual([ACCESS_FACET]);
  });

  it('passes selected facet params through to the search subscription', async () => {
    const { result } = renderHook(() => useDiscover({ limit: 5 }));
    await waitFor(() => expect(contentCalls().length).toBeGreaterThan(0));
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
    await waitFor(() => {
      expect(contentCalls().at(-1)?.params).toMatchObject({
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

  describe('displayCards (Enrolled / Recommended modes)', () => {
    const enrolledCourseCard = {
      title: 'Alpha Course',
      contentType: 'course',
      url: '/courses/c1',
      image: '',
      id: 'c1',
      enrolled: true,
    };
    const enrolledProgramCard = {
      title: 'Prog',
      contentType: 'program',
      url: '/programs/pk1',
      image: '',
      id: 'p1',
      enrolled: true,
    };
    const recommendedCourse = {
      type: 'course',
      data: { name: 'Rec Course', course_id: 'r1', edx_data: { course_image_asset_path: '' } },
    };

    it('lists enrolled cards when the Enrolled filter is active, flagging recommended ones', async () => {
      mockEnrollments.enrolledCards = {
        courses: [enrolledCourseCard],
        programs: [enrolledProgramCard],
        pathways: [],
      };
      mockEnrollments.enrolledTotal = 2;
      mockRecommendations.recommendedCourses = [
        { type: 'course', data: { name: 'Alpha Course', course_id: 'c1' } },
        { type: 'course', data: { name: 'No id' } },
      ];
      const { result } = renderHook(() => useDiscover({}));
      await waitFor(() => expect(result.current.facetsLoading).toBe(false));
      act(() => {
        result.current.handleSelectFacets('enrollment', 'Enrolled');
      });
      expect(result.current.enrolledOnly).toBe(true);
      // Default content filter is ["courses"], so only enrolled courses show.
      expect(result.current.displayCards).toEqual([{ ...enrolledCourseCard, recommended: true }]);
    });

    it('falls back to every content type when the content filter is empty', async () => {
      mockEnrollments.enrolledCards = {
        courses: [enrolledCourseCard],
        programs: [enrolledProgramCard],
        pathways: [],
      };
      mockEnrollments.enrolledTotal = 2;
      const { result } = renderHook(() => useDiscover({}));
      await waitFor(() => expect(result.current.facetsLoading).toBe(false));
      act(() => {
        result.current.setSelectedFacets({ content: [], enrollment: ['Enrolled'] });
      });
      expect(result.current.displayCards.map((card) => card.id)).toEqual(['c1', 'p1']);
    });

    it('lists recommended courses when the Recommended filter is active', async () => {
      mockRecommendations.recommendedCourses = [recommendedCourse];
      const { result } = renderHook(() => useDiscover({}));
      await waitFor(() => expect(result.current.facetsLoading).toBe(false));
      act(() => {
        result.current.handleSelectFacets('enrollment', 'Recommended');
      });
      expect(result.current.recommendedOnly).toBe(true);
      expect(result.current.displayCards).toHaveLength(1);
      expect(result.current.displayCards[0]).toMatchObject({
        id: 'r1',
        title: 'Rec Course',
        contentType: 'course',
        recommended: true,
      });
    });

    it('omits recommendations when the content filter excludes courses', async () => {
      mockEnrollments.enrolledCards = {
        courses: [],
        programs: [enrolledProgramCard],
        pathways: [],
      };
      mockRecommendations.recommendedCourses = [recommendedCourse];
      const { result } = renderHook(() => useDiscover({}));
      await waitFor(() => expect(result.current.facetsLoading).toBe(false));
      act(() => {
        result.current.setSelectedFacets({
          content: ['programs'],
          enrollment: ['Enrolled', 'Recommended'],
        });
      });
      expect(result.current.displayCards.map((card) => card.id)).toEqual(['p1']);
    });

    it('deduplicates the Enrolled + Recommended union and drops keyless cards', async () => {
      mockEnrollments.enrolledCards = {
        courses: [
          enrolledCourseCard,
          // No id and no title — unkeyable, must be skipped.
          { title: '', contentType: 'course', url: '', image: '', id: '', enrolled: true },
        ],
        programs: [],
        pathways: [],
      };
      mockRecommendations.recommendedCourses = [
        // Same id as the enrolled course — deduped.
        { type: 'course', data: { name: 'Alpha Course', course_id: 'c1' } },
        recommendedCourse,
      ];
      const { result } = renderHook(() => useDiscover({}));
      await waitFor(() => expect(result.current.facetsLoading).toBe(false));
      act(() => {
        result.current.setSelectedFacets({
          content: ['courses'],
          enrollment: ['Enrolled', 'Recommended'],
        });
      });
      expect(result.current.displayCards.map((card) => card.id)).toEqual(['c1', 'r1']);
    });

    it('narrows the enrolled view by the search query, client-side', async () => {
      mockEnrollments.enrolledCards = {
        courses: [enrolledCourseCard, { ...enrolledCourseCard, id: 'c2', title: 'Beta Course' }],
        programs: [],
        pathways: [],
      };
      const { result } = renderHook(() => useDiscover({}));
      await waitFor(() => expect(result.current.facetsLoading).toBe(false));
      act(() => {
        result.current.setSelectedFacets({
          content: ['courses'],
          enrollment: ['Enrolled'],
          q: ['beta'],
        });
      });
      expect(result.current.displayCards.map((card) => card.id)).toEqual(['c2']);
    });
  });
});
