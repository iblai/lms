import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/contexts/facet-filter-context', () => {
  const React = require('react');
  return {
    FacetFilterContext: React.createContext({
      filterDrawerOpen: false,
      setFilterDrawerOpen: () => {},
      facetsLoading: false,
      isError: false,
      facets: [],
      handleToggleFacet: () => {},
      handleFilterFacets: () => {},
      isFacetTermSelected: () => false,
      handleSelectFacets: () => {},
    }),
  };
});

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => (open ? <div data-testid="sheet">{children}</div> : null),
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
  SheetTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('../discover-facets-filter', () => ({
  DiscoverFacetsFilter: () => <div data-testid="discover-facets-filter" />,
}));

import { DiscoverFilterDrawer } from '../discover-filter-drawer';
import { FacetFilterContext } from '@/contexts/facet-filter-context';

const getDefaultContextValue = () => ({
  filterDrawerOpen: false,
  setFilterDrawerOpen: vi.fn(),
  facetsLoading: false,
  isError: false,
  facets: [],
  handleToggleFacet: vi.fn(),
  handleFilterFacets: vi.fn(),
  isFacetTermSelected: vi.fn(),
  handleSelectFacets: vi.fn(),
});

const renderWithContext = (contextOverrides = {}) => {
  const value = { ...getDefaultContextValue(), ...contextOverrides };
  return render(
    <FacetFilterContext.Provider value={value as any}>
      <DiscoverFilterDrawer />
    </FacetFilterContext.Provider>,
  );
};

describe('DiscoverFilterDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render sheet content when closed', () => {
    renderWithContext({ filterDrawerOpen: false });
    expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
  });

  it('renders sheet content when open', () => {
    renderWithContext({ filterDrawerOpen: true });
    expect(screen.getByTestId('sheet')).toBeInTheDocument();
    expect(screen.getByText('Explore Content')).toBeInTheDocument();
  });

  it('renders DiscoverFacetsFilter inside the drawer', () => {
    renderWithContext({ filterDrawerOpen: true });
    expect(screen.getByTestId('discover-facets-filter')).toBeInTheDocument();
  });
});
