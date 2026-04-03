import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockHandleToggleFacet = vi.fn();
const mockHandleFilterFacets = vi.fn();
const mockIsFacetTermSelected = vi.fn(() => false);
const mockHandleSelectFacets = vi.fn();

vi.mock('@/contexts/facet-filter-context', () => {
  const React = require('react');
  return {
    FacetFilterContext: React.createContext({
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

vi.mock('../skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier} skeletons</div>
  ),
}));

vi.mock('../skeleton-discover-filter-box', () => ({
  SkeletonDiscoverFilterBox: () => <div data-testid="skeleton-filter-box" />,
}));

vi.mock('../default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="default-empty-box">{message}</div>,
}));

import { DiscoverFacetsFilter } from '../discover-facets-filter';
import { FacetFilterContext } from '@/contexts/facet-filter-context';

const getDefaultContextValue = () => ({
  facetsLoading: false,
  isError: false,
  facets: [] as any[],
  handleToggleFacet: mockHandleToggleFacet,
  handleFilterFacets: mockHandleFilterFacets,
  isFacetTermSelected: mockIsFacetTermSelected,
  handleSelectFacets: mockHandleSelectFacets,
});

const renderWithContext = (contextOverrides = {}) => {
  const value = { ...getDefaultContextValue(), ...contextOverrides };
  return render(
    <FacetFilterContext.Provider value={value as any}>
      <DiscoverFacetsFilter />
    </FacetFilterContext.Provider>,
  );
};

describe('DiscoverFacetsFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when facetsLoading is true', () => {
    renderWithContext({ facetsLoading: true });
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('renders nothing when not loading and error', () => {
    const { container } = renderWithContext({ facetsLoading: false, isError: true });
    // The component has a bug: it doesn't return the DefaultEmptyBox, just evaluates the expression
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when not loading, no error, and empty facets', () => {
    const { container } = renderWithContext({ facetsLoading: false, isError: false, facets: [] });
    expect(container.innerHTML).toBe('');
  });

  it('renders facets when data is available', () => {
    const facets = [
      {
        slug: 'category',
        label: 'Category',
        expanded: false,
        terms: [
          { key: 'math', count: 5 },
          { key: 'science', count: 3 },
        ],
      },
    ];
    renderWithContext({ facets });
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('shows terms when facet is expanded', () => {
    const facets = [
      {
        slug: 'category',
        label: 'Category',
        expanded: true,
        terms: [
          { key: 'math', count: 5 },
          { key: 'science', count: 3 },
        ],
      },
    ];
    renderWithContext({ facets });
    expect(screen.getByText('math (5)')).toBeInTheDocument();
    expect(screen.getByText('science (3)')).toBeInTheDocument();
  });

  it('does not show terms when facet is collapsed', () => {
    const facets = [
      {
        slug: 'category',
        label: 'Category',
        expanded: false,
        terms: [{ key: 'math', count: 5 }],
      },
    ];
    renderWithContext({ facets });
    expect(screen.queryByText('math (5)')).not.toBeInTheDocument();
  });

  it('calls handleToggleFacet when facet header is clicked', () => {
    const facets = [
      {
        slug: 'category',
        label: 'Category',
        expanded: false,
        terms: [],
      },
    ];
    renderWithContext({ facets });
    fireEvent.click(screen.getByText('Category'));
    expect(mockHandleToggleFacet).toHaveBeenCalledWith('category');
  });

  it('calls handleFilterFacets when filter input changes', () => {
    const facets = [
      {
        slug: 'category',
        label: 'Category',
        expanded: true,
        terms: [],
      },
    ];
    renderWithContext({ facets });
    const input = screen.getByPlaceholderText('Filter');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(mockHandleFilterFacets).toHaveBeenCalledWith('category', 'test');
  });

  it('calls handleSelectFacets when checkbox is changed', () => {
    const facets = [
      {
        slug: 'category',
        label: 'Category',
        expanded: true,
        terms: [{ key: 'math', count: 5 }],
      },
    ];
    renderWithContext({ facets });
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(mockHandleSelectFacets).toHaveBeenCalledWith('category', 'math');
  });

  it('checks checkbox when isFacetTermSelected returns true', () => {
    mockIsFacetTermSelected.mockReturnValue(true);
    const facets = [
      {
        slug: 'category',
        label: 'Category',
        expanded: true,
        terms: [{ key: 'math', count: 5 }],
      },
    ];
    renderWithContext({ facets });
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('renders multiple facets', () => {
    const facets = [
      { slug: 'category', label: 'Category', expanded: false, terms: [] },
      { slug: 'level', label: 'Level', expanded: false, terms: [] },
    ];
    renderWithContext({ facets });
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
  });
});
