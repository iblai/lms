import { useEffect, useState } from 'react';
import { Program, ProgramCompletionResponse, ProgramEnrollmentPlus } from '@iblai/iblai-api';
import { useLazyGetAssignedProgramsQuery } from '@/services/catalog';
import {
  // @ts-ignore
  useLazyGetProgramCompletionQuery,
  // @ts-ignore
  useLazyGetProgramListQuery,
  // @ts-ignore
  useLazyGetUserEnrolledProgramsQuery,
} from '@iblai/iblai-js/data-layer';
import { getOrg, getRandomCourseImage, getUserId, getUserName } from '@/utils/helpers';
import { getTenant } from '@/utils/helpers';

export const useProfilePrograms = ({
  searchQuery,
  activeTab = 'enrolled',
}: {
  searchQuery: string;
  activeTab: 'enrolled' | 'assigned' | 'catalog';
}) => {
  const [programs, setPrograms] = useState<ProgramEnrollmentPlus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramEnrollmentPlus[]>([]);

  const [getProgramList, { isError: isCatalogProgramsError }] = useLazyGetProgramListQuery();

  const [getProgramCompletion] = useLazyGetProgramCompletionQuery();

  const [getUserEnrolledPrograms, { isError: isEnrolledProgramsError }] =
    useLazyGetUserEnrolledProgramsQuery();
  const [getAssignedPrograms, { isError: isAssignedProgramsError }] =
    useLazyGetAssignedProgramsQuery();

  const [programCompletions, setProgramCompletions] = useState<ProgramCompletionResponse[]>([]);
  const [programCompletionsLoading, setProgramCompletionsLoading] = useState(false);

  const handleFetchProgramCompletions = async (programs: ProgramEnrollmentPlus[]) => {
    setProgramCompletionsLoading(true);
    try {
      const programCompletions = await Promise.all(
        programs.map(async (program) => {
          const response = await getProgramCompletion(
            [
              {
                programKey: program.program_key || '',
                username: getUserName(),
              },
            ],
            true,
          );
          return response.data || {};
        }),
      );
      setProgramCompletions(programCompletions as ProgramCompletionResponse[]);
      setProgramCompletionsLoading(false);
    } catch (error) {
      console.error(JSON.stringify(error));
      setProgramCompletions([]);
      setProgramCompletionsLoading(false);
    }
  };

  const handleProgramEnrollmentFetch = async () => {
    setIsLoading(true);
    const response = await getUserEnrolledPrograms(
      [
        {
          userId: getUserId(),
          platformKey: getTenant(),
        },
      ],
      true,
    );
    const fetchedPrograms = response.data?.map((program: ProgramEnrollmentPlus) => ({
      ...program,
      metadata: {
        ...program.metadata,
        image: getRandomCourseImage(),
      },
    }));
    setPrograms(fetchedPrograms || []);
    setFilteredPrograms(fetchedPrograms || []);
    handleFetchProgramCompletions(fetchedPrograms || []);
    setIsError(isEnrolledProgramsError);
    setIsLoading(false);
  };

  const handleAssignedProgramsFetch = async () => {
    setIsLoading(true);
    const response = await getAssignedPrograms(
      {
        user_id: getUserId(),
      },
      true,
    );
    const fetchedPrograms = response.data?.results.map((program: ProgramEnrollmentPlus) => ({
      ...program,
      metadata: {
        ...program.metadata,
        image: getRandomCourseImage(),
      },
    }));
    setPrograms(fetchedPrograms || []);
    setFilteredPrograms(fetchedPrograms || []);
    handleFetchProgramCompletions(fetchedPrograms || []);
    setIsError(isAssignedProgramsError);
    setIsLoading(false);
  };

  const handleFetchCatalogPrograms = async () => {
    setIsLoading(true);
    const response = await getProgramList(
      [
        {
          org: getOrg(),
          username: getUserName(),
        },
      ],
      true,
    );
    const fetchedPrograms = response.data?.map((program: Program) => ({
      ...program,
      metadata: {
        ...program.metadata,
        image: getRandomCourseImage(),
      },
    }));
    setPrograms((fetchedPrograms as unknown as ProgramEnrollmentPlus[]) || []);
    setFilteredPrograms((fetchedPrograms as unknown as ProgramEnrollmentPlus[]) || []);
    handleFetchProgramCompletions((fetchedPrograms as unknown as ProgramEnrollmentPlus[]) || []);
    setIsError(isCatalogProgramsError);
    setIsLoading(false);
  };

  useEffect(() => {
    if (String(searchQuery).length > 2) {
      setFilteredPrograms(
        programs.filter((program) =>
          program?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );
    } else {
      setFilteredPrograms(programs);
    }
  }, [searchQuery]);

  useEffect(() => {
    switch (activeTab) {
      case 'assigned':
        handleAssignedProgramsFetch();
        break;
      case 'enrolled':
        handleProgramEnrollmentFetch();
        break;
      case 'catalog':
        handleFetchCatalogPrograms();
        break;
    }
  }, [activeTab]);
  return {
    programs,
    filteredPrograms,
    isLoading,
    isError,
    setFilteredPrograms,
    setPrograms,
    programCompletions,
    programCompletionsLoading,
  };
};
