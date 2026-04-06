import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('../skill-detail-modal', () => ({
  SkillDetailModal: ({ skill, onClose, onRatingChange, onDeleteSkill }: any) => (
    <div data-testid="skill-detail-modal">
      <span>{skill.name}</span>
      <span>Rating: {skill.rating}</span>
      <button data-testid="modal-close" onClick={onClose}>
        Close
      </button>
      <button data-testid="modal-rate" onClick={() => onRatingChange(5)}>
        Rate
      </button>
      <button data-testid="modal-delete" onClick={onDeleteSkill}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

import { SkillRatingExample } from '../skill-rating-example';

describe('SkillRatingExample', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkillRatingExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays the title', () => {
    render(<SkillRatingExample />);
    expect(screen.getByText('Skill Rating Example')).toBeInTheDocument();
  });

  it('displays the skill name and level', () => {
    render(<SkillRatingExample />);
    expect(screen.getByText('JavaScript:')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });

  it('shows Edit Rating button', () => {
    render(<SkillRatingExample />);
    expect(screen.getByText('Edit Rating')).toBeInTheDocument();
  });

  it('opens modal when Edit Rating is clicked', () => {
    render(<SkillRatingExample />);
    fireEvent.click(screen.getByText('Edit Rating'));
    expect(screen.getByTestId('skill-detail-modal')).toBeInTheDocument();
  });

  it('does not show modal initially', () => {
    render(<SkillRatingExample />);
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
  });

  it('closes modal when onClose is called', () => {
    render(<SkillRatingExample />);
    fireEvent.click(screen.getByText('Edit Rating'));
    expect(screen.getByTestId('skill-detail-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
  });

  it('updates rating when onRatingChange is called', () => {
    render(<SkillRatingExample />);
    fireEvent.click(screen.getByText('Edit Rating'));
    fireEvent.click(screen.getByTestId('modal-rate'));
    expect(screen.getByText('Level 5')).toBeInTheDocument();
  });

  it('closes modal and logs when onDeleteSkill is called', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<SkillRatingExample />);
    fireEvent.click(screen.getByText('Edit Rating'));
    fireEvent.click(screen.getByTestId('modal-delete'));
    expect(consoleSpy).toHaveBeenCalledWith('Deleting skill:', 'JavaScript');
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
