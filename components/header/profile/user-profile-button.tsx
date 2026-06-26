'use client';

import { UserProfileDropdown } from '@iblai/iblai-js/web-containers/next';
import {
  getTenant,
  getUserName,
  handleLogout,
  handleTenantSwitch,
  onAccountDeleted,
  getUserEmail,
} from '@/utils/helpers';
import { Tenant, useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { config } from '@/lib/config';
import { useCurrentTenant, useIsAdmin, useUserTenants } from '@/utils/localstorage';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { selectRbacPermissions, updateRbacPermissions } from '@/features/rbac';

export const UserProfileButton = () => {
  const username = getUserName();
  const email = getUserEmail();
  const tenantKey = getTenant();
  const { currentTenant, saveCurrentTenant } = useCurrentTenant();
  const { userTenants = [], saveUserTenants } = useUserTenants();
  const { metadata } = useTenantMetadata({ org: tenantKey });
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
      email={email}
      mainPlatformKey={config.settings.mainPlatformKey()}
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
      enableGravatarOnProfilePic={config.settings.enableGravatarOnProfilePic() !== 'false'}
      // Callbacks
      onLogout={handleLogout}
      onTenantChange={handleTenantChange}
      onHelpClick={handleHelpClick}
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
      onAccountDeleted={() => {
        onAccountDeleted();
      }}
      enableMemoryTab={true}
      defaultSupportPhone={
        metadata?.support_phone_number || config.settings.defaultSupportPhoneNumber()
      }
      enableSupportPhone={config.settings.enableSupportPhone()}
    />
  );
};
