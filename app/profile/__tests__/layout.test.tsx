import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  ProfileTabs: () => <div data-testid="profile-tabs" />,
}));

import ProfileLayout from '../layout';

describe('ProfileLayout', () => {
  it('renders children', () => {
    render(
      <ProfileLayout>
        <span>test child</span>
      </ProfileLayout>,
    );
    expect(screen.getByText('test child')).toBeInTheDocument();
  });

  it('renders ProfileTabs', () => {
    render(
      <ProfileLayout>
        <span>content</span>
      </ProfileLayout>,
    );
    expect(screen.getByTestId('profile-tabs')).toBeInTheDocument();
  });

  it('applies overflow hidden styling to outer container', () => {
    const { container } = render(
      <ProfileLayout>
        <span>content</span>
      </ProfileLayout>,
    );
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv).toHaveClass('flex', 'flex-1', 'overflow-hidden');
  });
});
