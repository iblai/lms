'use client';

import { useUserMetadata } from '@/hooks/users/use-usermetadata';
import { Edit } from 'lucide-react';
import { UserAvatar } from './header/profile/user-avatar';
import { useRouter } from 'next/navigation';

export const UserProfileBox = () => {
  const { userMetaData } = useUserMetadata();
  const router = useRouter();
  return (
    <div className="mb-4 rounded-md border border-[var(--sidebar-border)] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="overflow-hidden rounded-full border-2"
            style={{ borderColor: 'var(--primary-light)' }}
          >
            <UserAvatar />
          </div>
          <h2 className="text-sm font-medium text-[var(--sidebar-text)] md:text-base">
            {userMetaData?.name}
          </h2>
        </div>
        <button
          onClick={() => router.push('/profile/public')}
          className="rounded-sm p-1 text-[var(--text-light)] hover:bg-[var(--sidebar-hover-bg)]"
        >
          <Edit className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
