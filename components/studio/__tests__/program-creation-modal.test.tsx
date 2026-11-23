import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

const mockGetOrg = vi.fn();
vi.mock('@/utils/helpers', () => ({ getOrg: () => mockGetOrg() }));

const mockCreateProgram = vi.fn();
const mutationState = vi.hoisted(() => ({ isLoading: false }));
vi.mock('@/services/studio', () => ({
  useCreateStudioProgramMutation: () => [mockCreateProgram, mutationState],
}));

import { ProgramCreationModal } from '../program-creation-modal';

const unwrapResolve = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const unwrapReject = (error: unknown) => ({ unwrap: () => Promise.reject(error) });

describe('ProgramCreationModal', () => {
  const onOpenChange = vi.fn();
  const onCreated = vi.fn();
  const renderModal = (open = true) =>
    render(<ProgramCreationModal open={open} onOpenChange={onOpenChange} onCreated={onCreated} />);
  const typeName = (value: string) =>
    fireEvent.change(screen.getByLabelText('Program name *'), { target: { value } });
  const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create Program' }));

  beforeEach(() => {
    vi.clearAllMocks();
    mutationState.isLoading = false;
    mockGetOrg.mockReturnValue('org1');
    mockCreateProgram.mockReturnValue(unwrapResolve({}));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders nothing while closed', () => {
    renderModal(false);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('derives the program ID from the name until one is typed', () => {
    renderModal();
    typeName('Data Science Basics');
    expect(screen.getByLabelText('Program ID *')).toHaveValue('data-science-basics');

    fireEvent.change(screen.getByLabelText('Program ID *'), { target: { value: 'ds-101' } });
    typeName('Something Else');
    expect(screen.getByLabelText('Program ID *')).toHaveValue('ds-101');
  });

  it('rejects a blank name', () => {
    renderModal();
    submit();
    expect(mockToast.error).toHaveBeenCalledWith('Please enter a program name.');
    expect(mockCreateProgram).not.toHaveBeenCalled();
  });

  it('rejects an ID with unsupported characters', () => {
    renderModal();
    typeName('Data Science');
    fireEvent.change(screen.getByLabelText('Program ID *'), { target: { value: 'data science' } });
    submit();
    expect(mockToast.error).toHaveBeenCalledWith(
      'The program ID can only contain letters, numbers, hyphens and underscores.',
    );
    expect(mockCreateProgram).not.toHaveBeenCalled();
  });

  it('rejects submission when the org cannot be determined', () => {
    mockGetOrg.mockReturnValue(null);
    renderModal();
    typeName('Data Science');
    submit();
    expect(mockToast.error).toHaveBeenCalledWith(
      'Could not determine your organization. Please re-select your tenant.',
    );
    expect(mockCreateProgram).not.toHaveBeenCalled();
  });

  it('creates the program and reports what the server returned', async () => {
    mockCreateProgram.mockReturnValue(
      unwrapResolve({ program_id: 'ds', program_key: 'program-v1:org1+ds', name: 'Data Science' }),
    );
    renderModal();
    typeName(' Data Science ');
    submit();

    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith({
        program_id: 'ds',
        program_key: 'program-v1:org1+ds',
        name: 'Data Science',
      }),
    );
    expect(mockCreateProgram).toHaveBeenCalledWith({
      org: 'org1',
      programId: 'data-science',
      name: 'Data Science',
    });
    expect(mockToast.success).toHaveBeenCalledWith('Program created successfully.');
  });

  it('falls back to the submitted values when the response omits them', async () => {
    mockCreateProgram.mockReturnValue(unwrapResolve(undefined));
    renderModal();
    typeName('Data Science');
    submit();

    await waitFor(() =>
      expect(onCreated).toHaveBeenCalledWith({
        program_id: 'data-science',
        program_key: 'program-v1:org1+data-science',
        name: 'Data Science',
      }),
    );
  });

  it('reports a failed creation without closing', async () => {
    mockCreateProgram.mockReturnValue(unwrapReject(new Error('boom')));
    renderModal();
    typeName('Data Science');
    submit();

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith('Program creation failed. Please try again.'),
    );
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('disables the form and ignores submissions while one is in flight', () => {
    mutationState.isLoading = true;
    renderModal();
    typeName('Data Science');
    const button = screen.getByRole('button', { name: 'Create Program' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockCreateProgram).not.toHaveBeenCalled();
  });

  it('closes through Cancel', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
