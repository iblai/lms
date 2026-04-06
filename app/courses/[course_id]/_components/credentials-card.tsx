'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronUp, Edit, Trash2, Award } from 'lucide-react';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useCredentials } from '@/hooks/courses/use-credentials';
import { CredentialModal } from './credential-modal';

interface CredentialsCardProps {
  courseId: string;
  expandedSections: Record<string, boolean>;
  toggleSection: (index: number | string) => void;
}

export function CredentialsCard({
  courseId,
  expandedSections,
  toggleSection,
}: CredentialsCardProps) {
  const {
    handleFetchCredentials,
    handleCreateCredential,
    handleUpdateCredential,
    handleDeleteCredential,
    handleFetchIssuers,
    handleImageUploadForCredentials,
    credentials,
    isLoadingCredentials,
    issuers,
    isLoadingIssuers,
  } = useCredentials();

  const [currentPage, setCurrentPage] = useState(1);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<any>(null);
  const [credentialForm, setCredentialForm] = useState({
    name: '',
    description: '',
    issuer: '',
    credential_type: '',
    issuing_signal: '',
    icon_image: '',
    icon_image_id: null as number | null,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingCredential, setSavingCredential] = useState(false);

  // Fetch credentials when expanded
  useEffect(() => {
    if (courseId) {
      handleFetchCredentials(courseId, currentPage, 10);
      handleFetchIssuers();
    }
  }, [courseId, currentPage]);

  const handleOpenCredentialModal = (credential?: any) => {
    if (credential) {
      setEditingCredential(credential);
      setCredentialForm({
        name: credential.name || '',
        description: credential.description || '',
        issuer: credential.issuerDetails?.entityId || credential.issuer || '',
        credential_type: credential.credentialType || credential.credential_type || '',
        issuing_signal: credential.signal || credential.issuing_signal || '',
        icon_image: credential.iconImage || credential.icon_image || '',
        icon_image_id: credential.icon_image_id || null,
      });
    } else {
      setEditingCredential(null);
      setCredentialForm({
        name: '',
        description: '',
        issuer: '',
        credential_type: '',
        issuing_signal: '',
        icon_image: '',
        icon_image_id: null,
      });
    }
    setIsCredentialModalOpen(true);
  };

  const handleCloseCredentialModal = () => {
    setIsCredentialModalOpen(false);
    setEditingCredential(null);
    setCredentialForm({
      name: '',
      description: '',
      issuer: '',
      credential_type: '',
      issuing_signal: '',
      icon_image: '',
      icon_image_id: null,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const uploadedImage = await handleImageUploadForCredentials(file);
      if (uploadedImage) {
        setCredentialForm((prev) => ({
          ...prev,
          icon_image: uploadedImage.image || '',
          icon_image_id: uploadedImage.id || null,
        }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveCredential = async () => {
    setSavingCredential(true);
    try {
      const requestBody: Record<string, any> = {
        name: credentialForm.name,
        description: credentialForm.description,
        issuer: credentialForm.issuer,
        credentialType: credentialForm.credential_type,
        issuing_signal: credentialForm.issuing_signal,
        courses: [courseId],
      };

      if (credentialForm.icon_image_id) {
        requestBody.icon_image_id = credentialForm.icon_image_id;
      }

      if (editingCredential) {
        await handleUpdateCredential(editingCredential.entityId, requestBody);
      } else {
        await handleCreateCredential(requestBody);
      }

      handleCloseCredentialModal();
      await handleFetchCredentials(courseId, currentPage, 10);
    } catch (error) {
      console.error('Error saving credential:', error);
    } finally {
      setSavingCredential(false);
    }
  };

  const handleDeleteCredentialClick = async (entityId: string) => {
    try {
      const success = await handleDeleteCredential(entityId);
      if (success) {
        await handleFetchCredentials(courseId, currentPage, 10);
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
    }
  };

  const totalPages = Math.ceil((credentials?.result?.count || 0) / 10);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-800">Credentials</h2>
          <button
            onClick={() => handleOpenCredentialModal()}
            className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] px-4 py-2 text-sm font-medium text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]"
            data-testid="add-credential-button"
            aria-label="Add Credential"
          >
            <Plus className="h-4 w-4" />
            Add Credential
          </button>
        </div>

        <div className="overflow-hidden rounded-md border border-gray-200">
          <div
            className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
            onClick={() => toggleSection('credentials')}
            role="button"
            aria-expanded={expandedSections['credentials']}
            aria-label="Toggle credential list"
            data-testid="credential-list-toggle"
          >
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-amber-500" />
              <h3 className="font-medium text-gray-800">Credential List</h3>
            </div>
            <div>
              {expandedSections['credentials'] ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {expandedSections['credentials'] && (
            <div className="border-t border-gray-200">
              {isLoadingCredentials ? (
                <div className="flex justify-center p-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
                </div>
              ) : credentials?.result?.data?.length === 0 ? (
                <div className="p-8">
                  <DefaultEmptyBox message="No credentials found." />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="credentials-table">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Entity ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Issuer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Credential Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {credentials?.result?.data?.map((credential: any, index: number) => (
                          <tr
                            key={`credential-${index}`}
                            className="hover:bg-gray-50"
                            data-testid={`credential-row-${index}`}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900">{credential.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {credential.entityId}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {credential.issuerDetails?.name || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {credential.credentialType || credential.credential_type || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenCredentialModal(credential)}
                                  className="rounded p-1 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-700"
                                  aria-label={`Edit ${credential.name}`}
                                  data-testid={`edit-credential-${index}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCredentialClick(credential.entityId)}
                                  className="rounded p-1 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                                  aria-label={`Delete ${credential.name}`}
                                  data-testid={`delete-credential-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => {
                                if (hasPrevPage) setCurrentPage(currentPage - 1);
                              }}
                              className={
                                !hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                              }
                            />
                          </PaginationItem>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => {
                                if (hasNextPage) setCurrentPage(currentPage + 1);
                              }}
                              className={
                                !hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <CredentialModal
        isOpen={isCredentialModalOpen}
        onClose={handleCloseCredentialModal}
        editingCredential={editingCredential}
        credentialForm={credentialForm}
        setCredentialForm={setCredentialForm}
        issuers={issuers}
        isLoadingIssuers={isLoadingIssuers}
        uploadingImage={uploadingImage}
        savingCredential={savingCredential}
        handleImageUpload={handleImageUpload}
        handleSaveCredential={handleSaveCredential}
      />
    </>
  );
}
