import { getTenant, getUserName } from '@/utils/helpers';
import {
  // @ts-ignore
  useLazyGetUsersAsAssertionsQuery,
  // @ts-ignore
  useUploadCredentialImageMutation,
  // @ts-ignore
  useCreateCredentialAssertionMutation,
  // @ts-ignore
  useCreateCredentialMutation,
  // @ts-ignore
  useUpdateCredentialMutation,
  // @ts-ignore
  useDeleteCourseCredentialMutation,
  // @ts-ignore
  useLazyGetIssuersQuery,
  // @ts-ignore
  useLazyGetCredentialsListQuery,
  // @ts-ignore
  IssuersResponse,
  // @ts-ignore
  CredentialsResponse,
} from '@iblai/iblai-js/data-layer';
import {
  Assertion,
  PaginatedAssertionsResponse,
  UploadedImage,
  Credential,
  Issuer,
} from '@iblai/iblai-api';
import { useState } from 'react';

export const useCredentials = () => {
  const [getUsersAsAssertions] = useLazyGetUsersAsAssertionsQuery();
  const [uploadCredentialImage] = useUploadCredentialImageMutation();
  const [createCredentialAssertion] = useCreateCredentialAssertionMutation();
  const [createCredential] = useCreateCredentialMutation();
  const [updateCredential] = useUpdateCredentialMutation();
  const [deleteCredential] = useDeleteCourseCredentialMutation();
  const [getIssuers] = useLazyGetIssuersQuery();
  const [getCredentialsList] = useLazyGetCredentialsListQuery();

  const [credentials, setCredentials] = useState<CredentialsResponse>({
    result: { data: [], count: 0, num_pages: 0, page_number: 0 },
  });
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [issuers, setIssuers] = useState<any[]>([]);
  const [isLoadingIssuers, setIsLoadingIssuers] = useState(false);

  const handleFetchUsersAsAssertionsForCourse = async (
    courseId: string,
  ): Promise<PaginatedAssertionsResponse | null> => {
    try {
      const usersAsAssertions = await getUsersAsAssertions({
        platformKey: getTenant(),
        username: getUserName(),
        course: courseId,
      }).unwrap();
      return usersAsAssertions;
    } catch (error) {
      console.error('Error fetching users as assertions:', error);
      return null;
    }
  };

  const handleImageUploadForCredentials = async (image: File): Promise<UploadedImage | null> => {
    const formData = new FormData();
    formData.append('image', image);
    try {
      const imageUpload = await uploadCredentialImage({
        org: getTenant(),
        username: getUserName(),
        formData,
      }).unwrap();
      return imageUpload as UploadedImage;
    } catch (error) {
      console.error('Error uploading image for credentials:', error);
      return null;
    }
  };

  const handleCreateCredentialAssertion = async (
    entityId: string,
    requestBody: Assertion,
  ): Promise<Assertion | null> => {
    try {
      const credentialAssertion = await createCredentialAssertion({
        platformKey: getTenant(),
        username: getUserName(),
        entityId,
        requestBody,
      }).unwrap();
      return credentialAssertion;
    } catch (error) {
      console.error('Error creating credential assertion:', error);
      return null;
    }
  };

  const handleFetchCredentials = async (
    courseId?: string,
    page: number = 1,
    pageSize: number = 10,
    search?: string,
  ): Promise<any | null> => {
    setIsLoadingCredentials(true);
    try {
      const response = await getCredentialsList({
        platformKey: getTenant(),
        username: getUserName(),
        course: courseId,
        page,
        pageSize,
        search,
      }).unwrap();
      setCredentials(response);
      return response;
    } catch (error) {
      console.error('Error fetching credentials:', error);
      setCredentials({ result: { data: [], count: 0, num_pages: 0, page_number: 0 } });
      return null;
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const handleCreateCredential = async (requestBody: any): Promise<Credential | null> => {
    try {
      const credential = await createCredential({
        platformKey: getTenant(),
        username: getUserName(),
        requestBody,
      }).unwrap();
      return credential;
    } catch (error) {
      console.error('Error creating credential:', error);
      return null;
    }
  };

  const handleUpdateCredential = async (
    entityId: string,
    requestBody: any,
  ): Promise<Credential | null> => {
    try {
      const credential = await updateCredential({
        platformKey: getTenant(),
        username: getUserName(),
        entityId,
        requestBody,
      }).unwrap();
      return credential;
    } catch (error) {
      console.error('Error updating credential:', error);
      return null;
    }
  };

  const handleDeleteCredential = async (entityId: string): Promise<boolean> => {
    try {
      await deleteCredential({
        platformKey: getTenant(),
        username: getUserName(),
        entityId,
      }).unwrap();
      return true;
    } catch (error) {
      console.error('Error deleting credential:', error);
      return false;
    }
  };

  const handleFetchIssuers = async (q?: string): Promise<Issuer[] | null> => {
    setIsLoadingIssuers(true);
    try {
      const response = (await getIssuers({
        org: getTenant(),
        username: getUserName(),
        q,
      }).unwrap()) as IssuersResponse;
      setIssuers(response.result.data || []);
      return response.result.data || [];
    } catch (error) {
      console.error('Error fetching issuers:', error);
      setIssuers([]);
      return null;
    } finally {
      setIsLoadingIssuers(false);
    }
  };

  return {
    handleFetchUsersAsAssertionsForCourse,
    handleImageUploadForCredentials,
    handleCreateCredentialAssertion,
    handleFetchCredentials,
    handleCreateCredential,
    handleUpdateCredential,
    handleDeleteCredential,
    handleFetchIssuers,
    credentials,
    isLoadingCredentials,
    issuers,
    isLoadingIssuers,
  };
};
