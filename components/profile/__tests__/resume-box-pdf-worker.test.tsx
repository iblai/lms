import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The worker source is assigned at module scope in resume-box.tsx. Make the
// assignment throw so the module's catch runs on import.
const workerAssignmentError = new Error('worker source rejected');

vi.mock('react-pdf', () => ({
  Document: () => null,
  Page: () => null,
  pdfjs: {
    version: '3.0.0',
    GlobalWorkerOptions: {
      set workerSrc(_value: string) {
        throw workerAssignmentError;
      },
      get workerSrc() {
        return '';
      },
    },
  },
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: () => 'test-tenant',
  getUserName: () => 'test-user',
}));
vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserResumeQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}));
vi.mock('../default-empty-box', () => ({ DefaultEmptyBox: () => null }));

describe('ResumeBox pdf.js worker setup', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  // Previously a console.log, which never reaches Sentry's error capture — and
  // without the worker no resume ever renders.
  it('reports a failure to set the worker source at error level', async () => {
    await import('../resume-box');

    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to set pdfjs worker source:',
      workerAssignmentError,
    );
  });

  it('still exports a usable component', async () => {
    const { ResumeBox } = await import('../resume-box');

    expect(typeof ResumeBox).toBe('function');
  });
});
