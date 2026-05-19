import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockPathname = vi.fn(() => '/profile');

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  usePathname: () => mockPathname(),
}));

import { ProfileTabs } from '../profile-tabs';

describe('ProfileTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/profile');
  });

  it('renders without crashing', () => {
    render(<ProfileTabs />);
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  it('renders all tab names', () => {
    render(<ProfileTabs />);
    const tabs = [
      'Activity',
      'Skills',
      'Credentials',
      'Pathways',
      'Programs',
      'Courses',
      'Public Profile',
    ];
    tabs.forEach((tab) => {
      expect(screen.getByText(tab)).toBeInTheDocument();
    });
  });

  it('marks Activity tab as active when on /profile', () => {
    mockPathname.mockReturnValue('/profile');
    render(<ProfileTabs />);
    const activityLink = screen.getByText('Activity');
    expect(activityLink.className).toContain('border-[var(--primary)]');
  });

  it('marks Skills tab as active when on /profile/skills', () => {
    mockPathname.mockReturnValue('/profile/skills');
    render(<ProfileTabs />);
    const skillsLink = screen.getByText('Skills');
    expect(skillsLink.className).toContain('border-[var(--primary)]');
  });

  it('does not mark Activity as active on sub-paths', () => {
    mockPathname.mockReturnValue('/profile/skills');
    render(<ProfileTabs />);
    const activityLink = screen.getByText('Activity');
    expect(activityLink.className).toContain('border-transparent');
  });

  it('renders correct hrefs for each tab', () => {
    render(<ProfileTabs />);
    expect(screen.getByText('Activity').closest('a')).toHaveAttribute('href', '/profile');
    expect(screen.getByText('Skills').closest('a')).toHaveAttribute('href', '/profile/skills');
    expect(screen.getByText('Credentials').closest('a')).toHaveAttribute(
      'href',
      '/profile/credentials',
    );
    expect(screen.getByText('Pathways').closest('a')).toHaveAttribute('href', '/profile/pathways');
    expect(screen.getByText('Programs').closest('a')).toHaveAttribute('href', '/profile/programs');
    expect(screen.getByText('Courses').closest('a')).toHaveAttribute('href', '/profile/courses');
    expect(screen.getByText('Public Profile').closest('a')).toHaveAttribute(
      'href',
      '/profile/public',
    );
  });

  it('marks Courses tab as active on /profile/courses sub-path', () => {
    mockPathname.mockReturnValue('/profile/courses/123');
    render(<ProfileTabs />);
    const coursesLink = screen.getByText('Courses');
    expect(coursesLink.className).toContain('border-[var(--primary)]');
  });
});
