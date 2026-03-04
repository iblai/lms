'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCredential: any | null;
  credentialForm: {
    name: string;
    description: string;
    issuer: string;
    credential_type: string;
    issuing_signal: string;
    icon_image: string;
    icon_image_id: number | null;
  };
  setCredentialForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      issuer: string;
      credential_type: string;
      issuing_signal: string;
      icon_image: string;
      icon_image_id: number | null;
    }>
  >;
  issuers: any[];
  isLoadingIssuers: boolean;
  uploadingImage: boolean;
  savingCredential: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleSaveCredential: () => Promise<void>;
}

export function CredentialModal({
  isOpen,
  onClose,
  editingCredential,
  credentialForm,
  setCredentialForm,
  issuers,
  isLoadingIssuers,
  uploadingImage,
  savingCredential,
  handleImageUpload,
  handleSaveCredential,
}: CredentialModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="credential-modal"
      >
        <DialogHeader>
          <DialogTitle data-testid="credential-modal-title">
            {editingCredential ? 'Edit Credential' : 'Add New Credential'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Credential Name */}
          <div>
            <label
              htmlFor="credential-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Credential Name <span className="text-red-500">*</span>
            </label>
            <input
              id="credential-name"
              type="text"
              value={credentialForm.name}
              onChange={(e) => setCredentialForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter credential name"
              data-testid="credential-name-input"
              aria-required="true"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="credential-description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="credential-description"
              value={credentialForm.description}
              onChange={(e) =>
                setCredentialForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter description"
              data-testid="credential-description-input"
            />
          </div>

          {/* Issuer */}
          <div>
            <label
              htmlFor="credential-issuer"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Issuer <span className="text-red-500">*</span>
            </label>
            <select
              id="credential-issuer"
              value={credentialForm.issuer}
              onChange={(e) => setCredentialForm((prev) => ({ ...prev, issuer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              disabled={isLoadingIssuers}
              data-testid="credential-issuer-select"
              aria-required="true"
              aria-label="Select an issuer"
            >
              <option value="">Select an issuer</option>
              {issuers.map((issuer) => (
                <option key={issuer.entityId} value={issuer.entityId}>
                  {issuer.name}
                </option>
              ))}
            </select>
            {isLoadingIssuers && <p className="text-xs text-gray-500 mt-1">Loading issuers...</p>}
          </div>

          {/* Credential Type */}
          <div>
            <label
              htmlFor="credential-type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Credential Type <span className="text-red-500">*</span>
            </label>
            <select
              id="credential-type"
              value={credentialForm.credential_type}
              onChange={(e) =>
                setCredentialForm((prev) => ({ ...prev, credential_type: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              data-testid="credential-type-select"
              aria-required="true"
              aria-label="Select credential type"
            >
              <option value="">Select credential type</option>
              <option value="MICRO_CREDENTIAL">Micro credential</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="PROGRAM_CERTIFICATE">Program certificate</option>
              <option value="COURSE_CERTIFICATE">Course certificate</option>
              <option value="PATHWAY_CERTIFICATE">Pathway certificate</option>
            </select>
          </div>

          {/* Issuing Signal */}
          <div>
            <label
              htmlFor="credential-issuing-signal"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Issuing Signal <span className="text-red-500">*</span>
            </label>
            <select
              id="credential-issuing-signal"
              value={credentialForm.issuing_signal}
              onChange={(e) =>
                setCredentialForm((prev) => ({ ...prev, issuing_signal: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              data-testid="credential-issuing-signal-select"
              aria-required="true"
              aria-label="Select issuing signal"
            >
              <option value="">Select issuing signal</option>
              <option value="COURSE_COMPLETED">Course completed</option>
              <option value="COURSE_PASSED">Course passed</option>
            </select>
          </div>

          {/* Icon Image Upload */}
          <div>
            <label
              htmlFor="credential-icon"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Icon Image
            </label>
            <div className="space-y-2">
              <input
                id="credential-icon"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                data-testid="credential-icon-input"
                aria-label="Upload icon image"
              />
              {uploadingImage && <p className="text-xs text-gray-500">Uploading image...</p>}
              {credentialForm.icon_image && (
                <div className="flex items-center gap-2">
                  <div className="relative w-16 h-16 border border-gray-200 rounded">
                    <Image
                      src={credentialForm.icon_image}
                      alt="Icon preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCredentialForm((prev) => ({
                        ...prev,
                        icon_image: '',
                        icon_image_id: null,
                      }))
                    }
                    className="text-xs text-red-600 hover:text-red-700"
                    data-testid="remove-icon-button"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={savingCredential}
            data-testid="credential-modal-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveCredential}
            disabled={
              savingCredential ||
              !credentialForm.name ||
              !credentialForm.issuer ||
              !credentialForm.credential_type ||
              !credentialForm.issuing_signal
            }
            className="px-4 py-2 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md text-sm font-medium hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="credential-modal-submit"
          >
            {savingCredential ? 'Saving...' : editingCredential ? 'Update' : 'Create'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
