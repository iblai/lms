import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CredentialModal } from '../credential-modal';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

const baseForm = {
  name: '',
  description: '',
  issuer: '',
  credential_type: '',
  issuing_signal: '',
  icon_image: '',
  icon_image_id: null,
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  editingCredential: null as any | null,
  credentialForm: { ...baseForm },
  setCredentialForm: vi.fn(),
  issuers: [] as any[],
  isLoadingIssuers: false,
  uploadingImage: false,
  savingCredential: false,
  handleImageUpload: vi.fn(),
  handleSaveCredential: vi.fn(),
};

const renderModal = (overrides: Partial<typeof defaultProps> = {}) =>
  render(<CredentialModal {...defaultProps} {...overrides} />);

describe('CredentialModal', () => {
  it('renders with "Add New Credential" title when editingCredential is null', () => {
    renderModal();
    expect(screen.getByTestId('credential-modal-title')).toHaveTextContent('Add New Credential');
  });

  it('renders with "Edit Credential" title when editingCredential is provided', () => {
    renderModal({ editingCredential: { id: 1 } });
    expect(screen.getByTestId('credential-modal-title')).toHaveTextContent('Edit Credential');
  });

  it('renders all form fields', () => {
    renderModal();
    expect(screen.getByTestId('credential-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('credential-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('credential-issuer-select')).toBeInTheDocument();
    expect(screen.getByTestId('credential-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('credential-issuing-signal-select')).toBeInTheDocument();
    expect(screen.getByTestId('credential-icon-input')).toBeInTheDocument();
  });

  it('populates form fields with credentialForm values', () => {
    const filledForm = {
      ...baseForm,
      name: 'Test Credential',
      description: 'A description',
      issuer: 'issuer-1',
      credential_type: 'CERTIFICATE',
      issuing_signal: 'COURSE_COMPLETED',
      icon_image: '',
      icon_image_id: null,
    };
    renderModal({
      credentialForm: filledForm,
      issuers: [{ entityId: 'issuer-1', name: 'Test Issuer' }],
    });
    expect(screen.getByTestId('credential-name-input')).toHaveValue('Test Credential');
    expect(screen.getByTestId('credential-description-input')).toHaveValue('A description');
    expect(screen.getByTestId('credential-issuer-select')).toHaveValue('issuer-1');
    expect(screen.getByTestId('credential-type-select')).toHaveValue('CERTIFICATE');
    expect(screen.getByTestId('credential-issuing-signal-select')).toHaveValue('COURSE_COMPLETED');
  });

  it('renders issuer options from issuers prop', () => {
    const issuers = [
      { entityId: 'iss-1', name: 'Issuer One' },
      { entityId: 'iss-2', name: 'Issuer Two' },
    ];
    renderModal({ issuers });
    expect(screen.getByText('Issuer One')).toBeInTheDocument();
    expect(screen.getByText('Issuer Two')).toBeInTheDocument();
  });

  it('disables issuer select and shows loading text when isLoadingIssuers is true', () => {
    renderModal({ isLoadingIssuers: true });
    expect(screen.getByTestId('credential-issuer-select')).toBeDisabled();
    expect(screen.getByText('Loading issuers...')).toBeInTheDocument();
  });

  it('does not show loading issuers text when isLoadingIssuers is false', () => {
    renderModal({ isLoadingIssuers: false });
    expect(screen.queryByText('Loading issuers...')).not.toBeInTheDocument();
  });

  it('shows uploading image text when uploadingImage is true', () => {
    renderModal({ uploadingImage: true });
    expect(screen.getByText('Uploading image...')).toBeInTheDocument();
  });

  it('does not show uploading image text when uploadingImage is false', () => {
    renderModal({ uploadingImage: false });
    expect(screen.queryByText('Uploading image...')).not.toBeInTheDocument();
  });

  it('disables file input when uploadingImage is true', () => {
    renderModal({ uploadingImage: true });
    expect(screen.getByTestId('credential-icon-input')).toBeDisabled();
  });

  it('shows icon preview and remove button when icon_image is set', () => {
    renderModal({
      credentialForm: { ...baseForm, icon_image: 'https://example.com/icon.png' },
    });
    expect(screen.getByAltText('Icon preview')).toBeInTheDocument();
    expect(screen.getByTestId('remove-icon-button')).toBeInTheDocument();
  });

  it('does not show icon preview when icon_image is empty', () => {
    renderModal();
    expect(screen.queryByAltText('Icon preview')).not.toBeInTheDocument();
    expect(screen.queryByTestId('remove-icon-button')).not.toBeInTheDocument();
  });

  it('calls setCredentialForm to clear icon when remove button is clicked', () => {
    const setCredentialForm = vi.fn();
    renderModal({
      credentialForm: { ...baseForm, icon_image: 'https://example.com/icon.png' },
      setCredentialForm,
    });
    fireEvent.click(screen.getByTestId('remove-icon-button'));
    expect(setCredentialForm).toHaveBeenCalled();
    // Call the updater function to verify it clears icon fields
    const updater = setCredentialForm.mock.calls[0][0];
    const result = updater(baseForm);
    expect(result.icon_image).toBe('');
    expect(result.icon_image_id).toBeNull();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByTestId('credential-modal-cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('disables Cancel button when savingCredential is true', () => {
    renderModal({ savingCredential: true });
    expect(screen.getByTestId('credential-modal-cancel')).toBeDisabled();
  });

  it('disables submit button when required fields are empty', () => {
    renderModal();
    expect(screen.getByTestId('credential-modal-submit')).toBeDisabled();
  });

  it('disables submit button when savingCredential is true', () => {
    renderModal({
      savingCredential: true,
      credentialForm: {
        ...baseForm,
        name: 'Test',
        issuer: 'iss-1',
        credential_type: 'CERTIFICATE',
        issuing_signal: 'COURSE_COMPLETED',
      },
    });
    expect(screen.getByTestId('credential-modal-submit')).toBeDisabled();
  });

  it('enables submit button when all required fields are filled and not saving', () => {
    renderModal({
      credentialForm: {
        ...baseForm,
        name: 'Test',
        issuer: 'iss-1',
        credential_type: 'CERTIFICATE',
        issuing_signal: 'COURSE_COMPLETED',
      },
    });
    expect(screen.getByTestId('credential-modal-submit')).not.toBeDisabled();
  });

  it('shows "Saving..." text on submit button when savingCredential is true', () => {
    renderModal({ savingCredential: true });
    expect(screen.getByTestId('credential-modal-submit')).toHaveTextContent('Saving...');
  });

  it('shows "Create" text on submit button for new credential', () => {
    renderModal();
    expect(screen.getByTestId('credential-modal-submit')).toHaveTextContent('Create');
  });

  it('shows "Update" text on submit button when editing', () => {
    renderModal({ editingCredential: { id: 1 } });
    expect(screen.getByTestId('credential-modal-submit')).toHaveTextContent('Update');
  });

  it('calls handleSaveCredential when submit button is clicked', () => {
    const handleSaveCredential = vi.fn();
    renderModal({
      handleSaveCredential,
      credentialForm: {
        ...baseForm,
        name: 'Test',
        issuer: 'iss-1',
        credential_type: 'CERTIFICATE',
        issuing_signal: 'COURSE_COMPLETED',
      },
    });
    fireEvent.click(screen.getByTestId('credential-modal-submit'));
    expect(handleSaveCredential).toHaveBeenCalled();
  });

  it('calls setCredentialForm when name input changes', () => {
    const setCredentialForm = vi.fn();
    renderModal({ setCredentialForm });
    fireEvent.change(screen.getByTestId('credential-name-input'), {
      target: { value: 'New Name' },
    });
    expect(setCredentialForm).toHaveBeenCalledTimes(1);
    expect(typeof setCredentialForm.mock.calls[0][0]).toBe('function');
  });

  it('calls setCredentialForm when description textarea changes', () => {
    const setCredentialForm = vi.fn();
    renderModal({ setCredentialForm });
    fireEvent.change(screen.getByTestId('credential-description-input'), {
      target: { value: 'New Desc' },
    });
    expect(setCredentialForm).toHaveBeenCalledTimes(1);
    expect(typeof setCredentialForm.mock.calls[0][0]).toBe('function');
  });

  it('calls setCredentialForm when issuer select changes', () => {
    const setCredentialForm = vi.fn();
    renderModal({
      setCredentialForm,
      issuers: [{ entityId: 'iss-1', name: 'Issuer One' }],
    });
    fireEvent.change(screen.getByTestId('credential-issuer-select'), {
      target: { value: 'iss-1' },
    });
    expect(setCredentialForm).toHaveBeenCalledTimes(1);
    expect(typeof setCredentialForm.mock.calls[0][0]).toBe('function');
  });

  it('calls setCredentialForm when credential type select changes', () => {
    const setCredentialForm = vi.fn();
    renderModal({ setCredentialForm });
    fireEvent.change(screen.getByTestId('credential-type-select'), {
      target: { value: 'CERTIFICATE' },
    });
    expect(setCredentialForm).toHaveBeenCalledTimes(1);
    expect(typeof setCredentialForm.mock.calls[0][0]).toBe('function');
  });

  it('calls setCredentialForm when issuing signal select changes', () => {
    const setCredentialForm = vi.fn();
    renderModal({ setCredentialForm });
    fireEvent.change(screen.getByTestId('credential-issuing-signal-select'), {
      target: { value: 'COURSE_PASSED' },
    });
    expect(setCredentialForm).toHaveBeenCalledTimes(1);
    expect(typeof setCredentialForm.mock.calls[0][0]).toBe('function');
  });

  it('does not render modal content when isOpen is false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByTestId('credential-modal')).not.toBeInTheDocument();
  });
});
