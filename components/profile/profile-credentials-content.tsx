'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { CredentialDetailModal } from '@/components/credential-detail-modal';
import { useProfileCredentials } from '@/hooks/profile/use-profile-credentials';
import { SkeletonMultiplier } from '@/components/skeleton-multiplier';
import { CredentialMiniBoxSkeleton } from '@/components/skeleton-credential-mini-box';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import { CredentialMiniBox } from '@/components/credential-mini-box';
import { Assertion } from '@iblai/iblai-api';

/**
 * The learner's credentials — search + grid + detail modal. Shared by the
 * profile > Credentials page and the sidebar Credentials dialog.
 */
export function ProfileCredentialsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { filteredCredentials, isLoading, isError } = useProfileCredentials({
    search: searchQuery,
  });

  const [selectedCredential, setSelectedCredential] = useState<Assertion | null>(null);

  return (
    <>
      {/* Search Bar */}
      <div className="relative mb-6 w-64">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-gray-200 bg-gray-100 py-2 pr-4 pl-10 text-sm focus:ring-1 focus:ring-amber-500 focus:outline-none"
        />
      </div>

      {/* Credentials Heading */}
      <h2 className="mb-4 text-lg font-medium text-gray-700">Credentials</h2>
      {!isLoading && (isError || filteredCredentials?.length === 0) && (
        <DefaultEmptyBox message="No credentials found." className="w-full" />
      )}
      {/* Credentials Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {/* Credential Cards */}
        {isLoading && <SkeletonMultiplier Skeleton={CredentialMiniBoxSkeleton} multiplier={8} />}
        {!isLoading &&
          !isError &&
          filteredCredentials.length > 0 &&
          filteredCredentials?.map((credential) => (
            <CredentialMiniBox
              key={credential.entityId}
              credential={credential}
              onClick={() => setSelectedCredential(credential)}
            />
          ))}
      </div>
      {selectedCredential && (
        <CredentialDetailModal
          credential={selectedCredential}
          onClose={() => setSelectedCredential(null)}
        />
      )}
    </>
  );
}
