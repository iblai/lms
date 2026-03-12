import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetUsersAsAssertions = vi.fn();
const mockUploadCredentialImage = vi.fn();
const mockCreateCredentialAssertion = vi.fn();
const mockCreateCredential = vi.fn();
const mockUpdateCredential = vi.fn();
const mockDeleteCredential = vi.fn();
const mockGetIssuers = vi.fn();
const mockGetCredentialsList = vi.fn();

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useLazyGetUsersAsAssertionsQuery: vi.fn(() => [mockGetUsersAsAssertions]),
  useUploadCredentialImageMutation: vi.fn(() => [mockUploadCredentialImage]),
  useCreateCredentialAssertionMutation: vi.fn(() => [mockCreateCredentialAssertion]),
  useCreateCredentialMutation: vi.fn(() => [mockCreateCredential]),
  useUpdateCredentialMutation: vi.fn(() => [mockUpdateCredential]),
  useDeleteCourseCredentialMutation: vi.fn(() => [mockDeleteCredential]),
  useLazyGetIssuersQuery: vi.fn(() => [mockGetIssuers]),
  useLazyGetCredentialsListQuery: vi.fn(() => [mockGetCredentialsList]),
}));

vi.mock('@iblai/iblai-api', () => ({}));

import { useCredentials } from '../use-credentials';

// Helper to create a mock that returns an object with unwrap()
function mockWithUnwrap(value: any) {
  return { unwrap: () => Promise.resolve(value) };
}

function mockWithUnwrapError(error: Error) {
  return { unwrap: () => Promise.reject(error) };
}

