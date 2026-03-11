import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import _ from 'lodash';

const mockUseProfileSkills = vi.fn();
vi.mock('@/hooks/profile/use-profile-skills', () => ({
  useProfileSkills: () => mockUseProfileSkills(),
}));

vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier">{multiplier}</div>
  ),
}));

vi.mock('@/components/skeleton-skill-box', () => ({
  SkeletonSkillBox: () => <div data-testid="skeleton-skill-box" />,
}));

vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: any) => <div data-testid="empty-box">{message}</div>,
}));

vi.mock('@/components/skill-box', () => ({
  SkillBox: ({ skill, showRating }: any) => (
    <div data-testid="skill-box">
      <span>{skill.name}</span>
      <span>{skill.level}</span>
      {skill.starred && <span>starred</span>}
      {showRating === false && <span>no-rating</span>}
    </div>
  ),
}));

// Mock lodash isEmpty with a smart implementation
let isEmptyImpl = (val: any): boolean => {
  if (val === null || val === undefined) return true;
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
};

vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn((val: any) => isEmptyImpl(val)),
  },
}));

import { SkillsBox } from '../skills-box';

const emptySkillsState = {
  earnedSkills: null,
  desiredSkills: null,
  selfReportedSkills: null,
  earnedSkillsLoading: false,
  desiredSkillsLoading: false,
  selfReportedSkillsLoading: false,
  earnedSkillsError: null,
  desiredSkillsError: null,
  selfReportedSkillsError: null,
};

describe('SkillsBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset isEmpty to smart implementation
    vi.mocked(_.isEmpty).mockImplementation((val: any) => isEmptyImpl(val));
  });

  it('renders without crashing', () => {
    mockUseProfileSkills.mockReturnValue(emptySkillsState);
    const { container } = render(<SkillsBox />);
    expect(container).toBeTruthy();
  });

  it('renders Skills title', () => {
    mockUseProfileSkills.mockReturnValue(emptySkillsState);
    render(<SkillsBox />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('renders section headers', () => {
    mockUseProfileSkills.mockReturnValue(emptySkillsState);
    render(<SkillsBox />);
    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByText('Self-Reported')).toBeInTheDocument();
    expect(screen.getByText('Desired')).toBeInTheDocument();
  });

  it('shows skeleton when earned skills loading', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      earnedSkillsLoading: true,
    });
    render(<SkillsBox />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  it('shows skeleton when self-reported skills loading', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      selfReportedSkillsLoading: true,
    });
    render(<SkillsBox />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  it('shows skeleton when desired skills loading', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      desiredSkillsLoading: true,
    });
    render(<SkillsBox />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  it('shows empty box when earned skills error', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      earnedSkillsError: new Error('Failed'),
    });
    render(<SkillsBox />);
    const emptyBoxes = screen.getAllByTestId('empty-box');
    expect(emptyBoxes.some((box) => box.textContent?.includes("earned skills"))).toBe(true);
  });

  it('shows empty box when earned skills is empty object', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      earnedSkills: { resources: [] },
    });
    render(<SkillsBox />);
    // isEmpty({resources: []}) returns false (object with key)
    // but we check _.isEmpty(earnedSkills?.resources) which is []
    // isEmpty([]) = true → show empty box
    const emptyBoxes = screen.getAllByTestId('empty-box');
    expect(emptyBoxes.length).toBeGreaterThan(0);
  });

  it('shows empty box when self-reported skills error', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      selfReportedSkillsError: new Error('Failed'),
    });
    render(<SkillsBox />);
    const emptyBoxes = screen.getAllByTestId('empty-box');
    expect(emptyBoxes.some((box) => box.textContent?.includes("self-reported"))).toBe(true);
  });

  it('shows empty box when desired skills error', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      desiredSkillsError: new Error('Failed'),
    });
    render(<SkillsBox />);
    const emptyBoxes = screen.getAllByTestId('empty-box');
    expect(emptyBoxes.some((box) => box.textContent?.includes("desired"))).toBe(true);
  });

  it('shows empty box when self-reported skills is empty', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      selfReportedSkills: { skills: [] },
    });
    render(<SkillsBox />);
    const emptyBoxes = screen.getAllByTestId('empty-box');
    expect(emptyBoxes.length).toBeGreaterThan(0);
  });

  it('shows empty box when desired skills is empty', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      desiredSkills: { skills: [] },
    });
    render(<SkillsBox />);
    const emptyBoxes = screen.getAllByTestId('empty-box');
    expect(emptyBoxes.length).toBeGreaterThan(0);
  });

  it('renders earned skills when available', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      earnedSkills: {
        resources: [
          { name: 'Python', points: 85 },
          { name: 'JavaScript', points: 75 },
        ],
      },
    });
    render(<SkillsBox />);
    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('renders self-reported skills when available', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      selfReportedSkills: {
        skills: [{ name: 'React' }, { name: 'TypeScript' }],
        data: { level: [3, 4] },
      },
    });
    render(<SkillsBox />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders desired skills when available', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      desiredSkills: {
        skills: [{ name: 'Machine Learning' }, { name: 'Data Science' }],
        data: { level: [2, 3] },
      },
    });
    render(<SkillsBox />);
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Data Science')).toBeInTheDocument();
  });

  it('renders desired skills without rating', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      desiredSkills: {
        skills: [{ name: 'Go' }],
        data: { level: [1] },
      },
    });
    render(<SkillsBox />);
    // Desired skill boxes have showRating={false}
    const noRatingElements = screen.getAllByText('no-rating');
    expect(noRatingElements.length).toBeGreaterThan(0);
  });

  it('renders all sections with data', () => {
    mockUseProfileSkills.mockReturnValue({
      earnedSkills: { resources: [{ name: 'Java', points: 70 }] },
      desiredSkills: { skills: [{ name: 'Rust' }], data: { level: [5] } },
      selfReportedSkills: { skills: [{ name: 'C++' }], data: { level: [4] } },
      earnedSkillsLoading: false,
      desiredSkillsLoading: false,
      selfReportedSkillsLoading: false,
      earnedSkillsError: null,
      desiredSkillsError: null,
      selfReportedSkillsError: null,
    });
    render(<SkillsBox />);
    expect(screen.getByText('Java')).toBeInTheDocument();
    expect(screen.getByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('C++')).toBeInTheDocument();
  });

  it('renders skill with no level when level is undefined', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      earnedSkills: {
        resources: [{ name: 'Docker', points: undefined }],
      },
    });
    render(<SkillsBox />);
    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('renders skill with no name gracefully', () => {
    mockUseProfileSkills.mockReturnValue({
      ...emptySkillsState,
      earnedSkills: {
        resources: [{ name: undefined, points: 50 }],
      },
    });
    render(<SkillsBox />);
    const skillBoxes = screen.getAllByTestId('skill-box');
    expect(skillBoxes.length).toBeGreaterThan(0);
  });
});
