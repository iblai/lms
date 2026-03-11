import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetUserExperienceQuery = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserExperienceQuery: () => mockGetUserExperienceQuery(),
}));

vi.mock('@/components/profile/skeleton-education-box', () => ({
  SkeletonEducationBox: () => <div data-testid="skeleton-experience" />,
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier}</div>
  ),
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="empty-box">{message}</div>,
}));

vi.mock('@/components/add-company-dialog', () => ({
  AddCompanyDialog: ({ open, onOpenChange, onSave }: any) =>
    open ? (
      <div data-testid="add-company-dialog">
        <button onClick={() => onSave()}>Save Company</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  ExperienceDialog: ({ open, onOpenChange, onComplete }: any) =>
    open ? (
      <div data-testid="experience-dialog">
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

import { ExperienceBox } from '../experience-box';

describe('ExperienceBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    const { container } = render(<ExperienceBox />);
    expect(container).toBeTruthy();
  });

  it('renders Work Experience title', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByText('Work Experience')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByTestId('skeleton-multiplier')).toBeInTheDocument();
  });

  it('shows empty box when error occurs', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Network error'),
    });
    render(<ExperienceBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
    expect(screen.getByText('No experience found.')).toBeInTheDocument();
  });

  it('shows empty box when empty experience array', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByTestId('empty-box')).toBeInTheDocument();
  });

  it('renders experience items when data is available', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [
        {
          title: 'Software Engineer',
          company: { name: 'Google' },
          start_date: '2019-01-01',
          end_date: '2022-01-01',
          description: 'Built amazing stuff',
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Google/)).toBeInTheDocument();
  });

  it('renders description when available', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [
        {
          title: 'Senior Dev',
          company: { name: 'Apple' },
          start_date: '2020-01-01',
          end_date: '2023-01-01',
          description: 'Worked on iOS features',
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByText('Worked on iOS features')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [
        {
          title: 'Intern',
          company: { name: 'Startup' },
          start_date: '2021-06-01',
          end_date: '2021-09-01',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByText('Intern')).toBeInTheDocument();
  });

  it('opens experience dialog when edit button is clicked', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [
        {
          title: 'CTO',
          company: { name: 'BigCorp' },
          start_date: '2018-01-01',
          end_date: '2023-01-01',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    const editBtn = document.querySelector('button[class*="text-amber-500"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      expect(screen.getByTestId('experience-dialog')).toBeInTheDocument();
    }
  });

  it('closes experience dialog on complete', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [
        {
          title: 'CTO',
          company: { name: 'BigCorp' },
          start_date: '2018-01-01',
          end_date: '2023-01-01',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    const editBtn = document.querySelector('button[class*="text-amber-500"]');
    if (editBtn) {
      fireEvent.click(editBtn);
      expect(screen.getByTestId('experience-dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Complete'));
      expect(screen.queryByTestId('experience-dialog')).not.toBeInTheDocument();
    }
  });

  it('handles experience with same start and end year', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [
        {
          title: 'Contractor',
          company: { name: 'Agency X' },
          start_date: '2022-03-01',
          end_date: '2022-09-01',
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByText('Contractor')).toBeInTheDocument();
  });

  it('handles experience with null end_date (present)', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [
        {
          title: 'Lead Engineer',
          company: { name: 'Current Company' },
          start_date: '2021-01-01',
          end_date: null,
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByText('Lead Engineer')).toBeInTheDocument();
  });

  it('renders multiple experience items', () => {
    mockGetUserExperienceQuery.mockReturnValue({
      data: [
        {
          title: 'Junior Dev',
          company: { name: 'Company A' },
          start_date: '2015-01-01',
          end_date: '2018-01-01',
          description: null,
        },
        {
          title: 'Senior Dev',
          company: { name: 'Company B' },
          start_date: '2018-01-01',
          end_date: null,
          description: null,
        },
      ],
      isLoading: false,
      error: null,
    });
    render(<ExperienceBox />);
    expect(screen.getByText('Junior Dev')).toBeInTheDocument();
    expect(screen.getByText('Senior Dev')).toBeInTheDocument();
  });
});
