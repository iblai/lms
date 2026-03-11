
import { getUserName } from "@/utils/helpers";
// @ts-ignore
import { useGetUserMetadataQuery } from "@iblai/iblai-js/data-layer";

export const useUserMetadata = () => {
  const username = getUserName();
  const {
    data: userMetaData,
    isLoading: userMetaDataLoading,
    isError: userMetaDataError,
  } = useGetUserMetadataQuery({
    params: {
      username,
    }},
    {
      skip: !username,
    },
  );
  return { userMetaData, userMetaDataLoading, userMetaDataError };
};
