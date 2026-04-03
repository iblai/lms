import { CREDENTIAL_DEFAULT_IMG } from '@/constants/assets';
import { Assertion } from '@iblai/iblai-api';
import dayjs from 'dayjs';
import Image from 'next/image';

export const CredentialMiniBox = ({
  credential,
  onClick = () => {},
  minified = false,
  iconSize = 48,
}: {
  credential: Assertion;
  onClick?: () => void;
  minified?: boolean;
  iconSize?: number;
}) => {
  return (
    <div
      className="flex cursor-pointer items-start rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="mr-4 h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
        <Image
          src={credential.credentialDetails?.iconImage || CREDENTIAL_DEFAULT_IMG}
          alt={credential.credentialDetails?.name || 'Credential'}
          width={iconSize}
          height={iconSize}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-800">{credential.credentialDetails?.name}</h3>
        {!minified && <p className="text-xs text-gray-600">{credential.course.name}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Earned on: {credential.issuedOn ? dayjs(credential.issuedOn).format('MMM D, YYYY') : '-'}
        </p>
      </div>
    </div>
  );
};
