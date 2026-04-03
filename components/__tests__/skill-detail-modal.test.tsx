import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { SkillDetailModal } from '../skill-detail-modal';

const defaultProps = {
  skill: { name: 'Python', rating: 3 },
  onClose: vi.fn(),
};

describe('SkillDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<SkillDetailModal {...defaultProps} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays the skill name in the header', () => {
    render(<SkillDetailModal {...defaultProps} />);
    expect(screen.getByText(/Rate your expertise in "Python"/)).toBeInTheDocument();
  });

  it('displays the current rating level', () => {
    render(<SkillDetailModal {...defaultProps} />);
    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });

  it('displays the rating description', () => {
    render(<SkillDetailModal {...defaultProps} />);
    expect(screen.getByText(/Capable of managing varied tasks/)).toBeInTheDocument();
  });

  it('shows Beginner and Expert labels', () => {
    render(<SkillDetailModal {...defaultProps} />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<SkillDetailModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    const { container } = render(<SkillDetailModal {...defaultProps} />);
    // X button is near the close area
    const closeButtons = container.querySelectorAll('button');
    // First button in the header is the X button
    fireEvent.click(closeButtons[0]);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows Confirm button', () => {
    render(<SkillDetailModal {...defaultProps} />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('calls onRatingChange with current rating when Confirm is clicked', () => {
    const onRatingChange = vi.fn();
    render(<SkillDetailModal {...defaultProps} onRatingChange={onRatingChange} />);
    fireEvent.click(screen.getByText('Confirm'));
    expect(onRatingChange).toHaveBeenCalledWith(3);
  });

  it('does not call onRatingChange when updatingSkill is true', () => {
    const onRatingChange = vi.fn();
    render(
      <SkillDetailModal {...defaultProps} onRatingChange={onRatingChange} updatingSkill={true} />,
    );
    fireEvent.click(screen.getByText('Updating...'));
    expect(onRatingChange).not.toHaveBeenCalled();
  });

  it('shows Updating... when updatingSkill is true', () => {
    render(<SkillDetailModal {...defaultProps} updatingSkill={true} />);
    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  it('shows Delete skill button when onDeleteSkill is provided', () => {
    const onDeleteSkill = vi.fn();
    render(<SkillDetailModal {...defaultProps} onDeleteSkill={onDeleteSkill} />);
    expect(screen.getByText('Delete skill')).toBeInTheDocument();
  });

  it('does not show Delete skill button when onDeleteSkill is not provided', () => {
    render(<SkillDetailModal {...defaultProps} />);
    expect(screen.queryByText('Delete skill')).not.toBeInTheDocument();
  });

  it('calls onDeleteSkill when Delete skill button is clicked', () => {
    const onDeleteSkill = vi.fn();
    render(<SkillDetailModal {...defaultProps} onDeleteSkill={onDeleteSkill} />);
    fireEvent.click(screen.getByText('Delete skill'));
    expect(onDeleteSkill).toHaveBeenCalled();
  });

  it('shows Deleting... when deletingSkill is true', () => {
    render(<SkillDetailModal {...defaultProps} onDeleteSkill={vi.fn()} deletingSkill={true} />);
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('updates rating when range slider changes', () => {
    render(<SkillDetailModal {...defaultProps} />);
    const slider = screen.getByRole('slider', { name: 'Skill rating' });
    fireEvent.change(slider, { target: { value: '5' } });
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText(/Expert level mastery/)).toBeInTheDocument();
  });

  it('defaults rating to 1 when skill.rating is falsy', () => {
    render(<SkillDetailModal {...defaultProps} skill={{ name: 'Test', rating: 0 }} />);
    expect(screen.getByText('Level 1')).toBeInTheDocument();
  });

  it('calls onRatingChange with new rating after slider change and confirm', () => {
    const onRatingChange = vi.fn();
    render(<SkillDetailModal {...defaultProps} onRatingChange={onRatingChange} />);
    const slider = screen.getByRole('slider', { name: 'Skill rating' });
    fireEvent.change(slider, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Confirm'));
    expect(onRatingChange).toHaveBeenCalledWith(5);
  });

  it('applies pulse animation when rating changes from original', () => {
    const { container } = render(<SkillDetailModal {...defaultProps} />);
    const slider = screen.getByRole('slider', { name: 'Skill rating' });
    fireEvent.change(slider, { target: { value: '5' } });
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.className).toContain('animate-pulse');
  });
});
