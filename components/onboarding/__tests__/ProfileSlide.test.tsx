import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { StartPageContext } from '@/hooks/start/start-page-context';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

const mockUseTenantMetadata = vi.fn();
vi.mock('@iblai/iblai-js/web-utils', () => ({
  useTenantMetadata: () => mockUseTenantMetadata(),
}));

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
}));

import ProfileSlide from '../ProfileSlide';

const defaultContextValue = {
  fields: {
    roles: [],
    skills: [],
    resume: null,
    profileImage: null,
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: '',
    },
  },
  setFields: vi.fn(),
  handleToggleRole: vi.fn(),
  isRoleSelected: vi.fn(() => false),
  handleToggleSkill: vi.fn(),
  isSkillSelected: vi.fn(() => false),
  handleUpdateSkillRating: vi.fn(),
  handleProfileImageSelect: vi.fn(),
  profileImage: null,
  handleSocialLinksUpdate: vi.fn(),
  handleFileUpload: vi.fn(),
};

const defaultProps = {
  onNext: vi.fn(),
  onPrev: vi.fn(),
  isDragging: false,
  setIsDragging: vi.fn(),
};

const renderProfileSlide = (contextOverrides = {}, propOverrides = {}) => {
  return render(
    <StartPageContext.Provider value={{ ...defaultContextValue, ...contextOverrides }}>
      <ProfileSlide {...defaultProps} {...propOverrides} />
    </StartPageContext.Provider>,
  );
};

describe('ProfileSlide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenantMetadata.mockReturnValue({
      metadataLoaded: true,
      isSkillsResumeFeatureHidden: () => false,
    });
  });

  it('renders without crashing', () => {
    const { container } = renderProfileSlide();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays Profile Picture section', () => {
    renderProfileSlide();
    expect(screen.getByText('Profile Picture (Optional)')).toBeInTheDocument();
  });

  it('displays Social Networks section', () => {
    renderProfileSlide();
    expect(screen.getByText('Social Networks (Optional)')).toBeInTheDocument();
  });

  it('displays LinkedIn input', () => {
    renderProfileSlide();
    expect(screen.getByPlaceholderText('linkedin.com/in/username')).toBeInTheDocument();
  });

  it('displays Twitter input', () => {
    renderProfileSlide();
    expect(screen.getByPlaceholderText('twitter.com/username')).toBeInTheDocument();
  });

  it('displays Facebook input', () => {
    renderProfileSlide();
    expect(screen.getByPlaceholderText('facebook.com/username')).toBeInTheDocument();
  });

  it('calls handleSocialLinksUpdate when LinkedIn input changes', () => {
    const handleSocialLinksUpdate = vi.fn();
    renderProfileSlide({ handleSocialLinksUpdate });
    const input = screen.getByPlaceholderText('linkedin.com/in/username');
    fireEvent.change(input, { target: { value: 'linkedin.com/in/test' } });
    expect(handleSocialLinksUpdate).toHaveBeenCalledWith({
      socialType: 'linkedin',
      socialLink: 'linkedin.com/in/test',
    });
  });

  it('calls handleSocialLinksUpdate when Twitter input changes', () => {
    const handleSocialLinksUpdate = vi.fn();
    renderProfileSlide({ handleSocialLinksUpdate });
    const input = screen.getByPlaceholderText('twitter.com/username');
    fireEvent.change(input, { target: { value: 'twitter.com/test' } });
    expect(handleSocialLinksUpdate).toHaveBeenCalledWith({
      socialType: 'twitter',
      socialLink: 'twitter.com/test',
    });
  });

  it('calls handleSocialLinksUpdate when Facebook input changes', () => {
    const handleSocialLinksUpdate = vi.fn();
    renderProfileSlide({ handleSocialLinksUpdate });
    const input = screen.getByPlaceholderText('facebook.com/username');
    fireEvent.change(input, { target: { value: 'facebook.com/test' } });
    expect(handleSocialLinksUpdate).toHaveBeenCalledWith({
      socialType: 'facebook',
      socialLink: 'facebook.com/test',
    });
  });

  it('shows resume upload area when feature is not hidden', () => {
    renderProfileSlide();
    expect(screen.getByText('Drag and drop your resume here')).toBeInTheDocument();
  });

  it('hides resume upload area when feature is hidden', () => {
    mockUseTenantMetadata.mockReturnValue({
      metadataLoaded: true,
      isSkillsResumeFeatureHidden: () => true,
    });
    renderProfileSlide();
    expect(screen.queryByText('Drag and drop your resume here')).not.toBeInTheDocument();
  });

  it('hides resume upload area when metadata not loaded', () => {
    mockUseTenantMetadata.mockReturnValue({
      metadataLoaded: false,
      isSkillsResumeFeatureHidden: () => false,
    });
    renderProfileSlide();
    expect(screen.queryByText('Drag and drop your resume here')).not.toBeInTheDocument();
  });

  it('shows uploaded file info when resume is set', () => {
    renderProfileSlide({
      fields: {
        ...defaultContextValue.fields,
        resume: { name: 'resume.pdf', size: 1048576 },
      },
    });
    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.00 MB')).toBeInTheDocument();
  });

  it('shows Remove file button when resume is uploaded', () => {
    renderProfileSlide({
      fields: {
        ...defaultContextValue.fields,
        resume: { name: 'resume.pdf', size: 2097152 },
      },
    });
    expect(screen.getByText('Remove file')).toBeInTheDocument();
  });

  it('calls handleFileUpload with null when Remove file is clicked', () => {
    const handleFileUpload = vi.fn();
    renderProfileSlide({
      handleFileUpload,
      fields: {
        ...defaultContextValue.fields,
        resume: { name: 'resume.pdf', size: 2097152 },
      },
    });
    fireEvent.click(screen.getByText('Remove file'));
    expect(handleFileUpload).toHaveBeenCalledWith(null);
  });

  it('shows profile image when provided', () => {
    renderProfileSlide({ profileImage: 'https://example.com/photo.jpg' });
    const img = screen.getByAlt('Profile picture');
    expect(img).toBeInTheDocument();
  });

  it('shows Upload icon when no profile image', () => {
    renderProfileSlide({ profileImage: null });
    // Upload icon is from lucide-react, rendered as svg
    expect(screen.queryByAlt('Profile picture')).not.toBeInTheDocument();
  });
});
