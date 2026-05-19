import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPathname = vi.fn(() => '/analytics');

vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  usePathname: () => mockPathname(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { AnalyticsSidebar } from '../analytics-sidebar';

describe('AnalyticsSidebar', () => {
  it('renders without crashing', () => {
    const { container } = render(<AnalyticsSidebar />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders Overview link', () => {
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders Users section', () => {
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders Content section', () => {
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders Engagement section', () => {
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Engagement')).toBeInTheDocument();
  });

  it('renders Agents section', () => {
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Agents')).toBeInTheDocument();
  });

  it('toggles Users section expansion', () => {
    render(<AnalyticsSidebar />);
    const usersButton = screen.getByText('Users');
    fireEvent.click(usersButton);
    expect(screen.getByText('Registered Users')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('At-Risk Users')).toBeInTheDocument();
  });

  it('collapses Users section when toggled twice', () => {
    render(<AnalyticsSidebar />);
    const usersButton = screen.getByText('Users');
    fireEvent.click(usersButton);
    expect(screen.getByText('Registered Users')).toBeInTheDocument();
    fireEvent.click(usersButton);
    expect(screen.queryByText('Registered Users')).not.toBeInTheDocument();
  });

  it('toggles Content section expansion', () => {
    render(<AnalyticsSidebar />);
    fireEvent.click(screen.getByText('Content'));
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Programs')).toBeInTheDocument();
    expect(screen.getByText('Pathways')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('toggles Engagement section expansion', () => {
    render(<AnalyticsSidebar />);
    fireEvent.click(screen.getByText('Engagement'));
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Credentials')).toBeInTheDocument();
  });

  it('toggles Agents section expansion', () => {
    render(<AnalyticsSidebar />);
    fireEvent.click(screen.getByText('Agents'));
    expect(screen.getByText('AI Agents')).toBeInTheDocument();
    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('renders correct links for Users sub-items', () => {
    render(<AnalyticsSidebar />);
    fireEvent.click(screen.getByText('Users'));
    expect(screen.getByText('Registered Users').closest('a')).toHaveAttribute(
      'href',
      '/analytics/users/registered',
    );
    expect(screen.getByText('Active Users').closest('a')).toHaveAttribute(
      'href',
      '/analytics/users/active',
    );
    expect(screen.getByText('At-Risk Users').closest('a')).toHaveAttribute(
      'href',
      '/analytics/users/at-risk',
    );
  });

  it('renders correct links for Content sub-items', () => {
    render(<AnalyticsSidebar />);
    fireEvent.click(screen.getByText('Content'));
    expect(screen.getByText('Courses').closest('a')).toHaveAttribute('href', '/analytics/courses');
    expect(screen.getByText('Programs').closest('a')).toHaveAttribute(
      'href',
      '/analytics/programs',
    );
  });

  it('renders Overview link pointing to /analytics', () => {
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Overview').closest('a')).toHaveAttribute('href', '/analytics');
  });

  it('expands Users when pathname includes /analytics/users/', () => {
    mockPathname.mockReturnValue('/analytics/users/registered');
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Registered Users')).toBeInTheDocument();
  });

  it('expands Content when pathname includes /analytics/courses', () => {
    mockPathname.mockReturnValue('/analytics/courses');
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Courses')).toBeInTheDocument();
  });

  it('expands Engagement when pathname includes /analytics/engagement/', () => {
    mockPathname.mockReturnValue('/analytics/engagement/skills');
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('expands Agents when pathname includes /analytics/agents/', () => {
    mockPathname.mockReturnValue('/analytics/agents/topics');
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Topics')).toBeInTheDocument();
  });

  it('expands Content for programs path', () => {
    mockPathname.mockReturnValue('/analytics/programs');
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Programs')).toBeInTheDocument();
  });

  it('expands Content for pathways path', () => {
    mockPathname.mockReturnValue('/analytics/pathways');
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Pathways')).toBeInTheDocument();
  });

  it('expands Content for resources path', () => {
    mockPathname.mockReturnValue('/analytics/resources');
    render(<AnalyticsSidebar />);
    expect(screen.getByText('Resources')).toBeInTheDocument();
  });

  it('renders as aside element', () => {
    mockPathname.mockReturnValue('/analytics');
    const { container } = render(<AnalyticsSidebar />);
    expect(container.querySelector('aside')).toBeInTheDocument();
  });
});
