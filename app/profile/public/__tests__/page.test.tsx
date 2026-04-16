import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('lucide-react', () => ({
  Facebook: () => <span data-testid="facebook-icon">Facebook</span>,
  Linkedin: () => <span data-testid="linkedin-icon">Linkedin</span>,
  Twitter: () => <span data-testid="twitter-icon">Twitter</span>,
  Edit2: () => <span data-testid="edit2-icon">Edit2</span>,
  Edit: () => <span data-testid="edit-icon">Edit</span>,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
  onAccountDeleted: vi.fn(),
}));

vi.mock('@/lib/config', () => ({
  config: {
    settings: {
      enableGravatarOnProfilePic: vi.fn(() => 'true'),
      appName: vi.fn(() => 'skills'),
      platformBaseDomain: vi.fn(() => 'example.com'),
    },
    urls: {
      auth: vi.fn(() => 'https://auth.example.com'),
    },
  },
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadataLoaded: true,
    isSkillsResumeFeatureHidden: vi.fn(() => false),
  })),
}));

vi.mock('@/utils/localstorage', () => ({
  useIsAdmin: vi.fn(() => false),
  useUserTenants: vi.fn(() => ({
    userTenants: [],
    saveUserTenants: vi.fn(),
  })),
}));

vi.mock('@/lib/hooks', () => ({
  useAppSelector: vi.fn(() => ({})),
}));

vi.mock('@/features/rbac', () => ({
  selectRbacPermissions: vi.fn(),
}));

vi.mock('@iblai/iblai-js/web-containers', () => ({
  CredentialBox: () => <div data-testid="credential-box">CredentialBox</div>,
  EducationBox: () => <div data-testid="education-box">EducationBox</div>,
  ExperienceBox: () => <div data-testid="experience-box">ExperienceBox</div>,
  ResumeBox: () => <div data-testid="resume-box">ResumeBox</div>,
  SkillsBox: () => <div data-testid="skills-box">SkillsBox</div>,
  UserAvatar: ({ size, containerClassName }: any) => (
    <div data-testid="user-avatar" data-size={size} className={containerClassName}>
      UserAvatar
    </div>
  ),
  EducationDialog: () => <div data-testid="education-dialog">EducationDialog</div>,
  ExperienceDialog: () => <div data-testid="experience-dialog">ExperienceDialog</div>,
  useProfileCredentials: vi.fn(() => ({
    fetchedCredentials: [],
    isLoading: false,
    isError: false,
  })),
  useProfileSkills: vi.fn(() => ({
    earnedSkills: [],
    earnedSkillsLoading: false,
    earnedSkillsError: false,
    selfReportedSkills: [],
    selfReportedSkillsLoading: false,
    selfReportedSkillsError: false,
    desiredSkills: [],
    desiredSkillsLoading: false,
    desiredSkillsError: false,
  })),
  useUserMetadata: vi.fn(() => ({
    userMetaData: {
      name: 'John Doe',
      bio: 'Software Engineer',
      about: 'About me section',
      social_links: [],
    },
  })),
}));

vi.mock('@iblai/iblai-js/web-containers/next', () => ({
  MediaBox: () => <div data-testid="media-box">MediaBox</div>,
  UserProfileModal: ({ isOpen, onClose, targetTab }: any) =>
    isOpen ? (
      <div data-testid="user-profile-modal" data-target-tab={targetTab}>
        UserProfileModal
        <button onClick={onClose} data-testid="close-modal-btn">
          Close
        </button>
      </div>
    ) : null,
}));

