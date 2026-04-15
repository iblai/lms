import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('@/constants/assets', () => ({
  CREDENTIAL_DEFAULT_IMG: '/images/credentials/default_badge.png',
}));

vi.mock('@/utils/helpers', () => ({
  getRandomCourseImage: vi.fn(() => '/random-course.jpg'),
  inBrowserPrint: vi.fn(),
}));

vi.mock('dayjs', () => {
  const dayjs = (_date: any) => ({
    format: (_fmt: string) => 'Jan 1, 2024',
  });
  dayjs.default = dayjs;
  return { default: dayjs };
});

vi.mock('lodash', () => ({
  default: {
    isEmpty: (obj: any) => !obj || Object.keys(obj).length === 0,
  },
}));

import { CredentialDetailModal } from '../credential-detail-modal';
import { inBrowserPrint } from '@/utils/helpers';

describe('CredentialDetailModal', () => {
  const mockOnClose = vi.fn();

  const defaultCredential = {
    credentialDetails: {
      name: 'Test Credential',
      iconImage: '/test-icon.png',
      issuerDetails: {
        name: 'Test Issuer',
      },
    },
    course: {
      name: 'Test Course',
      course_id: 'course-v1:Test+101',
    },
    issuedOn: '2024-01-01',
    recipient: {
      name: 'John Doe',
      username: 'johndoe',
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when credential is null', () => {
    const { container } = render(<CredentialDetailModal credential={null} onClose={mockOnClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders without crashing when credential is provided', () => {
    const { container } = render(
      <CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders Credential Details heading', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    expect(screen.getByText('Credential Details')).toBeInTheDocument();
  });

  it('renders credential icon image', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    const img = screen.getByAltText('Test Credential');
    expect(img).toHaveAttribute('src', '/test-icon.png');
  });

  it('renders issuer name', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    expect(screen.getByText('Issued by Test Issuer')).toBeInTheDocument();
  });

  it('renders course section when course exists', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getAllByText('Test Course').length).toBeGreaterThanOrEqual(1);
  });

  it('renders issued date', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    expect(screen.getByText('Issued on')).toBeInTheDocument();
    // dayjs mock returns 'Jan 1, 2024'
    const dates = screen.getAllByText('Jan 1, 2024');
    expect(dates.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClose when close button is clicked', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    const buttons = screen.getAllByRole('button');
    // Close button is the first button (X icon)
    const closeBtn = buttons[0];
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders Download Certificate button', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    expect(screen.getByText('Download Certificate')).toBeInTheDocument();
  });

  it('calls inBrowserPrint when Download Certificate is clicked', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Download Certificate'));
    expect(inBrowserPrint).toHaveBeenCalled();
  });

  it('renders the credential name as heading', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    const headings = screen.getAllByText('Test Credential');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders default icon when no iconImage', () => {
    const credNoIcon = {
      ...defaultCredential,
      credentialDetails: {
        ...defaultCredential.credentialDetails,
        iconImage: null,
      },
    };
    render(<CredentialDetailModal credential={credNoIcon} onClose={mockOnClose} />);
    const img = screen.getByAltText('Test Credential');
    expect(img).toHaveAttribute('src', '/images/credentials/default_badge.png');
  });

  it('uses recipient name in description', () => {
    render(<CredentialDetailModal credential={defaultCredential} onClose={mockOnClose} />);
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it('uses "You" when recipient has no name or username', () => {
    const credNoRecipient = {
      ...defaultCredential,
      recipient: {},
    };
    render(<CredentialDetailModal credential={credNoRecipient} onClose={mockOnClose} />);
    expect(screen.getByText(/You/)).toBeInTheDocument();
  });

  it('hides course section when course is empty', () => {
    const credNoCourse = {
      ...defaultCredential,
      course: {},
    };
    render(<CredentialDetailModal credential={credNoCourse} onClose={mockOnClose} />);
    // lodash isEmpty returns true for empty object, so Course heading should not show
    expect(screen.queryByText('Course')).not.toBeInTheDocument();
  });

  it('uses default credential name when name is missing', () => {
    const credNoName = {
      ...defaultCredential,
      credentialDetails: {
        ...defaultCredential.credentialDetails,
        name: null,
      },
    };
    render(<CredentialDetailModal credential={credNoName} onClose={mockOnClose} />);
    const img = screen.getByAltText('Credential');
    expect(img).toBeInTheDocument();
  });

  it('uses default issuer name "-" when issuer is missing', () => {
    const credNoIssuer = {
      ...defaultCredential,
      credentialDetails: {
        ...defaultCredential.credentialDetails,
        issuerDetails: null,
      },
    };
    render(<CredentialDetailModal credential={credNoIssuer} onClose={mockOnClose} />);
    expect(screen.getByText('Issued by -')).toBeInTheDocument();
  });

  it('uses "a course" when course name is missing', () => {
    const credNoCourseName = {
      ...defaultCredential,
      course: { course_id: 'x' },
    };
    render(<CredentialDetailModal credential={credNoCourseName} onClose={mockOnClose} />);
    expect(screen.getByText(/a course/)).toBeInTheDocument();
  });
});
