'use client';

import { useUserDisplayName } from '@/hooks/users/use-user-display-name';

/** Inline name for a user identified by username (see `useUserDisplayName`). */
export function UserDisplayName({
  username,
  fallback,
  className,
}: {
  username: string | undefined;
  fallback?: string;
  className?: string;
}) {
  const name = useUserDisplayName(username, fallback);
  return (
    <span className={className} data-testid="user-display-name">
      {name}
    </span>
  );
}
