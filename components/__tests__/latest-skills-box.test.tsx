import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

import { LatestSkillsBox } from '../latest-skills-box';

describe('LatestSkillsBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing with empty skills', () => {
    render(<LatestSkillsBox skills={[]} />);
    expect(screen.getByText('Latest Skills')).toBeInTheDocument();
  });

  it('renders skill items', () => {
    const skills = [{ name: 'JavaScript' }, { name: 'TypeScript' }, { name: 'React' }] as any[];
    render(<LatestSkillsBox skills={skills} />);
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('navigates to /profile/skills when add button is clicked', () => {
    render(<LatestSkillsBox skills={[]} />);
    const addButton = screen.getByLabelText('Add Skill');
    fireEvent.click(addButton);
    expect(mockPush).toHaveBeenCalledWith('/test-tenant/profile/skills');
  });

  it('calls onClose when add button is clicked and onClose is provided', () => {
    const onClose = vi.fn();
    render(<LatestSkillsBox skills={[]} onClose={onClose} />);
    const addButton = screen.getByLabelText('Add Skill');
    fireEvent.click(addButton);
    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/test-tenant/profile/skills');
  });

  it('does not call onClose when not provided', () => {
    render(<LatestSkillsBox skills={[]} />);
    const addButton = screen.getByLabelText('Add Skill');
    fireEvent.click(addButton);
    // Should not throw
    expect(mockPush).toHaveBeenCalledWith('/test-tenant/profile/skills');
  });

  it('renders the add skill tooltip', () => {
    render(<LatestSkillsBox skills={[]} />);
    expect(screen.getByText('Add Skill')).toBeInTheDocument();
  });
});
