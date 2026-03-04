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

export default function CredentialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { filteredCredentials, isLoading, isError } = useProfileCredentials({
    search: searchQuery,
  });

  const [selectedCredential, setSelectedCredential] = useState<Assertion | null>(null);

  return (
    <>
      <div className="p-6 pt-8">
        {/* Search Bar */}
        <div className="relative w-64 mb-6">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* Credentials Heading */}
        <h2 className="text-lg font-medium text-gray-700 mb-4">
          Credentials ({filteredCredentials.length})
        </h2>
        {(!isLoading && isError) ||
          (!isLoading && !isError && filteredCredentials?.length === 0 && (
            <DefaultEmptyBox message="No credentials found." className="w-full" />
          ))}
        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
