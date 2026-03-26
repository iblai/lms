import { getUserId, getUserName } from '@/utils/helpers';
// @ts-ignore
import { useCreateCatalogRoleMutation } from '@iblai/iblai-js/data-layer';
import { DesiredRoleCreateUpdateRequest } from '@iblai/iblai-api';
import { toast } from 'sonner';

export const useProfileRoles = (showToast: boolean = true) => {
  const [createCatalogRole, { isError: isCreatingCatalogRoleError }] =
    useCreateCatalogRoleMutation();

  const handleDesiredRolesCreate = async (roles: DesiredRoleCreateUpdateRequest) => {
    try {
      await createCatalogRole({
        //@ts-ignore
        requestBody: roles,
        userId: getUserId(),
        username: getUserName(),
      });
      if (isCreatingCatalogRoleError) {
        throw new Error('Failed to create roles');
      }
      if (showToast) {
        toast.success('Roles created successfully');
      }
      return true;
    } catch (error) {
      toast.error('Failed to create roles');
      return false;
    }
  };

  return {
    handleDesiredRolesCreate,
  };
};
