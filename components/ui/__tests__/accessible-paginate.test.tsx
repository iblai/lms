import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccessiblePaginate from '../accessible-paginate';

describe('AccessiblePaginate', () => {
  it('renders inside a nav with aria-label', () => {
    render(<AccessiblePaginate pageCount={5} />);
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(nav).toBeInTheDocument();
  });

  it('sets role="list" on the pagination ul', () => {
    const { container } = render(<AccessiblePaginate pageCount={5} />);
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul).toHaveAttribute('role', 'list');
  });

  it('passes props through to ReactPaginate', () => {
    render(
      <AccessiblePaginate
        pageCount={3}
        previousLabel="Prev"
        nextLabel="Next"
        className="test-class"
      />,
    );
    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
});
