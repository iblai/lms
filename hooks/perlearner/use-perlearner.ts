import { useGetUserPerLearnerInfoQuery } from "@/services/perlearner";
import { getOrg, getUserName } from "@/utils/helpers";

export function usePerLearnerInfoQuery() {
  const {
    data,
    isLoading: userPerLearnerInfoLoading,
    error: userPerLearnerInfoError,
  } = useGetUserPerLearnerInfoQuery({
    org: getOrg(),
    username: getUserName(),
    query: { meta: true },
  });

  return {
    userPerLearnerInfo: data?.data,
    userPerLearnerInfoLoading,
    userPerLearnerInfoError,
  };
}
