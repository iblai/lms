import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoursesLayout from '../layout';

describe('CoursesLayout', () => {
  it('renders children', () => {
    render(
      <CoursesLayout>
        <span>test child</span>
      </CoursesLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });
});
