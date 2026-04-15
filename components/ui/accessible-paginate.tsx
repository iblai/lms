'use client';

import { useEffect, useRef } from 'react';
import ReactPaginate, { type ReactPaginateProps } from 'react-paginate';

/**
 * Wrapper around ReactPaginate that fixes the accessibility issue where
 * ReactPaginate renders a `<ul role="navigation">` which is invalid HTML.
 * This replaces it with `role="list"` and wraps the component in a `<nav>`.
 */
export default function AccessiblePaginate(props: ReactPaginateProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ul = containerRef.current?.querySelector('ul');
    if (ul) {
      ul.setAttribute('role', 'list');
    }
  });

  return (
    <nav aria-label="Pagination">
      <div ref={containerRef}>
        <ReactPaginate {...props} />
      </div>
    </nav>
  );
}
