import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@iblai/iblai-js/web-containers', () => ({
  CourseContentLoading: () => <div data-testid="course-content-loading" />,
}));

import Loading from '../loading';

describe('Loading (course-content)', () => {
  it('renders without crashing', () => {
    render(<Loading />);
  });

  it('renders the shared CourseContentLoading component', () => {
    render(<Loading />);
    expect(screen.getByTestId('course-content-loading')).toBeInTheDocument();
  });
});