describe('useCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useCredentials());
    expect(result.current).toHaveProperty('handleFetchUsersAsAssertionsForCourse');
    expect(result.current).toHaveProperty('handleImageUploadForCredentials');
    expect(result.current).toHaveProperty('handleCreateCredentialAssertion');
    expect(result.current).toHaveProperty('handleFetchCredentials');
    expect(result.current).toHaveProperty('handleCreateCredential');
    expect(result.current).toHaveProperty('handleUpdateCredential');
    expect(result.current).toHaveProperty('handleDeleteCredential');
    expect(result.current).toHaveProperty('handleFetchIssuers');
    expect(result.current).toHaveProperty('credentials');
    expect(result.current).toHaveProperty('isLoadingCredentials');
    expect(result.current).toHaveProperty('issuers');
    expect(result.current).toHaveProperty('isLoadingIssuers');
  });

  it('initializes credentials with empty result', () => {
    const { result } = renderHook(() => useCredentials());
    expect(result.current.credentials).toEqual({
      result: { data: [], count: 0, num_pages: 0, page_number: 0 },
    });
    expect(result.current.isLoadingCredentials).toBe(false);
    expect(result.current.issuers).toEqual([]);
    expect(result.current.isLoadingIssuers).toBe(false);
  });

  describe('handleFetchUsersAsAssertionsForCourse', () => {
    it('returns assertions data on success', async () => {
      const mockData = { results: [{ id: '1' }] };
      mockGetUsersAsAssertions.mockReturnValue(mockWithUnwrap(mockData));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleFetchUsersAsAssertionsForCourse('course-123');
      });

      expect(mockGetUsersAsAssertions).toHaveBeenCalledWith({
        platformKey: 'test-tenant',
        username: 'test-user',
        course: 'course-123',
      });
      expect(response).toEqual(mockData);
    });

    it('returns null on error', async () => {
      mockGetUsersAsAssertions.mockReturnValue(mockWithUnwrapError(new Error('fetch error')));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleFetchUsersAsAssertionsForCourse('course-123');
      });

      expect(response).toBeNull();
    });
  });

  describe('handleImageUploadForCredentials', () => {
    it('returns uploaded image data on success', async () => {
      const mockImageData = { id: 'img-1', url: 'http://example.com/image.jpg' };
      mockUploadCredentialImage.mockReturnValue(mockWithUnwrap(mockImageData));

      const { result } = renderHook(() => useCredentials());
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      let response: any;
      await act(async () => {
        response = await result.current.handleImageUploadForCredentials(mockFile);
      });

      expect(response).toEqual(mockImageData);
    });

    it('returns null on error', async () => {
      mockUploadCredentialImage.mockReturnValue(mockWithUnwrapError(new Error('upload error')));

      const { result } = renderHook(() => useCredentials());
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      let response: any;
      await act(async () => {
        response = await result.current.handleImageUploadForCredentials(mockFile);
      });

      expect(response).toBeNull();
    });

    it('includes org and username in upload params', async () => {
      mockUploadCredentialImage.mockReturnValue(mockWithUnwrap({ id: 'img-1' }));

      const { result } = renderHook(() => useCredentials());
      const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      await act(async () => {
        await result.current.handleImageUploadForCredentials(mockFile);
      });

      expect(mockUploadCredentialImage).toHaveBeenCalledWith(
        expect.objectContaining({
          org: 'test-tenant',
          username: 'test-user',
        }),
      );
    });
  });

  describe('handleCreateCredentialAssertion', () => {
    it('returns assertion on success', async () => {
      const mockAssertion = { id: 'assertion-1', entityId: 'entity-1' };
      mockCreateCredentialAssertion.mockReturnValue(mockWithUnwrap(mockAssertion));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleCreateCredentialAssertion('entity-1', mockAssertion as any);
      });

      expect(response).toEqual(mockAssertion);
    });

    it('returns null on error', async () => {
      mockCreateCredentialAssertion.mockReturnValue(mockWithUnwrapError(new Error('create error')));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleCreateCredentialAssertion('entity-1', {} as any);
      });

      expect(response).toBeNull();
    });
  });

  describe('handleFetchCredentials', () => {
    it('fetches and sets credentials on success', async () => {
      const mockCredentials = {
        result: { data: [{ id: 'cred-1' }], count: 1, num_pages: 1, page_number: 1 },
      };
      mockGetCredentialsList.mockReturnValue(mockWithUnwrap(mockCredentials));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleFetchCredentials('course-123', 1, 10);
      });

      expect(result.current.credentials).toEqual(mockCredentials);
      expect(result.current.isLoadingCredentials).toBe(false);
      expect(response).toEqual(mockCredentials);
    });

    it('resets credentials on error and returns null', async () => {
      mockGetCredentialsList.mockReturnValue(mockWithUnwrapError(new Error('fetch error')));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleFetchCredentials('course-123');
      });

      expect(result.current.credentials).toEqual({
        result: { data: [], count: 0, num_pages: 0, page_number: 0 },
      });
      expect(result.current.isLoadingCredentials).toBe(false);
      expect(response).toBeNull();
    });

    it('calls with search and page params', async () => {
      mockGetCredentialsList.mockReturnValue(
        mockWithUnwrap({ result: { data: [], count: 0, num_pages: 0, page_number: 0 } }),
      );

      const { result } = renderHook(() => useCredentials());
      await act(async () => {
        await result.current.handleFetchCredentials('course-123', 2, 20, 'search-term');
      });

      expect(mockGetCredentialsList).toHaveBeenCalledWith({
        platformKey: 'test-tenant',
        username: 'test-user',
        course: 'course-123',
        page: 2,
        pageSize: 20,
        search: 'search-term',
      });
    });

    it('uses defaults for page and pageSize', async () => {
      mockGetCredentialsList.mockReturnValue(
        mockWithUnwrap({ result: { data: [], count: 0, num_pages: 0, page_number: 0 } }),
      );

      const { result } = renderHook(() => useCredentials());
      await act(async () => {
        await result.current.handleFetchCredentials();
      });

      expect(mockGetCredentialsList).toHaveBeenCalledWith({
        platformKey: 'test-tenant',
        username: 'test-user',
        course: undefined,
        page: 1,
        pageSize: 10,
        search: undefined,
      });
    });
  });

  describe('handleCreateCredential', () => {
    it('returns credential on success', async () => {
      const mockCredential = { entityId: 'cred-1', name: 'Test Credential' };
      mockCreateCredential.mockReturnValue(mockWithUnwrap(mockCredential));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleCreateCredential({ name: 'Test Credential' });
      });

      expect(response).toEqual(mockCredential);
    });

    it('returns null on error', async () => {
      mockCreateCredential.mockReturnValue(mockWithUnwrapError(new Error('create error')));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleCreateCredential({});
      });

      expect(response).toBeNull();
    });
  });

  describe('handleUpdateCredential', () => {
    it('returns updated credential on success', async () => {
      const mockCredential = { entityId: 'cred-1', name: 'Updated Credential' };
      mockUpdateCredential.mockReturnValue(mockWithUnwrap(mockCredential));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleUpdateCredential('cred-1', { name: 'Updated' });
      });

      expect(response).toEqual(mockCredential);
    });

    it('returns null on error', async () => {
      mockUpdateCredential.mockReturnValue(mockWithUnwrapError(new Error('update error')));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleUpdateCredential('cred-1', {});
      });

      expect(response).toBeNull();
    });

    it('passes entityId and requestBody correctly', async () => {
      const mockCredential = { entityId: 'cred-1' };
      mockUpdateCredential.mockReturnValue(mockWithUnwrap(mockCredential));

      const { result } = renderHook(() => useCredentials());
      await act(async () => {
        await result.current.handleUpdateCredential('cred-1', { name: 'Updated' });
      });

      expect(mockUpdateCredential).toHaveBeenCalledWith({
        platformKey: 'test-tenant',
        username: 'test-user',
        entityId: 'cred-1',
        requestBody: { name: 'Updated' },
      });
    });
  });

  describe('handleDeleteCredential', () => {
    it('returns true on success', async () => {
      mockDeleteCredential.mockReturnValue(mockWithUnwrap(undefined));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleDeleteCredential('cred-1');
      });

      expect(response).toBe(true);
    });

    it('returns false on error', async () => {
      mockDeleteCredential.mockReturnValue(mockWithUnwrapError(new Error('delete error')));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleDeleteCredential('cred-1');
      });

      expect(response).toBe(false);
    });

    it('passes entityId correctly', async () => {
      mockDeleteCredential.mockReturnValue(mockWithUnwrap(undefined));

      const { result } = renderHook(() => useCredentials());
      await act(async () => {
        await result.current.handleDeleteCredential('cred-123');
      });

      expect(mockDeleteCredential).toHaveBeenCalledWith({
        platformKey: 'test-tenant',
        username: 'test-user',
        entityId: 'cred-123',
      });
    });
  });

  describe('handleFetchIssuers', () => {
    it('fetches and sets issuers on success', async () => {
      const mockIssuersResponse = { result: { data: [{ entityId: 'issuer-1', name: 'Issuer 1' }] } };
      mockGetIssuers.mockReturnValue(mockWithUnwrap(mockIssuersResponse));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleFetchIssuers('search');
      });

      expect(result.current.issuers).toEqual(mockIssuersResponse.result.data);
      expect(result.current.isLoadingIssuers).toBe(false);
      expect(response).toEqual(mockIssuersResponse.result.data);
    });

    it('sets empty issuers on error and returns null', async () => {
      mockGetIssuers.mockReturnValue(mockWithUnwrapError(new Error('fetch error')));

      const { result } = renderHook(() => useCredentials());
      let response: any;
      await act(async () => {
        response = await result.current.handleFetchIssuers();
      });

      expect(result.current.issuers).toEqual([]);
      expect(result.current.isLoadingIssuers).toBe(false);
      expect(response).toBeNull();
    });

    it('handles issuers with empty data array', async () => {
      const mockIssuersResponse = { result: { data: [] } };
      mockGetIssuers.mockReturnValue(mockWithUnwrap(mockIssuersResponse));

      const { result } = renderHook(() => useCredentials());
      await act(async () => {
        await result.current.handleFetchIssuers();
      });

      expect(result.current.issuers).toEqual([]);
    });

    it('calls getIssuers with correct params', async () => {
      mockGetIssuers.mockReturnValue(mockWithUnwrap({ result: { data: [] } }));

      const { result } = renderHook(() => useCredentials());
      await act(async () => {
        await result.current.handleFetchIssuers('test-query');
      });

      expect(mockGetIssuers).toHaveBeenCalledWith({
        org: 'test-tenant',
        username: 'test-user',
        q: 'test-query',
      });
    });
  });
});
