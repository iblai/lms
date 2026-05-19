import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 42),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ tenant: 'test-tenant' }),
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: vi.fn(() => ({
    metadata: {
      enable_skills_screen_on_start_page: true,
      enable_roles_screen_on_start_page: true,
    },
  })),
}));

const mockGetUserMetadataQuery = vi.fn(() => ({ data: null }));
const mockResetReportedSkills = vi.fn();
const mockUpdateUserMetadata = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserMetadataQuery: (...args: any[]) =>
    (mockGetUserMetadataQuery as (...a: any[]) => any)(...args),
  useLazyGetReportedSkillsQuery: vi.fn(() => [vi.fn(), { reset: mockResetReportedSkills }]),
  useUpdateUserMetadataMutation: vi.fn(() => [mockUpdateUserMetadata]),
}));

const mockHandleSearch = vi.fn();
vi.mock('@/hooks/search/use-catalog-search', () => ({
  useCatalogSearch: vi.fn(() => ({
    handleSearch: mockHandleSearch,
    isLoading: false,
  })),
}));

const mockHandleDesiredRolesCreate = vi.fn();
vi.mock('@/hooks/profile/use-profile-roles', () => ({
  useProfileRoles: vi.fn(() => ({
    handleDesiredRolesCreate: mockHandleDesiredRolesCreate,
  })),
}));

const mockHandleSkillsCreate = vi.fn();
vi.mock('@/hooks/profile/use-profile-skills', () => ({
  useProfileSkills: vi.fn(() => ({
    handleSkillsCreate: mockHandleSkillsCreate,
  })),
}));

const mockUploadProfileImage = vi.fn();
vi.mock('@/services/users', () => ({
  useUploadProfileImageMutation: vi.fn(() => [mockUploadProfileImage]),
}));

const mockCreateUserResume = vi.fn();
vi.mock('@/services/career', () => ({
  useCreateUserResumeMutation: vi.fn(() => [mockCreateUserResume]),
}));

import { useStartPage } from '../use-start-page';

