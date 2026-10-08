import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Profile lookups are covered by the hook's own tests; here names resolve to the fallback.
vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string, fallback?: string) => fallback || username,
}));

import {
  MembersTable,
  Notice,
  SectionCard,
  StatCard,
  errorMessage,
  memberName,
} from '../instructor-ui';

const ada = { username: 'ada', email: 'ada@x.org', first_name: 'Ada', last_name: 'Lovelace' };
const bob = { username: 'bob', email: 'bob@x.org', first_name: '', last_name: '' };

describe('instructor UI helpers', () => {
  it('SectionCard labels itself by its title and renders description, actions and body', () => {
    render(
      <SectionCard title="Course team" description="Who runs it" actions={<button>act</button>}>
        <p>body</p>
      </SectionCard>,
    );
    const section = screen.getByRole('region', { name: 'Course team' });
    expect(section).toHaveTextContent('Who runs it');
    expect(section).toHaveTextContent('act');
    expect(section).toHaveTextContent('body');
  });

  it('StatCard shows label, value and optional hint', () => {
    const { rerender } = render(<StatCard label="Enrolled" value={6} hint="Active" />);
    expect(screen.getByText('Enrolled')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    rerender(<StatCard label="Enrolled" value="…" />);
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('memberName prefers the full name and falls back to the email', () => {
    expect(memberName(ada)).toBe('Ada Lovelace');
    expect(memberName(bob)).toBe('bob@x.org');
  });

  it('MembersTable renders rows with an optional remove action', () => {
    const onRemove = vi.fn();
    const { rerender } = render(
      <MembersTable members={[ada, bob]} emptyText="Nobody" onRemove={onRemove} />,
    );
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Name',
      'Email',
      '',
    ]);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Ada Lovelace');
    expect(rows[1]).not.toHaveTextContent(/\bbob\b(?!@)/);
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1]);
    expect(onRemove).toHaveBeenCalledWith(bob);

    rerender(<MembersTable members={[ada]} emptyText="Nobody" onRemove={onRemove} removing />);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();

    rerender(<MembersTable members={[ada]} emptyText="Nobody" />);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();

    rerender(<MembersTable members={[]} emptyText="Nobody" />);
    expect(screen.getByText('Nobody')).toBeInTheDocument();
  });

  it('Notice uses an alert role for errors and a status role otherwise', () => {
    const { rerender } = render(<Notice tone="error">bad</Notice>);
    expect(screen.getByRole('alert')).toHaveTextContent('bad');
    rerender(<Notice tone="success">good</Notice>);
    expect(screen.getByRole('status')).toHaveTextContent('good');
    rerender(<Notice tone="info">fyi</Notice>);
    expect(screen.getByRole('status').className).toContain('bg-gray-50');
  });

  it('errorMessage reads a message off the error or falls back', () => {
    expect(errorMessage(new Error('nope'), 'fallback')).toBe('nope');
    expect(errorMessage({}, 'fallback')).toBe('fallback');
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
  });
});
