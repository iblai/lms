import { getUserName, isRecommendedTabHidden } from '@/utils/helpers';
import { usePersonnalizedCatalogQuery } from '../search/use-personnalized-catalog';
import { useRecommendedCourses } from '../courses/use-recommended-courses';
import { useEffect, useMemo, useState } from 'react';
import { Course, CourseFacet } from '@/types/courses';
import _ from 'lodash';
import { useDebounce } from 'use-debounce';
import { config } from '@/lib/config';
import { DiscoverContent } from '@/types/discover';
import { DiscoverContentCardProps } from '@/types/discover';
import { useRouter } from 'next/navigation';
import { isLoggedIn, useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '../use-tenant-param';
import { useUserEnrollments, EnrolledContentType } from './use-user-enrollments';

/**
 * Synthetic "Access" facet: narrows the catalog down to the user's
 * enrollments and/or their recommended courses. Both terms live under
 * the one `enrollment` slug.
 */
export const ENROLLMENT_FACET_SLUG = 'enrollment';
export const ENROLLMENT_FACET_TERM = 'Enrolled';
export const RECOMMENDED_FACET_TERM = 'Recommended';

/** How many recommendations to pull for the catalog view (the AI-search
 * recommendations endpoint caps `limit` at 20). */
const RECOMMENDATIONS_LIMIT = 20;

export const useDiscover = ({
  limit = 12,
  initialFacets,
}: {
  limit?: number;
  /**
   * Deep-linked facets (q / content / enrollment) known at mount time.
   * Seeding them here — instead of only via an effect after mount — lets
   * the very first search subscription use the right params, so no
   * throwaway default-args request fires first.
   */
  initialFacets?: Record<string, string[]>;
}) => {
  const router = useRouter();
  const tenant = useTenantParam();
  const isUserLoggedIn = isLoggedIn();
  const { metadata, isLoading: metadataLoading } = useTenantMetadata({
    org: tenant,
  });
  const { enrolledIds, enrolledCards, enrolledTotal, enrollmentsLoading } = useUserEnrollments({
    tenant,
  });
  const recommendationsEnabled = isUserLoggedIn && !isRecommendedTabHidden();
  const { recommendedCourses, isLoading: recommendationsLoading } = useRecommendedCourses({
    limit: RECOMMENDATIONS_LIMIT,
    forceLimit: true,
    tenant,
  });
  const recommendedIds = useMemo(
    () =>
      new Set(
        recommendedCourses.map((course) => course.data?.course_id).filter(Boolean) as string[],
      ),
    [recommendedCourses],
  );

  const [facets, setFacets] = useState<CourseFacet[]>([]);
  const [filteredFacets, setFilteredFacets] = useState<CourseFacet[]>([]);

  const [page, setPage] = useState<number>(1);

  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>(() => ({
    content: ['courses'],
    ...initialFacets,
  }));

  //const [facetQuery, setContentQuery] = useState<string>("")

  const isFacetTermSelected = (facetSlug: string, term: string) => {
    return selectedFacets?.[facetSlug]?.includes(term);
  };

  /** "Enrolled" filter active — the catalog lists the user's enrollments. */
  const enrolledOnly = !!selectedFacets?.[ENROLLMENT_FACET_SLUG]?.includes(ENROLLMENT_FACET_TERM);
  /** "Recommended" filter active — the catalog lists recommended courses. */
  const recommendedOnly =
    recommendationsEnabled &&
    !!selectedFacets?.[ENROLLMENT_FACET_SLUG]?.includes(RECOMMENDED_FACET_TERM);

  const buildAccessFacet = (enrolledCount: number, recommendedCount: number): CourseFacet => ({
    slug: ENROLLMENT_FACET_SLUG,
    label: 'Access',
    expanded: true,
    terms: [
      { key: ENROLLMENT_FACET_TERM, count: enrolledCount },
      ...(recommendationsEnabled ? [{ key: RECOMMENDED_FACET_TERM, count: recommendedCount }] : []),
    ],
  });

  const handleSelectFacets = (facetSlug: string, term: string) => {
    if (facetSlug === 'q') {
      const url = new URL(window.location.href);
      url.searchParams.set('q', '');
      router.push(url.pathname + url.search);
    }
    setSelectedFacets((prevSelectedFacets) => {
      if (prevSelectedFacets) {
        return {
          ...prevSelectedFacets,
          [facetSlug]: !(prevSelectedFacets[facetSlug] || []).includes(term)
            ? [...(prevSelectedFacets[facetSlug] || []), term]
            : (prevSelectedFacets[facetSlug] || []).filter(
                (containedTerm) => containedTerm !== term,
              ),
        };
      } else {
        return {
          [facetSlug]: [term],
        };
      }
    });
    setPage(1);
  };

  // Every selected facet except the synthetic client-side ones (Enrolled /
  // Recommended) is a server-side search parameter — a change to any of
  // them (subject, format, certificate, level, …) produces new search args
  // and therefore a refetch, not just the query and content type.
  const searchFacetsKey = JSON.stringify(
    Object.fromEntries(
      Object.entries(selectedFacets ?? {}).filter(([slug]) => slug !== ENROLLMENT_FACET_SLUG),
    ),
  );

  const contentSearchParams = useMemo(
    () => ({
      username: getUserName(),
      limit,
      offset: (page - 1) * limit,
      ...(!metadata?.skills_include_community_courses && { tenant: tenant }),
      ...(!_.isEmpty(selectedFacets?.q) && {
        query: selectedFacets?.q[0],
      }),
      ...(!_.isEmpty(selectedFacets?.content) && {
        content: selectedFacets?.content,
      }),
      ...(!_.isEmpty(selectedFacets?.language) && {
        language: selectedFacets?.language,
      }),
      ...(!_.isEmpty(selectedFacets?.level) && {
        level: selectedFacets?.level,
      }),
      ...(!_.isEmpty(selectedFacets?.provider) && {
        provider: selectedFacets?.provider,
      }),
      ...(!_.isEmpty(selectedFacets?.topics) && {
        topics: selectedFacets?.topics,
      }),
      ...(!_.isEmpty(selectedFacets?.tags) && {
        tags: selectedFacets?.tags,
      }),
      ...(!_.isEmpty(selectedFacets?.promotion) && {
        promotion: selectedFacets?.promotion,
      }),
      ...(!_.isEmpty(selectedFacets?.['course duration']) && {
        duration: selectedFacets?.['course duration'],
      }),
      ...(!_.isEmpty(selectedFacets?.certificate) && {
        certificate: selectedFacets?.certificate,
      }),
      // The "Format" facet (self-paced / instructor-led) maps to the
      // endpoint's `self_paced` parameter.
      ...(!_.isEmpty(selectedFacets?.format) && {
        selfPaced: selectedFacets?.format,
      }),
      ...(!_.isEmpty(selectedFacets?.price) && {
        price: selectedFacets?.price.at(-1),
      }),
      ...(!_.isEmpty(selectedFacets?.subject) && {
        subject: selectedFacets?.subject,
      }),
      ...(!_.isEmpty(selectedFacets?.skills) && {
        skills: selectedFacets?.skills,
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchFacetsKey, page, limit, metadata?.skills_include_community_courses, tenant],
  );

  // Soften rapid facet toggling like the old imperative debounce did; the
  // first value is emitted immediately, so the initial load is not delayed.
  const [debouncedContentSearchParams] = useDebounce(contentSearchParams, 500, {
    equalityFn: _.isEqual,
  });

  const facetSearchParams = useMemo(
    () => ({
      username: getUserName(),
      returnFacet: true,
      ...(!metadata?.skills_include_community_courses && { tenant: tenant }),
    }),
    [metadata?.skills_include_community_courses, tenant],
  );

  // Wait for tenant metadata before subscribing: it decides whether the
  // search is tenant-scoped, and fetching earlier would fire a throwaway
  // request under the wrong cache key.
  const searchesSkipped = metadataLoading;
  const contentsQuery = usePersonnalizedCatalogQuery({
    params: debouncedContentSearchParams,
    isLoggedIn: isUserLoggedIn,
    skip: searchesSkipped,
  });
  const facetsQuery = usePersonnalizedCatalogQuery({
    params: facetSearchParams,
    isLoggedIn: isUserLoggedIn,
    skip: searchesSkipped,
  });

  const contents: DiscoverContent[] = contentsQuery.data?.results ?? [];
  /** True only while there is nothing to render yet — cached payloads
   * display instantly and background refreshes never re-trigger it. */
  const contentsLoading = contentsQuery.isLoading;
  const facetsLoading = facetsQuery.isLoading;
  const isError = contentsQuery.isError || facetsQuery.isError;
  const pagination = contentsQuery.pagination;

  const handleToggleFacet = (slug: string) => {
    // Toggle each list in place so expanding one facet doesn't clobber
    // another facet's client-side term filter.
    const toggle = (list: CourseFacet[]) =>
      list.map((facet) => (facet.slug === slug ? { ...facet, expanded: !facet.expanded } : facet));
    setFacets(toggle);
    setFilteredFacets(toggle);
  };

  const handleFormatFacets = (allFacets: Record<string, any>) => {
    try {
      let formattedFacets: CourseFacet[] = [];
      Object.keys(allFacets).forEach((key) => {
        if (!_.isEmpty(allFacets[key]?.terms)) {
          const terms = Object.keys(allFacets[key]?.terms || {})
            .filter((innerTerm) => allFacets[key]?.terms[innerTerm] > 0)
            .map((innerTerm) => {
              return {
                key: innerTerm,
                count: allFacets[key]?.terms[innerTerm] || 0,
              };
            });

          if (terms.length > 0) {
            formattedFacets.push({
              slug: key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              expanded: false,
              terms,
            });
          }
        } else {
          const terms = Object.keys(allFacets[key])
            .filter((term) => allFacets[key][term] > 0)
            .map((term) => {
              return {
                key: term,
                count: allFacets[key][term] || 0,
              };
            });

          if (terms.length > 0) {
            formattedFacets.push({
              slug: key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              terms,
              expanded: false,
            });
          }
        }
      });
      // The catalog lumps unclassified content under a generic "other"
      // subject — always hide that term from the Subject filter (and the
      // whole facet if nothing else remains).
      return formattedFacets
        .map((facet) =>
          facet.slug === 'subject'
            ? {
                ...facet,
                terms: facet.terms.filter((term) => String(term.key).toLowerCase() !== 'other'),
              }
            : facet,
        )
        .filter((facet) => facet.terms.length > 0);
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  // Format the facet payload whenever a fresh one lands. The synthetic
  // Access facet (Enrolled / Recommended) leads the list — logged-in users
  // can narrow the catalog down to their own enrollments or their
  // recommendations.
  useEffect(() => {
    if (facetsQuery.isError) {
      setFacets([]);
      setFilteredFacets([]);
      return;
    }
    if (!facetsQuery.data) return;
    const allFacets = facetsQuery.data.facets;
    const formattedFacets = isUserLoggedIn
      ? [
          buildAccessFacet(enrolledTotal, recommendedCourses.length),
          ...handleFormatFacets(allFacets),
        ]
      : handleFormatFacets(allFacets);
    setFacets(formattedFacets);
    setFilteredFacets(formattedFacets);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facetsQuery.data, facetsQuery.isError, isUserLoggedIn]);

  // Keep the synthetic facet's counts in sync — both when the user data
  // lands and when the facet fetch itself completes (whichever finishes
  // last).
  useEffect(() => {
    const syncCount = (list: CourseFacet[]) =>
      list.map((facet) =>
        facet.slug === ENROLLMENT_FACET_SLUG
          ? buildAccessFacet(enrolledTotal, recommendedCourses.length)
          : facet,
      );
    setFacets(syncCount);
    setFilteredFacets(syncCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrolledTotal, recommendedCourses.length, facetsLoading]);

  const handleFormatContents = ({ type, data }: DiscoverContent): DiscoverContentCardProps => {
    switch (type) {
      case 'program':
        return {
          ...data,
          title: data?.name,
          contentType: type,
          url: `/programs/${data?.program_key}?platform=${data?.platform}`,
          image: data?.data?.card_image
            ? String(data?.data?.card_image).startsWith('http')
              ? data?.data?.card_image
              : config.urls.lms() + data?.data?.card_image
            : '',
          id: data?.program_id,
          enrolled: enrolledIds.has(data?.program_id) || enrolledIds.has(data?.program_key),
        };
      case 'pathway':
        return {
          ...data,
          title: data?.name,
          contentType: type,
          url: `/pathways/${data?.pathway_uuid}?platform=${encodeURI(
            data?.platform,
          )}&user_related=false&pathway_id=${encodeURIComponent(data?.pathway_id)}`,
          image: '',
          id: data?.pathway_uuid,
          enrolled: enrolledIds.has(data?.pathway_uuid) || enrolledIds.has(data?.pathway_id),
        };
      //case "course":
      default:
        const course = data as Course;
        return {
          ...data,
          title: course?.name,
          contentType: type,
          url: `/courses/${course?.course_id}`,
          image: `${config.urls.lms()}${course?.edx_data?.course_image_asset_path}`,
          id: course?.course_id,
          enrolled: enrolledIds.has(course?.course_id),
          recommended: recommendedIds.has(course?.course_id),
        };
      /* case "article":
        return contents.map((content) => {
          return {
            ...content,
          };
        }); */
    }
  };

  /**
   * The cards to render for the current mode:
   *  - "Enrolled" / "Recommended" filters active → the union of the user's
   *    enrollments and their recommended courses (narrowed by the selected
   *    content types and the search query, all client-side);
   *  - otherwise → the personalized catalog search results, each flagged
   *    `enrolled` / `recommended` when applicable.
   */
  const displayCards = useMemo<DiscoverContentCardProps[]>(() => {
    if (enrolledOnly || recommendedOnly) {
      const selectedTypes = (
        !_.isEmpty(selectedFacets?.content)
          ? selectedFacets.content
          : ['courses', 'programs', 'pathways']
      ).filter((type): type is EnrolledContentType => type in enrolledCards);
      const query = (selectedFacets?.q?.[0] ?? '').toLowerCase();

      const cards: DiscoverContentCardProps[] = [];
      const seen = new Set<string>();
      const pushCard = (card: DiscoverContentCardProps) => {
        const key = card.id || card.title;
        if (!key || seen.has(key)) return;
        seen.add(key);
        cards.push(card);
      };

      if (enrolledOnly) {
        selectedTypes
          .flatMap((type) => enrolledCards[type])
          .forEach((card) => pushCard({ ...card, recommended: recommendedIds.has(card.id) }));
      }
      // Recommendations are courses — they only contribute when the
      // content filter includes courses (or no content filter is set).
      if (recommendedOnly && selectedTypes.includes('courses')) {
        recommendedCourses.map(handleFormatContents).forEach(pushCard);
      }
      return cards.filter((card) => !query || card.title.toLowerCase().includes(query));
    }
    return (contents ?? []).map(handleFormatContents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enrolledOnly,
    recommendedOnly,
    selectedFacets,
    enrolledCards,
    contents,
    enrolledIds,
    recommendedIds,
    recommendedCourses,
  ]);

  /**
   * Client-side search within one facet's term list. Only the targeted
   * facet is touched (other facets keep their own filters); clearing the
   * search restores the facet's full term list, and no matches means an
   * empty list — not a reset.
   */
  const handleFilterFacets = (facetSlug: string, searchTerm: string) => {
    const allTerms = facets.find((facet) => facet.slug === facetSlug)?.terms ?? [];
    const matchingTerms = !searchTerm
      ? allTerms
      : allTerms.filter((term) =>
          String(term.key).toLowerCase().includes(String(searchTerm).toLowerCase()),
        );
    setFilteredFacets((previous) =>
      previous.map((facet) =>
        facet.slug === facetSlug ? { ...facet, terms: matchingTerms } : facet,
      ),
    );
  };

  return {
    contents,
    facets,
    filteredFacets,
    contentsLoading,
    facetsLoading,
    isError,
    handleToggleFacet,
    handleSelectFacets,
    selectedFacets,
    isFacetTermSelected,
    handleFormatContents,
    pagination,
    page,
    setPage,
    handleFilterFacets,
    setSelectedFacets,
    displayCards,
    enrolledOnly,
    enrollmentsLoading,
    recommendedOnly,
    recommendationsLoading,
  };
};
