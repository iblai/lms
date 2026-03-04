
import { getUserName } from "@/utils/helpers";
import { useGetUserMetadataQuery } from "@iblai/iblai-js/data-layer";

export const useUserMetadata = () => {
  const {
    data: userMetaData,
    isLoading: userMetaDataLoading,
    isError: userMetaDataError,
  } = useGetUserMetadataQuery({
    params: {
      username: getUserName(),
    },
  });
  return { userMetaData, userMetaDataLoading, userMetaDataError };
};