describe('useStartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleSearch.mockResolvedValue({ data: { results: [] } });
    mockHandleDesiredRolesCreate.mockResolvedValue(true);
    mockHandleSkillsCreate.mockResolvedValue(true);
    mockUpdateUserMetadata.mockResolvedValue({});
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useStartPage());
    expect(result.current).toHaveProperty('handleRolesFetch');
    expect(result.current).toHaveProperty('handleToggleRole');
    expect(result.current).toHaveProperty('isRoleSelected');
    expect(result.current).toHaveProperty('fields');
    expect(result.current).toHaveProperty('setFields');
    expect(result.current).toHaveProperty('roles');
    expect(result.current).toHaveProperty('rolesLoading');
    expect(result.current).toHaveProperty('handleSkillsFetch');
    expect(result.current).toHaveProperty('handleToggleSkill');
    expect(result.current).toHaveProperty('isSkillSelected');
    expect(result.current).toHaveProperty('skills');
    expect(result.current).toHaveProperty('skillsLoading');
    expect(result.current).toHaveProperty('handleUpdateSkillRating');
    expect(result.current).toHaveProperty('handleProfileImageSelect');
    expect(result.current).toHaveProperty('profileImage');
    expect(result.current).toHaveProperty('handleSocialLinksUpdate');
    expect(result.current).toHaveProperty('handleResumeSelect');
    expect(result.current).toHaveProperty('handleSubmit');
  });

  it('initializes fields with defaults', () => {
    const { result } = renderHook(() => useStartPage());
    expect(result.current.fields).toEqual({
      roles: [],
      skills: [],
      resume: null,
      profileImage: null,
      socialLinks: {
        linkedin: '',
        twitter: '',
        facebook: '',
      },
    });
    expect(result.current.roles).toEqual([]);
    expect(result.current.skills).toEqual([]);
    expect(result.current.profileImage).toBeNull();
  });

  describe('handleRolesFetch', () => {
    it('fetches roles and sets them', async () => {
      const mockRoles = [{ data: { id: '1', name: 'Developer' } }];
      mockHandleSearch.mockResolvedValue({ data: { results: mockRoles } });

      const { result } = renderHook(() => useStartPage());
      await act(async () => {
        await result.current.handleRolesFetch({ searchQuery: 'dev', limit: 12 });
      });

      expect(mockHandleSearch).toHaveBeenCalledWith({
        content: ['roles'],
        limit: 12,
        tenant: 'test-tenant',
        query: 'dev',
      });
      expect(result.current.roles).toEqual(mockRoles);
      expect(result.current.rolesLoading).toBe(false);
    });

    it('fetches roles without search query when empty', async () => {
      mockHandleSearch.mockResolvedValue({ data: { results: [] } });

      const { result } = renderHook(() => useStartPage());
      await act(async () => {
        await result.current.handleRolesFetch({ searchQuery: '', limit: 12 });
      });

      expect(mockHandleSearch).toHaveBeenCalledWith({
        content: ['roles'],
        limit: 12,
        tenant: 'test-tenant',
      });
    });

    it('handles null response gracefully', async () => {
      mockHandleSearch.mockResolvedValue(null);

      const { result } = renderHook(() => useStartPage());
      await act(async () => {
        await result.current.handleRolesFetch({});
      });

      expect(result.current.roles).toEqual([]);
    });
  });

  describe('handleSkillsFetch', () => {
    it('fetches skills and sets them', async () => {
      const mockSkills = [{ data: { id: '1', name: 'Python' } }];
      mockHandleSearch.mockResolvedValue({ data: { results: mockSkills } });

      const { result } = renderHook(() => useStartPage());
      await act(async () => {
        await result.current.handleSkillsFetch({ searchQuery: 'python', limit: 12 });
      });

      expect(mockHandleSearch).toHaveBeenCalledWith({
        content: ['skills'],
        limit: 12,
        tenant: 'test-tenant',
        query: 'python',
      });
      expect(result.current.skills).toEqual(mockSkills);
    });
  });

  describe('handleToggleRole', () => {
    it('adds role when not selected', () => {
      const { result } = renderHook(() => useStartPage());
      const role = { data: { id: 'role-1', name: 'Developer' } };

      act(() => {
        result.current.handleToggleRole(role as any);
      });

      expect(result.current.fields.roles).toEqual([role]);
    });

    it('removes role when already selected', () => {
      const { result } = renderHook(() => useStartPage());
      const role = { data: { id: 'role-1', name: 'Developer' } };

      act(() => {
        result.current.handleToggleRole(role as any);
      });
      act(() => {
        result.current.handleToggleRole(role as any);
      });

      expect(result.current.fields.roles).toEqual([]);
    });
  });

  describe('isRoleSelected', () => {
    it('returns false when role not selected', () => {
      const { result } = renderHook(() => useStartPage());
      const role = { data: { id: 'role-1', name: 'Developer' } };
      expect(result.current.isRoleSelected(role as any)).toBe(false);
    });

    it('returns true when role is selected', () => {
      const { result } = renderHook(() => useStartPage());
      const role = { data: { id: 'role-1', name: 'Developer' } };

      act(() => {
        result.current.handleToggleRole(role as any);
      });

      expect(result.current.isRoleSelected(role as any)).toBe(true);
    });
  });

  describe('handleToggleSkill', () => {
    it('adds skill when not selected', () => {
      const { result } = renderHook(() => useStartPage());
      const skill = { data: { id: 'skill-1', name: 'Python' } };

      act(() => {
        result.current.handleToggleSkill(skill as any);
      });

      expect(result.current.fields.skills).toEqual([skill]);
    });

    it('removes skill when already selected', () => {
      const { result } = renderHook(() => useStartPage());
      const skill = { data: { id: 'skill-1', name: 'Python' } };

      act(() => {
        result.current.handleToggleSkill(skill as any);
      });
      act(() => {
        result.current.handleToggleSkill(skill as any);
      });

      expect(result.current.fields.skills).toEqual([]);
    });
  });

  describe('isSkillSelected', () => {
    it('returns false when skill not selected', () => {
      const { result } = renderHook(() => useStartPage());
      const skill = { data: { id: 'skill-1', name: 'Python' } };
      expect(result.current.isSkillSelected(skill as any)).toBe(false);
    });

    it('returns true when skill is selected', () => {
      const { result } = renderHook(() => useStartPage());
      const skill = { data: { id: 'skill-1', name: 'Python' } };

      act(() => {
        result.current.handleToggleSkill(skill as any);
      });

      expect(result.current.isSkillSelected(skill as any)).toBe(true);
    });
  });

  describe('handleUpdateSkillRating', () => {
    it('updates rating for the specified skill', () => {
      const { result } = renderHook(() => useStartPage());
      const skill = { data: { id: 'skill-1', name: 'Python' }, rating: 0 };

      act(() => {
        result.current.handleToggleSkill(skill as any);
      });
      act(() => {
        result.current.handleUpdateSkillRating(skill as any, 4);
      });

      expect(result.current.fields.skills[0]).toMatchObject({ rating: 4 });
    });
  });

  describe('handleSocialLinksUpdate', () => {
    it('updates the correct social link', () => {
      const { result } = renderHook(() => useStartPage());

      act(() => {
        result.current.handleSocialLinksUpdate({
          socialType: 'linkedin',
          socialLink: 'https://linkedin.com/in/test',
        });
      });

      expect(result.current.fields.socialLinks.linkedin).toBe('https://linkedin.com/in/test');
    });

    it('sets empty string when no social link provided', () => {
      const { result } = renderHook(() => useStartPage());

      act(() => {
        result.current.handleSocialLinksUpdate({
          socialType: 'twitter',
          socialLink: '',
        });
      });

      expect(result.current.fields.socialLinks.twitter).toBe('');
    });
  });

  describe('handleResumeSelect', () => {
    it('sets resume file', () => {
      const { result } = renderHook(() => useStartPage());
      const mockFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });

      act(() => {
        result.current.handleResumeSelect(mockFile);
      });

      expect(result.current.fields.resume).toBe(mockFile);
    });

    it('clears resume when null passed', () => {
      const { result } = renderHook(() => useStartPage());

      act(() => {
        result.current.handleResumeSelect(null);
      });

      expect(result.current.fields.resume).toBeNull();
    });
  });

  describe('handleProfileImageSelect', () => {
    it('sets profile image when valid image file selected', () => {
      const { result } = renderHook(() => useStartPage());

      const mockFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

      const mockEvent = {
        target: {
          files: [mockFile],
        },
      } as any;

      const createObjectURLMock = vi.fn(() => 'blob:http://example.com/fake-url');
      global.URL.createObjectURL = createObjectURLMock;

      act(() => {
        result.current.handleProfileImageSelect(mockEvent);
      });

      expect(result.current.profileImage).toBe('blob:http://example.com/fake-url');
      expect(result.current.fields.profileImage).toBe(mockFile);
    });

    it('shows alert when file is not an image', () => {
      const { result } = renderHook(() => useStartPage());
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const mockEvent = {
        target: { files: [mockFile] },
      } as any;

      act(() => {
        result.current.handleProfileImageSelect(mockEvent);
      });

      expect(alertSpy).toHaveBeenCalledWith('Please upload an image file');
      alertSpy.mockRestore();
    });

    it('shows alert when file exceeds 2MB', () => {
      const { result } = renderHook(() => useStartPage());
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const mockFile = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB

      const mockEvent = {
        target: { files: [mockFile] },
      } as any;

      act(() => {
        result.current.handleProfileImageSelect(mockEvent);
      });

      expect(alertSpy).toHaveBeenCalledWith('Image size exceeds 2MB limit');
      alertSpy.mockRestore();
    });

    it('does nothing when no files selected', () => {
      const { result } = renderHook(() => useStartPage());

      const mockEvent = {
        target: { files: null },
      } as any;

      act(() => {
        result.current.handleProfileImageSelect(mockEvent);
      });

      expect(result.current.profileImage).toBeNull();
    });
  });

  describe('handleSubmit', () => {
    it('submits form data and navigates to /home on success', async () => {
      mockHandleDesiredRolesCreate.mockResolvedValue(true);
      mockHandleSkillsCreate.mockResolvedValue(true);
      mockUpdateUserMetadata.mockResolvedValue({});

      const { result } = renderHook(() => useStartPage());
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockHandleDesiredRolesCreate).toHaveBeenCalled();
      expect(mockHandleSkillsCreate).toHaveBeenCalled();
      expect(mockUpdateUserMetadata).toHaveBeenCalled();
      expect(mockResetReportedSkills).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/home');
    });

    it('handles submission failure gracefully', async () => {
      mockHandleDesiredRolesCreate.mockResolvedValue(false);
      mockHandleSkillsCreate.mockResolvedValue(false);
      mockUpdateUserMetadata.mockResolvedValue({});

      const { result } = renderHook(() => useStartPage());
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('uploads profile image when set', async () => {
      mockHandleDesiredRolesCreate.mockResolvedValue(true);
      mockHandleSkillsCreate.mockResolvedValue(true);
      mockUpdateUserMetadata.mockResolvedValue({});
      mockUploadProfileImage.mockResolvedValue({});

      const { result } = renderHook(() => useStartPage());

      const mockFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 });

      const createObjectURLMock = vi.fn(() => 'blob:http://example.com/fake-url');
      global.URL.createObjectURL = createObjectURLMock;

      act(() => {
        result.current.handleProfileImageSelect({
          target: { files: [mockFile] },
        } as any);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockUploadProfileImage).toHaveBeenCalled();
    });

    it('uploads resume when set', async () => {
      mockHandleDesiredRolesCreate.mockResolvedValue(true);
      mockHandleSkillsCreate.mockResolvedValue(true);
      mockUpdateUserMetadata.mockResolvedValue({});
      mockCreateUserResume.mockResolvedValue({});

      const { result } = renderHook(() => useStartPage());

      const mockResumeFile = new File(['resume content'], 'resume.pdf', {
        type: 'application/pdf',
      });

      act(() => {
        result.current.handleResumeSelect(mockResumeFile);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockCreateUserResume).toHaveBeenCalled();
    });
  });
});
