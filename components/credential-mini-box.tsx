import { CREDENTIAL_DEFAULT_IMG } from "@/constants/assets";
import { Assertion } from "@iblai/iblai-api";
import dayjs from "dayjs";
import Image from "next/image";

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
      className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow cursor-pointer flex items-start"
      onClick={onClick}
    >
      <div className="w-12 h-12 overflow-hidden rounded-full mr-4 flex-shrink-0">
        <Image
          src={
            credential.credentialDetails?.iconImage || CREDENTIAL_DEFAULT_IMG
          }
          alt={credential.credentialDetails?.name || "Credential"}
          width={iconSize}
          height={iconSize}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-800">
          {credential.credentialDetails?.name}
        </h3>
        {!minified && (
          <p className="text-xs text-gray-600">{credential.course.name}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Earned on:{" "}
          {credential.issuedOn
            ? dayjs(credential.issuedOn).format("MMM D, YYYY")
            : "-"}
        </p>
      </div>
    </div>
  );
};
