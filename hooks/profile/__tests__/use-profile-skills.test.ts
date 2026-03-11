import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserId: vi.fn(() => 42),
  getUserName: vi.fn(() => 'test-user'),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCreateOrUpdateUserReportedSkill = vi.fn();
const mockCreateOrUpdateUserDesiredSkill = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserEarnedSkillsQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
  })),
  useGetUserReportedSkillsQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
  })),
  useGetUserDesiredSkillsQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
  })),
  useCreateOrUpdateUserReportedSkillMutation: vi.fn(() => [
    mockCreateOrUpdateUserReportedSkill,
    { isError: false },
  ]),
  useCreateOrUpdateUserDesiredSkillMutation: vi.fn(() => [
    mockCreateOrUpdateUserDesiredSkill,
    { isError: false },
  ]),
}));

vi.mock('@iblai/iblai-api', () => ({}));

const mockHandleSearch = vi.fn();
vi.mock('@/hooks/search/use-catalog-search', () => ({
  useCatalogSearch: vi.fn(() => ({
    handleSearch: mockHandleSearch,
    isLoading: false,
    isError: false,
  })),
}));

import { useProfileSkills } from '../use-profile-skills';
import { toast } from 'sonner';

describe('useProfileSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateOrUpdateUserReportedSkill.mockResolvedValue({});
    mockCreateOrUpdateUserDesiredSkill.mockResolvedValue({});
    mockHandleSearch.mockResolvedValue({ data: { results: [] } });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useProfileSkills());
    expect(result.current).toHaveProperty('earnedSkills');
    expect(result.current).toHaveProperty('earnedSkillsLoading');
    expect(result.current).toHaveProperty('earnedSkillsError');
    expect(result.current).toHaveProperty('earnedSkillsSuccess');
    expect(result.current).toHaveProperty('selfReportedSkills');
    expect(result.current).toHaveProperty('selfReportedSkillsLoading');
    expect(result.current).toHaveProperty('selfReportedSkillsError');
    expect(result.current).toHaveProperty('selfReportedSkillsSuccess');
    expect(result.current).toHaveProperty('desiredSkills');
    expect(result.current).toHaveProperty('desiredSkillsLoading');
    expect(result.current).toHaveProperty('desiredSkillsError');
    expect(result.current).toHaveProperty('desiredSkillsSuccess');
    expect(result.current).toHaveProperty('handleSkillsDeletion');
    expect(result.current).toHaveProperty('handleSkillsUpdate');
    expect(result.current).toHaveProperty('handleSkillsCreate');
    expect(result.current).toHaveProperty('handleFetchAllSkills');
    expect(result.current).toHaveProperty('fetchedSkills');
    expect(result.current).toHaveProperty('updatingSkill');
    expect(result.current).toHaveProperty('deletingSkill');
  });

  it('initializes with empty fetchedSkills', () => {
    const { result } = renderHook(() => useProfileSkills());
    expect(result.current.fetchedSkills).toEqual([]);
    expect(result.current.updatingSkill).toBe(false);
    expect(result.current.deletingSkill).toBe(false);
  });

  describe('handleFetchAllSkills', () => {
    it('fetches and sets skills on success', async () => {
      const mockSkills = [{ id: 'skill-1', name: 'Python' }];
      mockHandleSearch.mockResolvedValue({ data: { results: mockSkills } });

      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleFetchAllSkills('python');
      });

      expect(mockHandleSearch).toHaveBeenCalledWith({
        content: ['skills'],
        tenant: 'test-tenant',
        query: 'python',
      });
      expect(result.current.fetchedSkills).toEqual(mockSkills);
    });

    it('fetches skills without search query', async () => {
      mockHandleSearch.mockResolvedValue({ data: { results: [] } });

      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleFetchAllSkills();
      });

      expect(mockHandleSearch).toHaveBeenCalledWith({
        content: ['skills'],
        tenant: 'test-tenant',
      });
    });

    it('shows error toast and sets empty array on failure', async () => {
      mockHandleSearch.mockRejectedValue(new Error('Search error'));

      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleFetchAllSkills('python');
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to fetch skills');
      expect(result.current.fetchedSkills).toEqual([]);
    });
  });

  describe('handleSkillsCreate', () => {
    it('creates skills and shows success toast when showToast is true', async () => {
      const skills = { skills: [{ name: 'Python', skill_id: '1' }], user_id: 42 };
      const { result } = renderHook(() => useProfileSkills(true));

      let response: any;
      await act(async () => {
        response = await result.current.handleSkillsCreate(skills as any);
      });

      expect(mockCreateOrUpdateUserReportedSkill).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Skills created successfully');
      expect(response).toBe(true);
    });

    it('does not show toast when showToast is false', async () => {
      const skills = { skills: [{ name: 'Python' }], user_id: 42 };
      const { result } = renderHook(() => useProfileSkills(false));

      await act(async () => {
        await result.current.handleSkillsCreate(skills as any);
      });

      expect(toast.success).not.toHaveBeenCalled();
    });

    it('shows error toast and returns false on exception', async () => {
      mockCreateOrUpdateUserReportedSkill.mockRejectedValue(new Error('Create error'));

      const skills = { skills: [{ name: 'Python' }], user_id: 42 };
      const { result } = renderHook(() => useProfileSkills());

      let response: any;
      await act(async () => {
        response = await result.current.handleSkillsCreate(skills as any);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to create skills');
      expect(response).toBe(false);
    });
  });

  describe('handleSkillsDeletion', () => {
    const mockSelfReported = {
      skills: [{ name: 'Python' }, { name: 'JavaScript' }],
      data: { level: [3, 4] },
    };
    const mockDesired = {
      skills: [{ name: 'React' }],
      data: { level: [5] },
    };

    it('deletes self-reported skill and shows success toast', async () => {
      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleSkillsDeletion(
          { type: 'self-reported', name: 'Python' },
          { selfReported: mockSelfReported as any, desired: mockDesired as any },
        );
      });

      expect(mockCreateOrUpdateUserReportedSkill).toHaveBeenCalledWith([
        expect.objectContaining({
          requestBody: expect.objectContaining({
            skills: [{ name: 'JavaScript' }],
          }),
        }),
      ]);
      expect(toast.success).toHaveBeenCalledWith('Skill deleted successfully');
    });

    it('calls callback after deleting self-reported skill', async () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const { result } = renderHook(() => useProfileSkills());

      await act(async () => {
        result.current.handleSkillsDeletion(
          { type: 'self-reported', name: 'Python' },
          { selfReported: mockSelfReported as any, desired: undefined },
          callback,
        );
      });

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('deletes desired skill and shows success toast', async () => {
      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleSkillsDeletion(
          { type: 'desired', name: 'React' },
          { selfReported: mockSelfReported as any, desired: mockDesired as any },
        );
      });

      expect(mockCreateOrUpdateUserDesiredSkill).toHaveBeenCalledWith([
        expect.objectContaining({
          requestBody: expect.objectContaining({
            skills: [],
          }),
        }),
      ]);
      expect(toast.success).toHaveBeenCalledWith('Skill deleted successfully');
    });

    it('handles unknown skill type gracefully', async () => {
      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleSkillsDeletion(
          { type: 'earned' as any, name: 'Python' },
          { selfReported: mockSelfReported as any, desired: mockDesired as any },
        );
      });

      expect(mockCreateOrUpdateUserReportedSkill).not.toHaveBeenCalled();
      expect(mockCreateOrUpdateUserDesiredSkill).not.toHaveBeenCalled();
    });
  });

  describe('handleSkillsUpdate', () => {
    const mockSelfReported = {
      skills: [{ name: 'Python' }, { name: 'JavaScript' }],
      data: { level: [3, 4] },
    };
    const mockDesired = {
      skills: [{ name: 'React' }],
      data: { level: [5] },
    };

    it('updates self-reported skill level and shows success toast', async () => {
      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleSkillsUpdate(
          { type: 'self-reported', name: 'Python', level: 5 },
          { selfReported: mockSelfReported as any, desired: mockDesired as any },
        );
      });

      expect(mockCreateOrUpdateUserReportedSkill).toHaveBeenCalledWith([
        expect.objectContaining({
          requestBody: expect.objectContaining({
            data: { level: [5, 4] }, // Python level updated from 3 to 5
          }),
        }),
      ]);
      expect(toast.success).toHaveBeenCalledWith('Skill updated successfully');
    });

    it('updates desired skill level and shows success toast', async () => {
      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleSkillsUpdate(
          { type: 'desired', name: 'React', level: 3 },
          { selfReported: mockSelfReported as any, desired: mockDesired as any },
        );
      });

      expect(mockCreateOrUpdateUserDesiredSkill).toHaveBeenCalledWith([
        expect.objectContaining({
          requestBody: expect.objectContaining({
            data: { level: [3] },
          }),
        }),
      ]);
      expect(toast.success).toHaveBeenCalledWith('Skill updated successfully');
    });

    it('calls callback after updating skill', async () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const { result } = renderHook(() => useProfileSkills());

      await act(async () => {
        result.current.handleSkillsUpdate(
          { type: 'self-reported', name: 'Python', level: 5 },
          { selfReported: mockSelfReported as any, desired: undefined },
          callback,
        );
      });

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('handles unknown skill type gracefully', async () => {
      const { result } = renderHook(() => useProfileSkills());
      await act(async () => {
        await result.current.handleSkillsUpdate(
          { type: 'earned' as any, name: 'Python', level: 5 },
          { selfReported: mockSelfReported as any, desired: mockDesired as any },
        );
      });

      expect(mockCreateOrUpdateUserReportedSkill).not.toHaveBeenCalled();
      expect(mockCreateOrUpdateUserDesiredSkill).not.toHaveBeenCalled();
    });
  });
});
