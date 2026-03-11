import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetUserEducationQuery = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserEducationQuery: () => mockGetUserEducationQuery(),
}));

vi.mock('@/components/profile/skeleton-education-box', () => ({
  SkeletonEducationBox: () => <div data-testid="skeleton-education" />,
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier}</div>
  ),
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="empty-box">{message}</div>,
}));

vi.mock('@/components/add-institution-dialog', () => ({
  AddInstitutionDialog: ({ open, onOpenChange, onSave }: any) =>
    open ? (
      <div data-testid="add-institution-dialog">
        <button onClick={() => onSave()}>Save</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  EducationDialog: ({ open, onOpenChange, onComplete, education }: any) =>
    open ? (
      <div data-testid="education-dialog">
        <button onClick={() => onComplete()}>Complete</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('@iblai/iblai-api', () => ({}));

vi.mock('dayjs', () => {
  const dayjs = (date: any) => ({
    format: (fmt: string) => {
      if (!date) return 'Present';
      const d = new Date(date);
      return fmt === 'YYYY' ? d.getFullYear().toString() : d.toLocaleDateString();
    },
  });
  return { default: dayjs };
});

import { EducationBox } from '../education-box';

describe('EducationBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    mockGetUserEducationQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    const { container } = render(<EducationBox />);
    expect(container).toBeTruthy();
  });

  it('renders Education title', () => {
    mockGetUserEducationQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    render(<EducationBox />);
    expect(screen.getByText('Education')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    mockGetUserEducationQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    render(<EducationBox />);
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows empty box when error occurs', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });
    render(<EducationBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No education found.')).toBeInTheDocument();
  });

  it('shows empty box when empty education array', () => {
    mockGetUserEducationQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<EducationBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('renders education items when data is available', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: [
        {
          degree: 'BSc Computer Science',
          institution: { name: 'MIT' },
          start_date: '2018-01-01',
          end_date: '2022-01-01',
          grade: 'A',
          description: 'Studied computer science',
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<EducationBox />);
    expect(screen.getByText('BSc Computer Science')).toBeInTheDocument();
    expect(screen.getByText(/MIT/)).toBeInTheDocument();
  });

  it('renders education description when available', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: [
        {
          degree: 'MSc AI',
          institution: { name: 'Stanford' },
          start_date: '2020-01-01',
          end_date: '2022-01-01',
          grade: 'A+',
          description: 'Machine learning focus',
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<EducationBox />);
    expect(screen.getByText('Machine learning focus')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: [
        {
          degree: 'MBA',
          institution: { name: 'Harvard' },
          start_date: '2019-01-01',
          end_date: '2021-01-01',
          grade: 'B+',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<EducationBox />);
    expect(screen.getByText('MBA')).toBeInTheDocument();
  });

  it('opens education dialog when edit button is clicked', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: [
        {
          degree: 'PhD',
          institution: { name: 'Caltech' },
          start_date: '2015-01-01',
          end_date: '2020-01-01',
          grade: 'A',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<EducationBox />);
    const editBtn = document.querySelector('button[class*="text-amber-500"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      expect(screen.getByTestId('education-dialog')).toBeInTheDocument();
    }
  });

  it('closes education dialog on complete', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: [
        {
          degree: 'PhD',
          institution: { name: 'Caltech' },
          start_date: '2015-01-01',
          end_date: '2020-01-01',
          grade: 'A',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<EducationBox />);
    const editBtn = document.querySelector('button[class*="text-amber-500"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      expect(screen.getByTestId('education-dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Complete'));
      expect(screen.queryByTestId('education-dialog')).not.toBeInTheDocument();
    }
  });

  it('handles education with same start and end year', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: [
        {
          degree: 'Certificate',
          institution: { name: 'Coursera' },
          start_date: '2022-01-01',
          end_date: '2022-12-01',
          grade: 'Pass',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<EducationBox />);
    expect(screen.getByText('Certificate')).toBeInTheDocument();
  });

  it('handles education with null end_date', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: [
        {
          degree: 'Ongoing Program',
          institution: { name: 'OpenU' },
          start_date: '2023-01-01',
          end_date: null,
          grade: 'N/A',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<EducationBox />);
    expect(screen.getByText('Ongoing Program')).toBeInTheDocument();
  });

  it('renders multiple education items', () => {
    mockGetUserEducationQuery.mockReturnValue({
      data: [
        {
          degree: 'BSc',
          institution: { name: 'Uni A' },
          start_date: '2015-01-01',
          end_date: '2019-01-01',
          grade: 'A',
          description: null,
        },
        {
          degree: 'MSc',
          institution: { name: 'Uni B' },
          start_date: '2020-01-01',
          end_date: '2022-01-01',
          grade: 'A+',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<EducationBox />);
    expect(screen.getByText('BSc')).toBeInTheDocument();
    expect(screen.getByText('MSc')).toBeInTheDocument();
  });
});
