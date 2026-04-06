import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserMetadata } from '@/hooks/users/use-usermetadata';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';
import { getInitials } from '@iblai/iblai-js/web-utils';
import Gravatar from 'react-gravatar';

export const UserAvatar = ({
  size = 32,
  containerClassName = '',
}: {
  size?: number;
  containerClassName?: string;
}) => {
  const { userMetaData, userMetaDataLoading } = useUserMetadata();
  const enableGravatarOnProfilePic = config.settings.enableGravatarOnProfilePic() !== 'false';
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
          ) : enableGravatarOnProfilePic ? (
            <Gravatar className="w-full" email={userMetaData?.email} size={size} />
          ) : (
            <></>
          )}
          <AvatarFallback
            className={cn(
              enableGravatarOnProfilePic && !userMetaData?.profile_image?.has_image ? 'hidden' : '',
            )}
          >
            {getInitials(userMetaData?.name || userMetaData?.username || userMetaData?.email || '')}
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );
};
