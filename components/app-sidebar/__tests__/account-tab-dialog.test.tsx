import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const pages = vi.hoisted(() => {
  const page = (id: string) =>
    vi.fn((props: { onInviteClick?: () => void }) => (
      <div data-testid={`page-${id}`}>
        {props.onInviteClick && <button onClick={props.onInviteClick}>Invite</button>}
      </div>
    ));
  return {
    Admin: page('management'),
    ApiTab: page('api'),
    SecretsTab: page('secrets'),
    MonetizationTab: page('monetization'),
    AdvancedTab: page('advanced'),
  };
});

vi.mock('@iblai/iblai-js/web-containers', () => pages);

import {
  AccountTabDialog,
  type AccountTab,
  type AccountTabDialogProps,
} from '../account-tab-dialog';

const props: Omit<AccountTabDialogProps, 'tab'> = {
  onClose: vi.fn(),
  tenantKey: 'test-tenant',
  username: 'test-user',
  onInviteClick: vi.fn(),
  authUrl: 'https://auth.example.com',
  currentSpa: 'skills',
  platformBaseDomain: 'example.com',
  showGradebookTab: true,
  onboardingBasePath: 'https://lms.example.com/platform/test-tenant',
  rbacPermissions: { '/apitokens/': ['list'] },
  helpUrl: 'https://ibl.ai/support',
};

const lastProps = (component: keyof typeof pages) =>
  pages[component].mock.calls.at(-1)?.[0] as Record<string, unknown>;

describe('AccountTabDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing while no tab is chosen', () => {
    render(<AccountTabDialog tab={null} {...props} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each<[AccountTab, string, string]>([
    ['management', 'Management', 'Manage users and their permissions in the system.'],
    ['api', 'API', 'Let your own software work with ibl.ai.'],
    [
      'secrets',
      'Secrets',
      'Keys from other services, like OpenAI or Stripe, that ibl.ai and your agents use.',
    ],
    ['monetization', 'Monetization', 'Configure paywalls, pricing, and revenue.'],
    ['advanced', 'Advanced', 'Configure advanced organization settings.'],
  ])('opens %s on its own, with its title and description', (tab, title, description) => {
    render(<AccountTabDialog tab={tab} {...props} />);
    const dialog = screen.getByRole('dialog', { name: title });
    expect(dialog).toHaveAccessibleDescription(description);
    expect(screen.getAllByTestId(/^page-/)).toHaveLength(1);
    expect(screen.getByTestId(`page-${tab}`)).toBeInTheDocument();
  });

  it('gives Management every sub-tab with RBAC off and the invite action', () => {
    render(<AccountTabDialog tab="management" {...props} />);
    expect(lastProps('Admin')).toMatchObject({
      tenant: 'test-tenant',
      onboardingBasePath: props.onboardingBasePath,
      authSpaUrl: props.authUrl,
      currentSpa: 'skills',
      hasUserTabPermission: true,
      hasGroupsTabPermission: true,
      hasPoliciesTabPermission: true,
      hasRolesTabPermission: true,
      hasTeamsTabPermission: true,
      hasAlertsTabPermission: true,
      hasInviteUserPermission: true,
      hasCreateTeamPermission: true,
      rbacPermissions: props.rbacPermissions,
      enableRbac: false,
      showGradebookTab: true,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Invite' }));
    expect(props.onInviteClick).toHaveBeenCalledTimes(1);
  });

  it('passes the API page its help link and permissions', () => {
    render(<AccountTabDialog tab="api" {...props} />);
    expect(lastProps('ApiTab')).toMatchObject({
      tenantKey: 'test-tenant',
      username: 'test-user',
      enableRbac: false,
      rbacPermissions: props.rbacPermissions,
      helpUrl: 'https://ibl.ai/support',
    });
  });

  it('passes Secrets, Monetization and Advanced what they need', () => {
    const { rerender } = render(<AccountTabDialog tab="secrets" {...props} />);
    expect(lastProps('SecretsTab')).toMatchObject({
      tenantKey: 'test-tenant',
      username: 'test-user',
    });

    rerender(<AccountTabDialog tab="monetization" {...props} />);
    expect(lastProps('MonetizationTab')).toMatchObject({
      platformKey: 'test-tenant',
      authURL: props.authUrl,
    });

    rerender(<AccountTabDialog tab="advanced" {...props} />);
    expect(lastProps('AdvancedTab')).toMatchObject({
      platformKey: 'test-tenant',
      username: 'test-user',
      currentSPA: 'skills',
      authURL: props.authUrl,
      currentPlatformBaseDomain: 'example.com',
    });
  });

  it('closes from its Close button', () => {
    render(<AccountTabDialog tab="secrets" {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
