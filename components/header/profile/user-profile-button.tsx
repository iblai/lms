'use client';

import { UserProfileDropdown } from '@iblai/iblai-js/web-containers/next';
import { getTenant, getUserName, handleLogout, handleTenantSwitch } from '@/utils/helpers';
import { Tenant } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';
import { useCurrentTenant, useIsAdmin, useUserTenants } from '@/utils/localstorage';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { selectRbacPermissions, updateRbacPermissions } from '@/features/rbac';

export const UserProfileButton = () => {
  const username = getUserName();
  const tenantKey = getTenant();
  const { currentTenant, saveCurrentTenant } = useCurrentTenant();
  const { userTenants = [], saveUserTenants } = useUserTenants();
  const isAdmin = useIsAdmin();
  const rbackPermissions = useAppSelector(selectRbacPermissions);
  const dispatch = useAppDispatch();

  const handleTenantChange = (newTenantKey: string) => {
    handleTenantSwitch(newTenantKey);
  };

  const handleHelpClick = (url: string) => {
    window.open(url, '_blank');
  };

  const handleTenantUpdate = (tenant: Tenant) => {
    saveCurrentTenant(tenant);
    const updatedTenants = userTenants.map((t) => {
      if (t.key === tenant.key) {
        return tenant;
      } else {
        return t;
      }
    });
    saveUserTenants(updatedTenants);
  };

  const handleLoadGroupPermissions = (permissions: Record<string, unknown>) => {
    dispatch(updateRbacPermissions(permissions ?? {}));
  };

  return (
    <UserProfileDropdown
      // User data
      username={username || undefined}
      userIsAdmin={isAdmin}
      userIsStudent={false}
      // Tenant data
      tenantKey={tenantKey}
      mentorId={undefined} // Skills app doesn't have mentor concept
      currentTenant={currentTenant || undefined}
      userTenants={userTenants}
      // Configuration
      showProfileTab={true}
      showAccountTab={false} // Skills app doesn't have account tab
      showTenantSwitcher={isAdmin}
      showHelpLink={false} // Skills app doesn't have help link in dropdown
      showLogoutButton={true}
      showLearnerModeSwitch={false} // Skills app doesn't have learner mode switch
      currentSPA={config.settings.appName() || 'skills'}
      // Customization
      helpCenterUrl=""
      enableGravatarOnProfilePic={true}
      // Callbacks
      onLogout={handleLogout}
      onTenantChange={handleTenantChange}
      onHelpClick={handleHelpClick}
      // Modal props
      billingEnabled={false}
      billingURL=""
      topUpEnabled={false}
      topUpURL=""
      currentPlan=""
      // Custom components
      LearnerModeSwitchComponent={undefined}
      // Additional data
      metadata={undefined}
      metadataLoaded={false}
      // Customization
      showMentorAIDisplayCheckbox={true}
      showLeaderboardDisplayCheckbox={true}
      showUsernameField={false}
      showPlatformName={false}
      enableCatalogInvite={true}
      authURL={config.urls.auth()}
      onTenantUpdate={handleTenantUpdate}
      currentPlatformBaseDomain={config.settings.platformBaseDomain() || ''}
      rbacPermissions={rbackPermissions}
      enableRbac={config.settings.enableRBAC()}
      onLoadGroupPermissions={handleLoadGroupPermissions}
    />
  );
};
