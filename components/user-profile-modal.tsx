'use client';

import * as React from 'react';

import { Profile, InviteUserDialog, InvitedUsersDialog } from '@iblai/iblai-js/web-containers';
import { Dialog, DialogTitle, DialogContent } from '@/components/ui/dialog';
import { getTenant, getTenants, getUserName } from '@/utils/helpers';
import { config } from '@/lib/config';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const params = {
    tenantKey: getTenant(),
  };
  const [isInviteUserDialogOpen, setIsInviteUserDialogOpen] = React.useState(false);
  const [isInvitedUsersDialogOpen, setIsInvitedUsersDialogOpen] = React.useState(false);
  React.useEffect(() => {
    if (!isOpen) {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    }
  }, [isOpen]);
  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={() => {
          if (!isInviteUserDialogOpen) {
            onClose();
          }
        }}
      >
        <DialogTitle></DialogTitle>
        <DialogContent
          autoFocus={false}
          forceMount={true}
          aria-label="User Profile Modal"
          aria-describedby="user-profile-modal"
          className={`pointer-events-auto mx-auto h-[90vh] w-full overflow-hidden p-0 md:w-[90%] md:max-w-5xl`} // Add mx-auto to ensure consistent margins
        >
          <Profile
            //onInviteClick={() => setIsInviteUserDialogOpen(true)}
            tenant={params.tenantKey}
            tenants={getTenants()}
            username={getUserName()}
            onClose={() => {}}
            customization={{
              showMentorAIDisplayCheckbox: true,
              showLeaderboardDisplayCheckbox: true,
              showUsernameField: false,
              showPlatformName: false,
              useGravatarPicFallback: config.settings.enableGravatarOnProfilePic() !== 'false',
            }}
          />
          {isInviteUserDialogOpen && (
            <InviteUserDialog
              tenant={params.tenantKey}
              onClose={() => setIsInviteUserDialogOpen(false)}
              isOpen={isInviteUserDialogOpen}
              enableCatalogInvite={true}
              /* onSeeAllInvitedUsersClick={() =>
                setIsInvitedUsersDialogOpen(true)
              } */
            />
          )}
          {isInvitedUsersDialogOpen && (
            <InvitedUsersDialog
              onClose={() => setIsInvitedUsersDialogOpen(false)}
              tenant={params.tenantKey}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
