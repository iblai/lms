'use client';

import { UserProfileDropdown } from '@iblai/iblai-js/web-containers/next';
import {
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
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useLearnerMode } from '@/hooks/use-learner-mode';
import { LearnerModeSwitch } from '@/components/header/learner-mode-switch';

export const UserProfileButton = () => {
  const username = getUserName();
  const email = getUserEmail();
  const tenantKey = useTenantParam();
  const { currentTenant, saveCurrentTenant } = useCurrentTenant();
  const { userTenants = [], saveUserTenants } = useUserTenants();
  const { metadata, metadataLoaded } = useTenantMetadata({ org: tenantKey });
  const isAdmin = useIsAdmin();
  // Same admin signal as the navbar's inline switch, so the two never disagree.
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery({
    platform_key: tenantKey,
  });
  const isPlatformAdmin = departmentMemberCheck?.is_platform_admin === true;
  const { isInstructorMode } = useLearnerMode();
  const rbackPermissions = useAppSelector(selectRbacPermissions);
  const dispatch = useAppDispatch();
  const onboardingBasePath = window.location.origin + `/platform/${tenantKey}`;

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
      userIsStudent={!isInstructorMode}
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
      showTenantSwitcher={
        isAdmin || userTenants.some((t) => t.key !== 'main' && t.key !== tenantKey)
      }
      showHelpLink={true}
      showLogoutButton={true}
      showLearnerModeSwitch={isPlatformAdmin}
      currentSPA={config.settings.appName() || 'skills'}
      showGradebookTab={true}
      // Customization
      helpCenterUrl={config.settings.helpCenterUrl()}
      enableGravatarOnProfilePic={config.settings.enableGravatarOnProfilePic() !== 'false'}
      // Callbacks
      onLogout={handleLogout}
      onTenantChange={handleTenantChange}
      onHelpClick={handleHelpClick}
      // Custom components
      LearnerModeSwitchComponent={LearnerModeSwitch}
      // Additional data
      metadata={metadata}
      metadataLoaded={metadataLoaded}
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
      onboardingBasePath={onboardingBasePath}
    />
  );
};