// Stable references to keep hook return values referentially stable across renders
const stableCreateUserResume = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserEducationQuery: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useGetUserExperienceQuery: vi.fn(() => ({ data: [], isLoading: false, error: null })),
  useGetUserResumeQuery: vi.fn(() => ({
    data: { files: [], links: [] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/services/career', () => ({
  useCreateUserResumeMutation: vi.fn(() => [stableCreateUserResume, { isLoading: false }]),
}));

vi.mock('@/components/add-institution-dialog', () => ({
  AddInstitutionDialog: () => <div data-testid="add-institution-dialog" />,
}));

vi.mock('@/components/add-company-dialog', () => ({
  AddCompanyDialog: () => <div data-testid="add-company-dialog" />,
}));

const mockSetIsUserProfileOpen = vi.fn();
const mockSetUserProfileTargetTab = vi.fn();

vi.mock('@/components/client-layout', () => ({
  AppContext: React.createContext({
    isUserProfileOpen: false,
    setIsUserProfileOpen: vi.fn(),
    userProfileTargetTab: 'basic',
    setUserProfileTargetTab: vi.fn(),
  }),
}));

import PublicProfilePage from '../page';
import { AppContext } from '@/components/client-layout';
import { useUserMetadata } from '@iblai/iblai-js/web-containers';
import { useTenantMetadata } from '@iblai/iblai-js/web-utils';
import { useUserTenants } from '@/utils/localstorage';

function renderWithContext(isUserProfileOpen = false, userProfileTargetTab = 'basic') {
  return render(
    <AppContext.Provider
      value={{
        isUserProfileOpen,
        setIsUserProfileOpen: mockSetIsUserProfileOpen,
        userProfileTargetTab,
        setUserProfileTargetTab: mockSetUserProfileTargetTab,
      }}
    >
      <PublicProfilePage />
    </AppContext.Provider>,
  );
}

describe('PublicProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: {
        name: 'John Doe',
        bio: 'Software Engineer',
        about: 'About me section',
        social_links: [],
      },
    } as any);
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsResumeFeatureHidden: vi.fn(() => false),
    } as any);
    vi.mocked(useUserTenants).mockReturnValue({
      userTenants: [],
      saveUserTenants: vi.fn(),
    } as any);
  });

  it('renders without crashing', () => {
    const { container } = renderWithContext();
    expect(container).toBeTruthy();
  });

  it('renders user name from userMetaData', () => {
    renderWithContext();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders user bio', () => {
    renderWithContext();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
  });

  it('renders UserAvatar', () => {
    renderWithContext();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('renders profile tabs', () => {
    renderWithContext();
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getAllByText('Skills').length).toBeGreaterThan(0);
    expect(screen.getByText('Credentials')).toBeInTheDocument();
    expect(screen.getByText('Media')).toBeInTheDocument();
  });

  it('shows Resume tab when metadata is loaded and resume feature is not hidden', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsResumeFeatureHidden: vi.fn(() => false),
    } as any);

    renderWithContext();
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('hides Resume tab when resume feature is hidden', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsResumeFeatureHidden: vi.fn(() => true),
    } as any);

    renderWithContext();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
  });

  it('hides Resume tab when metadataLoaded is false', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: false,
      isSkillsResumeFeatureHidden: vi.fn(() => false),
    } as any);

    renderWithContext();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
  });

  it('renders About tab content by default', () => {
    renderWithContext();
    expect(screen.getByText('About me section')).toBeInTheDocument();
  });

  it('switches to Education tab on click', () => {
    renderWithContext();
    fireEvent.click(screen.getByText('Education'));
    expect(screen.getByTestId('education-box')).toBeInTheDocument();
  });

  it('switches to Experience tab on click', () => {
    renderWithContext();
    fireEvent.click(screen.getByText('Experience'));
    expect(screen.getByTestId('experience-box')).toBeInTheDocument();
  });

  it('switches to Skills tab on click', () => {
    renderWithContext();
    fireEvent.click(screen.getByText('Skills'));
    expect(screen.getByTestId('skills-box')).toBeInTheDocument();
  });

  it('switches to Credentials tab on click', () => {
    renderWithContext();
    fireEvent.click(screen.getByText('Credentials'));
    expect(screen.getByTestId('credential-box')).toBeInTheDocument();
  });

  it('switches to Resume tab on click and shows ResumeBox', () => {
    vi.mocked(useTenantMetadata).mockReturnValue({
      metadataLoaded: true,
      isSkillsResumeFeatureHidden: vi.fn(() => false),
    } as any);

    renderWithContext();
    fireEvent.click(screen.getByText('Resume'));
    expect(screen.getByTestId('resume-box')).toBeInTheDocument();
  });

  it('switches to Media tab on click', () => {
    renderWithContext();
    fireEvent.click(screen.getByText('Media'));
    expect(screen.getByTestId('media-box')).toBeInTheDocument();
  });

  it('opens UserProfileModal when Edit2 button is clicked', () => {
    renderWithContext();
    const editButtons = screen.getAllByTestId('edit2-icon');
    fireEvent.click(editButtons[0].closest('button')!);
    expect(mockSetUserProfileTargetTab).toHaveBeenCalledWith('basic');
    expect(mockSetIsUserProfileOpen).toHaveBeenCalledWith(true);
  });

  it('opens UserProfileModal when Edit button (name) is clicked', () => {
    renderWithContext();
    const editIcon = screen.getByTestId('edit-icon');
    fireEvent.click(editIcon.closest('button')!);
    expect(mockSetUserProfileTargetTab).toHaveBeenCalledWith('basic');
    expect(mockSetIsUserProfileOpen).toHaveBeenCalledWith(true);
  });

  it('shows UserProfileModal when isUserProfileOpen is true', () => {
    renderWithContext(true, 'basic');
    expect(screen.getByTestId('user-profile-modal')).toBeInTheDocument();
  });

  it('hides UserProfileModal when isUserProfileOpen is false', () => {
    renderWithContext(false, 'basic');
    expect(screen.queryByTestId('user-profile-modal')).not.toBeInTheDocument();
  });

  it('closes UserProfileModal when close button is clicked', () => {
    renderWithContext(true, 'basic');
    fireEvent.click(screen.getByTestId('close-modal-btn'));
    expect(mockSetIsUserProfileOpen).toHaveBeenCalledWith(false);
    expect(mockSetUserProfileTargetTab).toHaveBeenCalledWith('basic');
  });

  it('renders social links - facebook', () => {
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: {
        name: 'John Doe',
        bio: 'Bio',
        about: 'About',
        social_links: [{ platform: 'facebook', social_link: 'johndoe' }],
      },
    } as any);

    renderWithContext();
    expect(screen.getByTestId('facebook-icon')).toBeInTheDocument();
  });

  it('renders social links - linkedin', () => {
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: {
        name: 'John Doe',
        bio: 'Bio',
        about: 'About',
        social_links: [{ platform: 'linkedin', social_link: 'johndoe' }],
      },
    } as any);

    renderWithContext();
    expect(screen.getByTestId('linkedin-icon')).toBeInTheDocument();
  });

  it('renders social links - twitter', () => {
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: {
        name: 'John Doe',
        bio: 'Bio',
        about: 'About',
        social_links: [{ platform: 'twitter', social_link: 'johndoe' }],
      },
    } as any);

    renderWithContext();
    expect(screen.getByTestId('twitter-icon')).toBeInTheDocument();
  });

  it('does not render bio paragraph when bio is absent', () => {
    vi.mocked(useUserMetadata).mockReturnValue({
      userMetaData: {
        name: 'Jane Doe',
        bio: null,
        about: 'About',
        social_links: [],
      },
    } as any);

    renderWithContext();
    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
  });

  it('updates tenant on handleTenantUpdate', () => {
    const mockSaveUserTenants = vi.fn();
    vi.mocked(useUserTenants).mockReturnValue({
      userTenants: [{ key: 'tenant-1', name: 'Tenant 1' }],
      saveUserTenants: mockSaveUserTenants,
    } as any);

    renderWithContext(true, 'basic');

    expect(screen.getByTestId('user-profile-modal')).toBeInTheDocument();
  });
});
