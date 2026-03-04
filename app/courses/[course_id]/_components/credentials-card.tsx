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
    if (expandedSections['credentials'] && courseId) {
      handleFetchCredentials(courseId, currentPage, 10);
      handleFetchIssuers();
    }
  }, [expandedSections['credentials'], courseId, currentPage]);

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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Credentials</h2>
          <button
            onClick={() => handleOpenCredentialModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] rounded-md text-sm font-medium hover:opacity-[var(--button-primary-hover-opacity)] transition-opacity"
            data-testid="add-credential-button"
            aria-label="Add Credential"
          >
            <Plus className="h-4 w-4" />
            Add Credential
          </button>
        </div>

        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div
            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
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
                <div className="p-8 flex justify-center">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : credentials?.result?.data?.length === 0 ? (
                <div className="p-8">
                  <DefaultEmptyBox message="No credentials found." />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full" data-testid="credentials-table">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entity ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Issuer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credential Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
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
                                  className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                                  aria-label={`Edit ${credential.name}`}
                                  data-testid={`edit-credential-${index}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCredentialClick(credential.entityId)}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
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
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
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
