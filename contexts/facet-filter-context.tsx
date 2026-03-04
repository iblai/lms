'use client';

import { createContext } from 'react';
import { CourseFacet } from '@/types/courses';

export const FacetFilterContext = createContext<{
  facetsLoading: boolean;
  isError: boolean;
  filteredFacets: CourseFacet[];
  facets: CourseFacet[];
  handleToggleFacet: (slug: string) => void;
  handleFilterFacets: (slug: string, value: string) => void;
  isFacetTermSelected: (slug: string, term: string) => boolean;
  handleSelectFacets: (slug: string, term: string) => void;
  filterDrawerOpen: boolean;
  setFilterDrawerOpen: (filterDrawerOpen: boolean) => void;
}>({
  facetsLoading: false,
  isError: false,
  filteredFacets: [],
  facets: [],
  handleToggleFacet: () => {},
  handleFilterFacets: () => {},
  isFacetTermSelected: () => false,
  handleSelectFacets: () => {},
  filterDrawerOpen: false,
  setFilterDrawerOpen: () => {},
});
