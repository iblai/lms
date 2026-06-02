import { getUserName } from '@/utils/helpers';
import { usePersonnalizedCatalog } from '../search/use-personnalized-catalog';
import { useEffect, useState } from 'react';
import { Course, CourseFacet } from '@/types/courses';
import _ from 'lodash';
import { useDebouncedCallback } from 'use-debounce';
import { config } from '@/lib/config';
import { DiscoverContent } from '@/types/discover';
import { DiscoverContentCardProps } from '@/types/discover';
import { useRouter } from 'next/navigation';
import { isLoggedIn, useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useTenantParam } from '../use-tenant-param';
export const useDiscover = ({ limit = 12 }: { limit?: number }) => {
  const router = useRouter();
  const tenant = useTenantParam();
  const isUserLoggedIn = isLoggedIn();
  const { metadata } = useTenantMetadata({
    org: tenant,
  });
  const { handleSearch, isError, pagination } = usePersonnalizedCatalog({
    isLoggedIn: isUserLoggedIn,
  });

  const [facets, setFacets] = useState<CourseFacet[]>([]);
  const [filteredFacets, setFilteredFacets] = useState<CourseFacet[]>([]);

  const [contents, setContents] = useState<DiscoverContent[]>([]);

  const [page, setPage] = useState<number>(1);

  const [facetsLoading, setFacetsLoading] = useState<boolean>(false);
  const [contentsLoading, setContentsLoading] = useState<boolean>(false);

  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({
    content: ['courses'],
  });

  //const [facetQuery, setContentQuery] = useState<string>("")

  const isFacetTermSelected = (facetSlug: string, term: string) => {
    return selectedFacets?.[facetSlug]?.includes(term);
  };

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

  const handleFetchData = async (onlyFacets = false) => {
    if (onlyFacets) {
      setFacetsLoading(true);
    } else {
      setContentsLoading(true);
    }
    try {
      const response = await (onlyFacets
        ? handleSearch({
            username: getUserName(),
            returnFacet: true,
            ...(!metadata?.skills_include_community_courses && { tenant: tenant }),
          })
        : handleSearch({
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
            ...(!_.isEmpty(selectedFacets?.price) && {
              price: selectedFacets?.price.at(-1),
            }),
            ...(!_.isEmpty(selectedFacets?.subject) && {
              subject: selectedFacets?.subject,
            }),
            ...(!_.isEmpty(selectedFacets?.skills) && {
              skills: selectedFacets?.skills,
            }),
          }));
      if (isError) {
        throw new Error('Error fetching data');
      }
      const allFacets = response?.data?.facets;
      if (onlyFacets) {
        setFacets(handleFormatFacets(allFacets));
        setFilteredFacets(handleFormatFacets(allFacets));
        setFacetsLoading(false);
      } else {
        setContents(response?.data?.results);
        setContentsLoading(false);
      }
    } catch (error) {
      console.log(error);
      setFacets([]);
      setFilteredFacets([]);
      setFacetsLoading(false);
      setContentsLoading(false);
    }
  };

  const handleToggleFacet = (slug: string) => {
    const updatedFacets = facets.map((facet) =>
      facet.slug === slug ? { ...facet, expanded: !facet.expanded } : facet,
    );
    setFacets(updatedFacets);
    setFilteredFacets(updatedFacets);
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
      return formattedFacets;
    } catch (error) {
      console.log(error);
      return [];
    }
  };

  const handleFetchSearchContents = useDebouncedCallback(() => {
    handleFetchData();
  }, 500);

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
        };
      /* case "article":
        return contents.map((content) => {
          return {
            ...content,
          };
        }); */
    }
  };

  const handleFilterFacets = (facetSlug: string, searchTerm: string) => {
    try {
      if (!searchTerm) {
        throw new Error();
      }
      const targetedFacet = facets.find((facet) => facet.slug === facetSlug);
      const matchingTermsFilters = targetedFacet?.terms.filter((term) =>
        String(term.key).toLowerCase().includes(String(searchTerm).toLowerCase()),
      );
      if (!matchingTermsFilters || matchingTermsFilters?.length === 0) {
        throw new Error();
      }
      setFilteredFacets(
        facets.map((facet) => {
          if (facet.slug === facetSlug) {
            return { ...facet, terms: [...matchingTermsFilters] };
          }
          return facet;
        }),
      );
    } catch {
      setFilteredFacets(facets);
    }
  };

  useEffect(() => {
    handleFetchData(true);
  }, []);

  useEffect(() => {
    handleFetchSearchContents();
  }, [selectedFacets?.q?.length, selectedFacets?.content?.length, page]);

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
  };
};
