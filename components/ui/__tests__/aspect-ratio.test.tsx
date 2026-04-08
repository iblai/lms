import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AspectRatio } from '../aspect-ratio';

describe('AspectRatio', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <div>Content</div>
      </AspectRatio>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
