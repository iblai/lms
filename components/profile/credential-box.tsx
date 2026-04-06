import { useProfileCredentials } from '@/hooks/profile/use-profile-credentials';
import { DefaultEmptyBox } from '../default-empty-box';
import { CredentialMiniBoxSkeleton } from '../skeleton-credential-mini-box';
import { SkeletonMultiplier } from '../skeleton-multiplier';
import { CredentialMiniBox } from '../credential-mini-box';

export const CredentialBox = () => {
  const { isLoading, isError, fetchedCredentials } = useProfileCredentials({
    search: '',
  });
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-medium text-gray-800">Credentials</h2>
      {(!isLoading && isError) ||
        (!isLoading && !isError && fetchedCredentials?.length === 0 && (
          <DefaultEmptyBox message="No credentials found." className="w-full" />
        ))}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isLoading && <SkeletonMultiplier Skeleton={CredentialMiniBoxSkeleton} multiplier={8} />}
        {!isLoading &&
          !isError &&
          fetchedCredentials.length > 0 &&
          fetchedCredentials?.map((credential) => (
            <CredentialMiniBox
              key={credential.entityId}
              credential={credential}
              //onClick={() => setSelectedCredential(credential)}
            />
          ))}
      </div>
    </div>
  );
};
