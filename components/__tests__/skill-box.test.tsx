import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import { SkillBox } from '../skill-box';

const baseSkill = {
  id: 1,
  name: 'JavaScript',
  level: 3,
  starred: false,
};

describe('SkillBox', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkillBox skill={baseSkill} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays the skill name', () => {
    render(<SkillBox skill={baseSkill} />);
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('displays the skill level', () => {
    render(<SkillBox skill={baseSkill} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows rating by default', () => {
    const { container } = render(<SkillBox skill={baseSkill} />);
    const svgs = container.querySelectorAll('svg.h-full');
    expect(svgs.length).toBe(1);
  });

  it('hides rating when showRating is false', () => {
    const { container } = render(<SkillBox skill={baseSkill} showRating={false} />);
    // The rating circle SVG should not be rendered
    const ratingCircle = container.querySelector('svg.h-full');
    expect(ratingCircle).not.toBeInTheDocument();
  });

  it('calls onSkillClick when clicked', () => {
    const onClick = vi.fn();
    render(<SkillBox skill={baseSkill} onSkillClick={onClick} />);
    fireEvent.click(screen.getByText('JavaScript'));
    expect(onClick).toHaveBeenCalledWith(baseSkill);
  });

  it('does not error when onSkillClick is not provided', () => {
    render(<SkillBox skill={baseSkill} />);
    expect(() => fireEvent.click(screen.getByText('JavaScript'))).not.toThrow();
  });

  it('uses default level of 1 when skill.level is undefined', () => {
    const skill = { ...baseSkill, level: 0 };
    render(<SkillBox skill={skill} />);
    // level || 1 → when level is 0, it shows 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders the star icon', () => {
    const { container } = render(<SkillBox skill={baseSkill} />);
    // Lucide Star icon renders as an SVG
    const starSvg = container.querySelector('svg.h-6');
    expect(starSvg).toBeInTheDocument();
  });
});
