'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleUser,
  Coins,
  Folder,
  Globe2,
  KeyRound,
  Library,
  LineChart,
  Loader2,
  Mail,
  MessageSquare,
  Settings,
  SquarePen,
  Users,
  Workflow,
} from 'lucide-react';
import {
  Admin,
  AdvancedTab,
  BillingTab,
  IntegrationsTab,
  InviteUserDialog,
  MonetizationTab,
} from '@iblai/iblai-js/web-containers';
import { isLoggedIn, Tenant, useTenantMetadata } from '@iblai/iblai-js/web-utils';

import { cn } from '@/lib/utils';
import { config } from '@/lib/config';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useChatState } from '@/components/chat-button';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useGetDepartmentMemberCheckQuery } from '@/services/core';
import { useAppSelector } from '@/lib/hooks';
import { selectRbacPermissions } from '@/features/rbac';
import { checkRbacPermission } from '@/hoc';
import { getUserEmail, getUserName } from '@/utils/helpers';
import { canMonetize, useCurrentTenant, useUserTenants } from '@/utils/localstorage';

const NAV_MUTED = '#5f5f61';
const FLYOUT_TITLE_COLOR = '#646676';
const FLYOUT_ITEM_COLOR = '#1f1f20';
const NAV_DISABLED_COLOR = '#a0a0a5';
const NAV_ACTIVE_BG_OPEN =
  'data-[state=open]:bg-[#cfe8fa]/40 data-[state=open]:hover:bg-[#cfe8fa]/50';
const SIDEBAR_COOKIE = 'skills-sidebar:state';

type NavIcon = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}>;

type NavMenuItem = {
  id: string;
  label: string;
  href?: string;
  exact?: boolean;
  disabled?: boolean;
};

type NavMenuConfig = {
  id: string;
  label: string;
  icon: NavIcon;
  items: readonly NavMenuItem[];
};

type FooterAction = { id: string; label: string; icon: NavIcon };

type AccountTab = 'management' | 'integrations' | 'monetization' | 'advanced' | 'billing';

function SidebarCollapsedLabelFlyout({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <HoverCard openDelay={180} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={10}
        className="z-[200] w-max max-w-[280px] min-w-[120px] rounded-2xl border border-[#e6e6e8] bg-white px-3 py-2.5 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)]"
      >
        <span
          className="text-[13px] leading-tight font-medium"
          style={{ color: FLYOUT_TITLE_COLOR }}
        >
          {label}
        </span>
      </HoverCardContent>
    </HoverCard>
  );
}

function SidebarNavDivider({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      role="separator"
      aria-hidden
      className={cn('h-px shrink-0 bg-[#e9e9ea]', collapsed ? 'my-1.5 w-6' : 'my-2 w-full')}
    />
  );
}

function useActivePath(href: string | undefined, exact?: boolean) {
  const pathname = usePathname();
  return React.useMemo(() => {
    if (!pathname || !href) return false;
    const target = href.split('?')[0];
    const normalizedHref = target.endsWith('/') ? target.slice(0, -1) : target;
    const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    if (exact) return normalizedPath === normalizedHref;
    return normalizedPath === normalizedHref || normalizedPath.startsWith(`${normalizedHref}/`);
  }, [href, pathname, exact]);
}

