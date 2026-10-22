import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { SanitizedHtml, sanitizeHtml } from '../discussion-html';

describe('sanitizeHtml', () => {
  it('strips scripts and event handlers but keeps formatting', () => {
    const safe = sanitizeHtml('<p onclick="x()">Hi <b>there</b><script>alert(1)</script></p>');
    expect(safe).toBe('<p>Hi <b>there</b></p>');
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null)).toBe('');
  });

  it('makes links open in a new tab safely', () => {
    expect(sanitizeHtml('<a href="https://x.org">x</a>')).toBe(
      '<a href="https://x.org" target="_blank" rel="noopener noreferrer">x</a>',
    );
  });
});

describe('SanitizedHtml', () => {
  it('renders the sanitised markup', () => {
    render(
      <SanitizedHtml
        html="<p>Hello <em>world</em><img src=x onerror=alert(1)></p>"
        className="extra"
      />,
    );
    const body = screen.getByTestId('sanitized-html');
    expect(body).toHaveClass('extra');
    expect(body.innerHTML).toBe('<p>Hello <em>world</em><img src="x"></p>');
  });
});
