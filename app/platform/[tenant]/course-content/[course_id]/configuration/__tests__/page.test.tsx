import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// The dynamically-imported ConfigurationTab — stub it and echo props.
vi.mock('@/app/platform/[tenant]/courses/[course_id]/_components/configuration-tab', () => ({
  ConfigurationTab: (props: any) => (
    <div data-testid="configuration-tab" data-course-id={props.courseId} />
  ),
}));

// next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ course_id: 'course-v1%3Atest%2Bcourse%2B2024' }),
  redirect: (...args: any[]) => mockRedirect(...args),
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

const mockMemberCheck = vi.fn((..._args: any[]): any => ({
  data: { is_platform_admin: true },
  isSuccess: true,
}));
vi.mock('@/services/core', () => ({
  useGetDepartmentMemberCheckQuery: (...args: any[]) => mockMemberCheck(...args),
}));

vi.mock('@/hooks/courses/edx-iframe-context', () => ({
  EdxIframeContext: React.createContext<any>({ setActiveTab: () => {} }),
}));

import ConfigurationPage from '../page';
import { EdxIframeContext } from '@/hooks/courses/edx-iframe-context';

const mockSetActiveTab = vi.fn();

function renderPage() {
  return render(
    <EdxIframeContext.Provider value={{ setActiveTab: mockSetActiveTab } as any}>
      <ConfigurationPage />
    </EdxIframeContext.Provider>,
  );
}

describe('ConfigurationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: true }, isSuccess: true });
  });

  it('renders the ConfigurationTab for a platform admin', async () => {
    renderPage();
    // ConfigurationTab is lazy-loaded via next/dynamic, so it resolves asynchronously.
    expect(await screen.findByTestId('configuration-tab')).toBeInTheDocument();
  });

  it('passes the decoded courseId to ConfigurationTab', async () => {
    renderPage();
    const tab = await screen.findByTestId('configuration-tab');
    expect(tab).toHaveAttribute('data-course-id', 'course-v1:test+course+2024');
  });

  it('announces configuration as the active tab for an admin', () => {
    renderPage();
    expect(mockSetActiveTab).toHaveBeenCalledWith('configuration');
  });

  it('renders nothing for a non-admin user', () => {
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
    const { container } = renderPage();
    expect(screen.queryByTestId('configuration-tab')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects a resolved non-admin away from the page', () => {
    mockMemberCheck.mockReturnValue({ data: { is_platform_admin: false }, isSuccess: true });
    renderPage();
    expect(mockRedirect).toHaveBeenCalledWith('/platform/test-tenant');
  });

  it('does not redirect before the member check resolves', () => {
    mockMemberCheck.mockReturnValue({ data: undefined, isSuccess: false });
    renderPage();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