function CollapsibleSubNavItem({ label, href, exact, disabled }: NavMenuItem) {
  const router = useRouter();
  const active = useActivePath(href, exact) && !disabled;
  const [isPending, startTransition] = React.useTransition();

  if (disabled) {
    return (
      <span className="flex w-full min-w-0 cursor-default items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] font-normal text-[#a0a0a5] italic">
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      aria-busy={isPending}
      className={cn(
        'flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-[14px] font-normal transition-colors',
        active ? 'bg-[#eef6fc] text-[#1e40af]' : 'text-[#4a5568] hover:bg-[#f4f4f4]',
        isPending && 'opacity-70',
      )}
      onClick={() => href && startTransition(() => router.push(href))}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {isPending && (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-[#7d7e82]" aria-hidden />
      )}
    </button>
  );
}

function CollapsedNavFlyout({
  icon: Icon,
  label,
  items,
  onIconClick,
}: {
  icon: NavIcon;
  label: string;
  items: readonly NavMenuItem[];
  onIconClick?: () => void;
}) {
  const router = useRouter();
  return (
    <HoverCard openDelay={180} closeDelay={120}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={onIconClick}
          className="text-foreground inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] transition-colors outline-none hover:bg-[#f0f0f0] focus-visible:ring-2 focus-visible:ring-[#c4c4c8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]"
          aria-label={label}
        >
          <Icon className="size-4 shrink-0" style={{ color: NAV_MUTED }} strokeWidth={1.5} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={10}
        className="z-[200] flex max-h-[70vh] w-max max-w-[280px] min-w-[200px] flex-col rounded-2xl border border-[#e6e6e8] bg-white px-3 py-2.5 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)]"
      >
        <div className="mb-1.5 flex shrink-0 flex-wrap items-center gap-2">
          <span
            className="text-[13px] leading-tight font-medium"
            style={{ color: FLYOUT_TITLE_COLOR }}
          >
            {label}
          </span>
        </div>
        <ul className="m-0 min-h-0 list-none space-y-0 overflow-y-auto p-0 pr-1">
          {items.map((item) =>
            item.disabled ? (
              <li key={item.id}>
                <span
                  className="flex w-full cursor-default rounded-md px-1.5 py-1.5 text-left text-[14px] leading-snug font-medium italic"
                  style={{ color: NAV_DISABLED_COLOR }}
                >
                  {item.label}
                </span>
              </li>
            ) : (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => item.href && router.push(item.href)}
                  className="flex w-full cursor-pointer rounded-md px-1.5 py-1.5 text-left text-[14px] leading-snug font-medium transition-colors hover:bg-[#f4f4f4]"
                  style={{ color: FLYOUT_ITEM_COLOR }}
                >
                  {item.label}
                </button>
              </li>
            ),
          )}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

function SidebarNavCollapsibleSection({
  collapsed,
  menu,
  open,
  onOpenChange,
  onCollapsedIconClick,
}: {
  collapsed: boolean;
  menu: NavMenuConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollapsedIconClick?: () => void;
}) {
  const Icon = menu.icon;

  if (collapsed) {
    return (
      <CollapsedNavFlyout
        icon={Icon}
        label={menu.label}
        items={menu.items}
        onIconClick={onCollapsedIconClick}
      />
    );
  }

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="w-full">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-[14px] font-normal text-[#5f5f61] transition-colors outline-none hover:bg-[#f4f4f4] focus-visible:ring-2 focus-visible:ring-[#cfe8fa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafafa]',
            NAV_ACTIVE_BG_OPEN,
          )}
        >
          <Icon className="size-4 shrink-0" style={{ color: NAV_MUTED }} strokeWidth={1.5} />
          <span className="min-w-0 flex-1 truncate">{menu.label}</span>
          {open ? (
            <ChevronDown className="size-4 shrink-0 text-[#7d7e82]" aria-hidden />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-[#7d7e82]" aria-hidden />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden">
        <div className="mt-0.5 mr-1 ml-1.5 border-l-2 border-[#e2e8f0] pb-0.5 pl-2.5">
          <ul className="flex flex-col gap-0.5" role="list">
            {menu.items.map((item) => (
              <li key={item.id}>
                <CollapsibleSubNavItem {...item} />
              </li>
            ))}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarDisabledItem({
  collapsed,
  label,
  icon: Icon,
}: {
  collapsed: boolean;
  label: string;
  icon: NavIcon;
}) {
  if (collapsed) {
    return (
      <SidebarCollapsedLabelFlyout label={label}>
        <span
          aria-disabled
          className="inline-flex size-8 shrink-0 cursor-default items-center justify-center rounded-[8px]"
        >
          <Icon
            className="size-4 shrink-0"
            style={{ color: NAV_DISABLED_COLOR }}
            strokeWidth={1.5}
          />
        </span>
      </SidebarCollapsedLabelFlyout>
    );
  }

  return (
    <span
      aria-disabled
      className="flex h-9 w-full min-w-0 cursor-default items-center gap-2 rounded-md px-2 text-left text-[14px] font-normal italic"
      style={{ color: NAV_DISABLED_COLOR }}
    >
      <Icon className="size-4 shrink-0" style={{ color: NAV_DISABLED_COLOR }} strokeWidth={1.5} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </span>
  );
}

function NewChatButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  if (collapsed) {
    return (
      <SidebarCollapsedLabelFlyout label="New Chat">
        <button
          type="button"
          onClick={onClick}
          aria-label="New chat"
          className="text-foreground inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] border border-[#e0e0e2] bg-white transition-colors hover:bg-[#f8f8f9]"
        >
          <SquarePen className="size-4 shrink-0" strokeWidth={1.5} />
        </button>
      </SidebarCollapsedLabelFlyout>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-full cursor-pointer items-center justify-start gap-2 rounded-[8px] border border-[#e0e0e2] bg-white px-2 text-[14px] font-normal text-[#687482] antialiased transition-colors hover:bg-[#f8f8f9] active:bg-[#f2f2f3]"
    >
      <SquarePen className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <span>New Chat</span>
    </button>
  );
}

const COLLAPSE_ICON = (
  <svg
    width={20}
    height={20}
    viewBox="0 0 20 20"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
    aria-hidden
  >
    <path d="M16.5 4A1.5 1.5 0 0 1 18 5.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14.5v-9A1.5 1.5 0 0 1 3.5 4zM7 15h9.5a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5H7zM3.5 5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5H6V5z" />
  </svg>
);

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const tenant = useTenantParam();
  const username = getUserName();
  const userEmail = getUserEmail();

  const { currentTenant } = useCurrentTenant();
  const { userTenants } = useUserTenants();
  const rbacPermissions = useAppSelector(selectRbacPermissions);
  const { setIsOpen } = useChatState();
  const { isMentorAIEnabled } = useTenantMetadata({ org: tenant });
  const { data: departmentMemberCheck } = useGetDepartmentMemberCheckQuery(
    { platform_key: tenant },
    { skip: !tenant },
  );

  const [expanded, setExpanded] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [accountTab, setAccountTab] = React.useState<AccountTab | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  React.useEffect(() => {
    const match = document.cookie.match(/(?:^|; )skills-sidebar:state=([^;]+)/);
    if (match) setExpanded(match[1] === 'expanded');
  }, []);

  React.useEffect(() => {
    if (!pathname) return;
    if (pathname.includes('/analytics')) setOpenSection('analytics');
    else if (pathname.includes('/profile/courses') || pathname.includes('/discover'))
      setOpenSection('catalog');
    else if (pathname.includes('/profile')) setOpenSection('profile');
  }, [pathname]);

  const toggleSidebar = React.useCallback(() => {
    setExpanded((value) => {
      const next = !value;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? 'expanded' : 'collapsed'}; path=/; max-age=${60 * 60 * 24 * 7}`;
      return next;
    });
  }, []);

  const railCollapsed = !expanded;
  const isPlatformAdmin = !!departmentMemberCheck?.is_platform_admin;
  const profileBase = `/platform/${tenant}/profile`;

  const catalogMenu = React.useMemo<NavMenuConfig>(
    () => ({
      id: 'catalog',
      label: 'Catalog',
      icon: Library,
      items: [
        { id: 'catalog-new-course', label: 'New Course', href: `/platform/${tenant}/discover` },
        { id: 'catalog-my-catalog', label: 'My Catalog', href: `${profileBase}/courses` },
        { id: 'catalog-explore', label: 'Explore', disabled: true },
      ],
    }),
    [tenant, profileBase],
  );

  const profileMenu = React.useMemo<NavMenuConfig>(
    () => ({
      id: 'profile',
      label: 'Profile',
      icon: CircleUser,
      items: [
        { id: 'profile-activity', label: 'Activity', href: profileBase, exact: true },
        { id: 'profile-skills', label: 'Skills', href: `${profileBase}/skills` },
        { id: 'profile-credentials', label: 'Credentials', href: `${profileBase}/credentials` },
        { id: 'profile-public', label: 'Public', href: `${profileBase}/public` },
      ],
    }),
    [profileBase],
  );

  const agentsMenu = React.useMemo<NavMenuConfig>(
    () => ({
      id: 'agents',
      label: 'Agents',
      icon: Globe2,
      items: [
        { id: 'agents-new', label: 'New Agent', disabled: true },
        { id: 'agents-my', label: 'My Agents', disabled: true },
        { id: 'agents-explore', label: 'Explore', disabled: true },
      ],
    }),
    [],
  );

  const workflowsMenu = React.useMemo<NavMenuConfig>(
    () => ({
      id: 'workflows',
      label: 'Workflows',
      icon: Workflow,
      items: [
        { id: 'workflows-new', label: 'New Workflow', disabled: true },
        { id: 'workflows-my', label: 'My Workflows', disabled: true },
      ],
    }),
    [],
  );

  const analyticsMenu = React.useMemo<NavMenuConfig>(() => {
    const base = `/platform/${tenant}/analytics`;
    return {
      id: 'analytics',
      label: 'Analytics',
      icon: LineChart,
      items: [
        { id: 'analytics-overview', label: 'Overview', href: base, exact: true },
        { id: 'analytics-users', label: 'Users', href: `${base}/users` },
        { id: 'analytics-courses', label: 'Courses', href: `${base}/courses` },
        { id: 'analytics-programs', label: 'Programs', href: `${base}/programs` },
        { id: 'analytics-topics', label: 'Topics', href: `${base}/topics` },
        { id: 'analytics-transcripts', label: 'Transcripts', href: `${base}/transcripts` },
        { id: 'analytics-costs', label: 'Costs', href: `${base}/financial` },
        { id: 'analytics-audit', label: 'Audit', href: `${base}/audit` },
        { id: 'analytics-reports', label: 'Data Reports', href: `${base}/reports` },
      ],
    };
  }, [tenant]);

  const chatAllowed = config.settings.mentorEnabled() && Boolean(isMentorAIEnabled?.());

  const analyticsAllowed =
    config.settings.aiAnalyticsHeaderMenuEnabled() &&
    checkRbacPermission(rbacPermissions, `/platforms/${tenant}/#can_view_analytics`);

  const monetizeAllowed =
    isPlatformAdmin && canMonetize(currentTenant as Tenant, (userTenants ?? []) as Tenant[]);

  const footerActions = React.useMemo<FooterAction[]>(() => {
    const actions: FooterAction[] = [
      { id: 'footer-notifications', label: 'Notifications', icon: Bell },
    ];
    if (isPlatformAdmin) {
      actions.push({ id: 'footer-invites', label: 'Invites', icon: Mail });
      actions.push({ id: 'footer-users', label: 'Management', icon: Users });
      actions.push({ id: 'footer-api', label: 'Integrations', icon: KeyRound });
      if (monetizeAllowed) {
        actions.push({ id: 'footer-monetization', label: 'Monetization', icon: Coins });
      }
      actions.push({ id: 'footer-settings', label: 'Advanced', icon: Settings });
    }
    return actions;
  }, [isPlatformAdmin, monetizeAllowed]);

  const handleFooterActionClick = (actionId: string) => {
    switch (actionId) {
      case 'footer-notifications':
        router.push(`/platform/${tenant}/notifications`);
        return;
      case 'footer-invites':
        setInviteOpen(true);
        return;
      case 'footer-users':
        setAccountTab('management');
        return;
      case 'footer-api':
        setAccountTab('integrations');
        return;
      case 'footer-monetization':
        setAccountTab('monetization');
        return;
      case 'footer-settings':
        setAccountTab('advanced');
        return;
    }
  };

  const handleSectionChange = (id: string) => (open: boolean) => setOpenSection(open ? id : null);

  const expandToSection = (id: string) => {
    if (!expanded) toggleSidebar();
    setOpenSection(id);
  };

  const openChat = () => setIsOpen(true);

  if (!isLoggedIn()) return null;

  const sections = (collapsed: boolean) => (
    <>
      {chatAllowed && <NewChatButton collapsed={collapsed} onClick={openChat} />}
      <SidebarNavCollapsibleSection
        collapsed={collapsed}
        menu={agentsMenu}
        open={openSection === 'agents'}
        onOpenChange={handleSectionChange('agents')}
        onCollapsedIconClick={() => expandToSection('agents')}
      />
      <SidebarNavCollapsibleSection
        collapsed={collapsed}
        menu={catalogMenu}
        open={openSection === 'catalog'}
        onOpenChange={handleSectionChange('catalog')}
        onCollapsedIconClick={() => expandToSection('catalog')}
      />
      <SidebarNavCollapsibleSection
        collapsed={collapsed}
        menu={workflowsMenu}
        open={openSection === 'workflows'}
        onOpenChange={handleSectionChange('workflows')}
        onCollapsedIconClick={() => expandToSection('workflows')}
      />
      <SidebarNavDivider collapsed={collapsed} />
      <SidebarNavCollapsibleSection
        collapsed={collapsed}
        menu={profileMenu}
        open={openSection === 'profile'}
        onOpenChange={handleSectionChange('profile')}
        onCollapsedIconClick={() => expandToSection('profile')}
      />
      <SidebarDisabledItem collapsed={collapsed} label="Chats" icon={MessageSquare} />
      <SidebarDisabledItem collapsed={collapsed} label="Projects" icon={Folder} />
      {analyticsAllowed && (
        <SidebarNavCollapsibleSection
          collapsed={collapsed}
          menu={analyticsMenu}
          open={openSection === 'analytics'}
          onOpenChange={handleSectionChange('analytics')}
          onCollapsedIconClick={() => expandToSection('analytics')}
        />
      )}
    </>
  );

  return (
    <>
      <aside
        data-state={railCollapsed ? 'collapsed' : 'expanded'}
        className={cn(
          'hidden h-full shrink-0 flex-col border-r border-[#e9e9ea] bg-[#fafafa] transition-[width] duration-200 ease-linear md:flex',
          railCollapsed ? 'w-[65px]' : 'w-[260px]',
        )}
      >
        <div
          className={cn(
            'shrink-0',
            railCollapsed ? 'px-2 pt-[18px] pb-[25px]' : 'px-[10px] py-[10px]',
          )}
        >
          <div
            className={cn(
              'flex items-center font-sans',
              railCollapsed ? 'justify-center px-0' : 'justify-end px-1',
            )}
          >
            <SidebarCollapsedLabelFlyout label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}>
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md font-sans text-[#7d7e82] transition-colors hover:bg-[#f0f0f0]"
                aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-expanded={expanded}
              >
                {COLLAPSE_ICON}
              </button>
            </SidebarCollapsedLabelFlyout>
          </div>
        </div>

        {railCollapsed ? (
          <nav
            className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto px-2 pt-1 pb-2"
            aria-label="Main navigation"
          >
            {sections(true)}
          </nav>
        ) : (
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 pt-1 pb-2">
            <div className="space-y-0.5">{sections(false)}</div>
          </nav>
        )}

        {railCollapsed ? (
          <div className="flex shrink-0 flex-col items-center gap-0.5 border-t border-[#e2e8f0] px-2 py-3">
            {footerActions.map((action) => {
              const Icon = action.icon;
              return (
                <SidebarCollapsedLabelFlyout key={action.id} label={action.label}>
                  <button
                    type="button"
                    className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-[#5f5f61] transition-colors hover:bg-[#f0f0f0]"
                    aria-label={action.label}
                    onClick={() => handleFooterActionClick(action.id)}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                  </button>
                </SidebarCollapsedLabelFlyout>
              );
            })}
            <SidebarCollapsedLabelFlyout label="Support">
              <a
                href="https://ibl.ai/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-10 items-center justify-center rounded-lg text-[#5f5f61] transition-colors hover:bg-[#f0f0f0]"
                aria-label="Support"
              >
                <BookOpen className="size-4 shrink-0" strokeWidth={1.5} />
              </a>
            </SidebarCollapsedLabelFlyout>
          </div>
        ) : (
          <div className="shrink-0 space-y-0.5 border-t border-[#e2e8f0] px-2 py-2">
            {footerActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  className="flex h-9 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 text-left text-[14px] font-normal text-[#5f5f61] transition-colors hover:bg-[#f4f4f4]"
                  onClick={() => handleFooterActionClick(action.id)}
                >
                  <Icon
                    className="size-4 shrink-0"
                    style={{ color: NAV_MUTED }}
                    strokeWidth={1.5}
                  />
                  <span className="min-w-0 flex-1 truncate">{action.label}</span>
                </button>
              );
            })}
            <a
              href="https://ibl.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-[14px] font-normal text-[#5f5f61] transition-colors hover:bg-[#f4f4f4]"
            >
              <BookOpen
                className="size-4 shrink-0"
                style={{ color: NAV_MUTED }}
                strokeWidth={1.5}
              />
              <span className="min-w-0 flex-1 truncate">Support</span>
            </a>
          </div>
        )}
      </aside>

      <AccountSheet
        tab={accountTab}
        onClose={() => setAccountTab(null)}
        tenantKey={tenant}
        username={username ?? ''}
        email={userEmail}
        onInviteClick={() => setInviteOpen(true)}
      />

      {inviteOpen && (
        <InviteUserDialog
          tenant={tenant}
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          enableCatalogInvite
          hasManageUsersPermission
        />
      )}
    </>
  );
}

const ACCOUNT_TAB_TITLES: Record<AccountTab, string> = {
  management: 'Management',
  integrations: 'Integrations',
  monetization: 'Monetization',
  advanced: 'Advanced',
  billing: 'Billing',
};

const ACCOUNT_TAB_DESCRIPTIONS: Record<AccountTab, string> = {
  management: 'Manage users and their permissions in the system.',
  integrations: 'Manage your integrations with other services.',
  monetization: 'Configure paywalls, pricing, and revenue.',
  advanced: 'Configure advanced organization settings.',
  billing: 'Manage your billing and subscription.',
};

function AccountSheet({
  tab,
  onClose,
  tenantKey,
  username,
  email,
  onInviteClick,
}: {
  tab: AccountTab | null;
  onClose: () => void;
  tenantKey: string;
  username: string;
  email: string;
  onInviteClick: () => void;
}) {
  return (
    <Dialog open={tab !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="mx-auto my-auto flex h-[90vh] w-[95vw] max-w-none flex-col justify-between gap-0 rounded-lg p-0 sm:max-w-7xl">
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 p-4 pt-[30px]">
          <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {tab ? ACCOUNT_TAB_TITLES[tab] : ''}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-gray-600">
            {tab ? ACCOUNT_TAB_DESCRIPTIONS[tab] : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {tab === 'management' && (
            <Admin
              tenant={tenantKey}
              onInviteClick={onInviteClick}
              hasUserTabPermission
              hasGroupsTabPermission
              hasRolesTabPermission
              hasPoliciesTabPermission
              hasTeamsTabPermission
              hasAlertsTabPermission
              hasInviteUserPermission
              hasCreateTeamPermission
              enableRbac={false}
              rbacPermissions={{}}
            />
          )}
          {tab === 'integrations' && <IntegrationsTab tenantKey={tenantKey} username={username} />}
          {tab === 'billing' && (
            <BillingTab
              tenant={tenantKey}
              username={username}
              mainPlatformKey={config.settings.mainPlatformKey()}
              currentUserEmail={email}
            />
          )}
          {tab === 'monetization' && (
            <MonetizationTab platformKey={tenantKey} authURL={config.urls.auth()} />
          )}
          {tab === 'advanced' && (
            <AdvancedTab
              platformKey={tenantKey}
              username={username}
              currentSPA={config.settings.appName() || 'skills'}
              authURL={config.urls.auth()}
              currentPlatformBaseDomain={config.settings.platformBaseDomain()}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
