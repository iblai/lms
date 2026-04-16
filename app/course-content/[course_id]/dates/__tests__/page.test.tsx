import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const capturedProps: { value?: any } = {};
vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  CourseContentTabPage: (props: any) => {
    capturedProps.value = props;
    return <div data-testid="course-content-tab-page" data-tab={props.tab} />;
  },
}));

vi.mock('@/lib/config', () => ({
  config: {
    urls: {
      lms: () => 'https://lms.test',
      mfe: () => 'https://mfe.test',
      legacyLmsUrl: () => 'https://legacy-lms.test',
    },
  },
}));

import DatesTab from '../page';

describe('DatesTab', () => {
  beforeEach(() => {
    capturedProps.value = undefined;
  });

  it('renders the shared CourseContentTabPage', () => {
    render(<DatesTab />);
    expect(screen.getByTestId('course-content-tab-page')).toBeInTheDocument();
  });

  it('passes tab="dates" to the shared component', () => {
    render(<DatesTab />);
    expect(capturedProps.value?.tab).toBe('dates');
  });

  it('passes lmsUrl, mfeUrl, and legacyLmsUrl from config', () => {
    render(<DatesTab />);
    expect(capturedProps.value?.lmsUrl).toBe('https://lms.test');
    expect(capturedProps.value?.mfeUrl).toBe('https://mfe.test');
    expect(capturedProps.value?.legacyLmsUrl).toBe('https://legacy-lms.test');
  });
});
