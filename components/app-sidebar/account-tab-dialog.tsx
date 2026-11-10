'use client';

import {
  Admin,
  AdvancedTab,
  ApiTab,
  MonetizationTab,
  SecretsTab,
} from '@iblai/iblai-js/web-containers';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type AccountTab = 'management' | 'api' | 'secrets' | 'monetization' | 'advanced';

// The same header the SDK's Account screen shows for these pages.
const TITLES: Record<AccountTab, string> = {
  management: 'Management',
  api: 'API',
  secrets: 'Secrets',
  monetization: 'Monetization',
  advanced: 'Advanced',
};

const DESCRIPTIONS: Record<AccountTab, string> = {
  management: 'Manage users and their permissions in the system.',
  api: 'Let your own software work with ibl.ai.',
  secrets: 'Keys from other services, like OpenAI or Stripe, that ibl.ai and your agents use.',
  monetization: 'Configure paywalls, pricing, and revenue.',
  advanced: 'Configure advanced organization settings.',
};

export type AccountTabDialogProps = {
  tab: AccountTab | null;
  onClose: () => void;
  tenantKey: string;
  username: string;
  onInviteClick: () => void;
  authUrl: string;
  currentSpa: string;
  platformBaseDomain: string;
  showGradebookTab: boolean;
  onboardingBasePath: string;
  rbacPermissions: object;
  helpUrl?: string;
};

/** Opens one organization page on its own, without the Account screen's side tabs. */
export function AccountTabDialog({
  tab,
  onClose,
  tenantKey,
  username,
  onInviteClick,
  authUrl,
  currentSpa,
  platformBaseDomain,
  showGradebookTab,
  onboardingBasePath,
  rbacPermissions,
  helpUrl,
}: AccountTabDialogProps) {
  return (
    <Dialog open={tab !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="mx-auto my-auto flex h-[90vh] w-[95vw] max-w-none flex-col justify-between gap-0 rounded-lg p-0 sm:max-w-7xl">
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 p-4 pt-[30px]">
          <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {tab ? TITLES[tab] : ''}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-gray-600">
            {tab ? DESCRIPTIONS[tab] : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {/* The Account sheet these pages came from ran with RBAC off, so every
              sub-tab showed for anyone the footer let in; that is kept as it was. */}
          {tab === 'management' && (
            <Admin
              tenant={tenantKey}
              onInviteClick={onInviteClick}
              onboardingBasePath={onboardingBasePath}
              authSpaUrl={authUrl}
              currentSpa={currentSpa}
              hasUserTabPermission
              hasGroupsTabPermission
              hasPoliciesTabPermission
              hasRolesTabPermission
              hasTeamsTabPermission
              hasAlertsTabPermission
              hasInviteUserPermission
              hasCreateTeamPermission
              rbacPermissions={rbacPermissions}
              enableRbac={false}
              showGradebookTab={showGradebookTab}
            />
          )}
          {tab === 'secrets' && <SecretsTab tenantKey={tenantKey} username={username} />}
          {tab === 'api' && (
            <ApiTab
              tenantKey={tenantKey}
              username={username}
              enableRbac={false}
              rbacPermissions={rbacPermissions}
              helpUrl={helpUrl}
            />
          )}
          {tab === 'monetization' && <MonetizationTab platformKey={tenantKey} authURL={authUrl} />}
          {tab === 'advanced' && (
            <AdvancedTab
              platformKey={tenantKey}
              username={username}
              currentSPA={currentSpa}
              authURL={authUrl}
              currentPlatformBaseDomain={platformBaseDomain}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
