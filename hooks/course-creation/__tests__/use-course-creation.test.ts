import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockToast = { error: vi.fn(), success: vi.fn() };
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => mockToast.error(...args),
    success: (...args: unknown[]) => mockToast.success(...args),
  },
}));

const mockCreateCourse = vi.fn();
const mockDeleteCourse = vi.fn();
const mockUpdateCourseSettings = vi.fn();
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useCreateStudioCourseMutation: () => [mockCreateCourse],
  useDeleteStudioCourseMutation: () => [mockDeleteCourse],
  useUpdateStudioCourseSettingsMutation: () => [mockUpdateCourseSettings],
}));

vi.mock('@/hooks/use-tenant-param', () => ({
  useTenantParam: () => 'test-tenant',
}));

const mockGetOrg = vi.fn();
vi.mock('@/utils/helpers', () => ({
  getOrg: () => mockGetOrg(),
}));

import { useCourseCreation } from '../use-course-creation';

const COURSE_KEY = 'course-v1:test-org+CS101+2026';

const unwrapResolve = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const unwrapReject = (error: unknown) => ({ unwrap: () => Promise.reject(error) });

describe('useCourseCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrg.mockReturnValue('test-org');
    mockCreateCourse.mockReturnValue(unwrapResolve({ course_key: COURSE_KEY }));
    mockUpdateCourseSettings.mockReturnValue(unwrapResolve({}));
    mockDeleteCourse.mockReturnValue(unwrapResolve({}));
  });

  const fillFields = (result: { current: ReturnType<typeof useCourseCreation> }) => {
    act(() => {
      result.current.setField('display_name', 'My Course');
    });
    act(() => {
      result.current.setField('description', 'A description');
    });
  };

  it('starts with empty fields and idle state', () => {
    const { result } = renderHook(() => useCourseCreation());

    expect(result.current.fields).toEqual({ display_name: '', description: '' });
    expect(result.current.submitting).toBe(false);
    expect(result.current.createdCourseKey).toBeNull();
  });

  it('setField updates individual fields', () => {
    const { result } = renderHook(() => useCourseCreation());

    fillFields(result);

    expect(result.current.fields).toEqual({
      display_name: 'My Course',
      description: 'A description',
    });
  });

  it('rejects submission when name or description is blank', async () => {
    const { result } = renderHook(() => useCourseCreation());

    act(() => {
      result.current.setField('display_name', '   ');
    });

    await act(async () => {
      await result.current.handleFormSubmit();
    });

    expect(mockToast.error).toHaveBeenCalledWith('Please fill in the course name and description.');
    expect(mockCreateCourse).not.toHaveBeenCalled();
  });

  it('rejects submission when the org cannot be determined', async () => {
    mockGetOrg.mockReturnValue('');
    const { result } = renderHook(() => useCourseCreation());
    fillFields(result);

    await act(async () => {
      await result.current.handleFormSubmit();
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      'Could not determine your organization. Please re-select your tenant.',
    );
    expect(mockCreateCourse).not.toHaveBeenCalled();
  });

  it('creates the course shell then applies settings on success', async () => {
    const { result } = renderHook(() => useCourseCreation());
    fillFields(result);

    await act(async () => {
      await result.current.handleFormSubmit();
    });

    expect(mockCreateCourse).toHaveBeenCalledWith({
      courseData: { org: 'test-org', display_name: 'My Course' },
    });
    expect(mockUpdateCourseSettings).toHaveBeenCalledWith({
      settings: expect.objectContaining({
        org: 'test-org',
        course_id: 'CS101',
        run: '2026',
        course_key: COURSE_KEY,
        platform_key: 'test-tenant',
        display_name: 'My Course',
        title: 'My Course',
        description: 'A description',
        language: 'en',
        self_paced: true,
        instructor_info: { instructors: [] },
      }),
    });
    expect(mockToast.success).toHaveBeenCalledWith('Course created successfully.');
    expect(result.current.createdCourseKey).toBe(COURSE_KEY);
    expect(result.current.submitting).toBe(false);
    expect(mockDeleteCourse).not.toHaveBeenCalled();
  });

  it('ignores submissions while one is already in flight', async () => {
    let resolveCreate: (value: unknown) => void = () => {};
    mockCreateCourse.mockReturnValue({
      unwrap: () => new Promise((resolve) => (resolveCreate = resolve)),
    });
    const { result } = renderHook(() => useCourseCreation());
    fillFields(result);

    let firstSubmit: Promise<void> = Promise.resolve();
    act(() => {
      firstSubmit = result.current.handleFormSubmit();
    });

    // submitting is now true — a second call must return early.
    await act(async () => {
      await result.current.handleFormSubmit();
    });
    expect(mockCreateCourse).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreate({ course_key: COURSE_KEY });
      await firstSubmit;
    });
  });

  it('errors without rollback when Studio returns no course key', async () => {
    mockCreateCourse.mockReturnValue(unwrapResolve({}));
    const { result } = renderHook(() => useCourseCreation());
    fillFields(result);

    await act(async () => {
      await result.current.handleFormSubmit();
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      'Course creation failed: Studio did not return a course key.',
    );
    expect(mockDeleteCourse).not.toHaveBeenCalled();
    expect(result.current.createdCourseKey).toBeNull();
    expect(result.current.submitting).toBe(false);
  });

  it('rolls back the course shell when settings fail', async () => {
    mockUpdateCourseSettings.mockReturnValue(unwrapReject(new Error('settings exploded')));
    const { result } = renderHook(() => useCourseCreation());
    fillFields(result);

    await act(async () => {
      await result.current.handleFormSubmit();
    });

    expect(mockDeleteCourse).toHaveBeenCalledWith({ courseKey: COURSE_KEY });
    expect(mockToast.error).toHaveBeenCalledWith('settings exploded');
    expect(result.current.createdCourseKey).toBeNull();
  });

  it('surfaces the original error even when rollback fails', async () => {
    mockUpdateCourseSettings.mockReturnValue(unwrapReject(new Error('settings exploded')));
    mockDeleteCourse.mockReturnValue(unwrapReject(new Error('rollback failed')));
    const { result } = renderHook(() => useCourseCreation());
    fillFields(result);

    await act(async () => {
      await result.current.handleFormSubmit();
    });

    expect(mockToast.error).toHaveBeenCalledWith('settings exploded');
  });

  it('shows string API error payloads', async () => {
    mockCreateCourse.mockReturnValue(unwrapReject({ data: 'Org quota exceeded' }));
    const { result } = renderHook(() => useCourseCreation());
    fillFields(result);

    await act(async () => {
      await result.current.handleFormSubmit();
    });

    expect(mockToast.error).toHaveBeenCalledWith('Org quota exceeded');
  });

  it('falls back to a generic message for unknown error shapes', async () => {
    mockCreateCourse.mockReturnValue(unwrapReject({ status: 500 }));
    const { result } = renderHook(() => useCourseCreation());
    fillFields(result);

    await act(async () => {
      await result.current.handleFormSubmit();
    });

    expect(mockToast.error).toHaveBeenCalledWith('Course creation failed. Please try again.');
  });
});
