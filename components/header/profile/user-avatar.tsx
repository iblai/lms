import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserMetadata } from "@/hooks/users/use-usermetadata";
import { getInitials } from "@iblai/iblai-js/web-utils";
import Gravatar from "react-gravatar";

export const UserAvatar = ({
  size = 32,
  containerClassName = "",
}: {
  size?: number;
  containerClassName?: string;
}) => {
  const { userMetaData, userMetaDataLoading } = useUserMetadata();
  return (
    <Avatar className={containerClassName}>
      {userMetaDataLoading ? (
        <Skeleton className="h-8 w-8 rounded-full" />
      ) : (
        <>
          {userMetaData?.profile_image?.has_image ? (
            <AvatarImage
              src={userMetaData?.profile_image?.image_url_large}
              alt={userMetaData?.name}
              className="w-full"
            />
          ) : (
            <Gravatar
              className="w-full"
              email={userMetaData?.email}
              size={size}
            />
          )}
          <AvatarFallback>
            {getInitials(
              userMetaData?.name ||
                userMetaData?.username ||
                userMetaData?.email ||
                ""
            )}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );
};
