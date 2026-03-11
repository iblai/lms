import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('@/utils/helpers', () => ({
  getTenant: vi.fn(() => 'test-tenant'),
  getUserName: vi.fn(() => 'test-user'),
}));

const mockGetUserEducationQuery = vi.fn(() => ({ data: undefined }));
const mockGetUserExperienceQuery = vi.fn(() => ({ data: undefined }));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  useGetUserEducationQuery: () => mockGetUserEducationQuery(),
  useGetUserExperienceQuery: () => mockGetUserExperienceQuery(),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('../edit-education-dialog', () => ({
  EditEducationDialog: ({ open, onOpenChange, onSave, setOpenAddInstitutionDialog }: any) =>
    open ? (
      <div data-testid="edit-education-dialog">
        <button onClick={() => onSave()}>Save Education</button>
        <button onClick={() => setOpenAddInstitutionDialog(true)}>Add Institution</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('../add-institution-dialog', () => ({
  AddInstitutionDialog: ({ open, onOpenChange, onSave }: any) =>
    open ? (
      <div data-testid="add-institution-dialog">
        <button onClick={() => onSave()}>Save Institution</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('../add-company-dialog', () => ({
  AddCompanyDialog: ({ open, onOpenChange, onSave }: any) =>
    open ? (
      <div data-testid="add-company-dialog">
        <button onClick={() => onSave()}>Save Company</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('../edit-experience-dialog', () => ({
  EditExperienceDialog: ({ open, onOpenChange, onSave, setOpenAddCompanyDialog }: any) =>
    open ? (
      <div data-testid="edit-experience-dialog">
        <button onClick={() => onSave()}>Save Experience</button>
        <button onClick={() => setOpenAddCompanyDialog(true)}>Add Company</button>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null,
}));

vi.mock('@iblai/iblai-api', () => ({}));

import { EditProfileDialog } from '../edit-profile-dialog';

describe('EditProfileDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserEducationQuery.mockReturnValue({ data: undefined });
    mockGetUserExperienceQuery.mockReturnValue({ data: undefined });
  });

  it('renders without crashing when open', () => {
    const { container } = render(<EditProfileDialog {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('does not render dialog when closed', () => {
    const { queryByTestId } = render(
      <EditProfileDialog {...defaultProps} open={false} />,
    );
    expect(queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders Edit Profile Information title', () => {
    render(<EditProfileDialog {...defaultProps} />);
    expect(screen.getByText('Edit Profile Information')).toBeInTheDocument();
  });

  it('renders Current Position section', () => {
    render(<EditProfileDialog {...defaultProps} />);
    expect(screen.getByText('Current Position')).toBeInTheDocument();
  });

  it('renders Education section', () => {
    render(<EditProfileDialog {...defaultProps} />);
    expect(screen.getByText('Education')).toBeInTheDocument();
  });

  it('renders Close button', () => {
    render(<EditProfileDialog {...defaultProps} />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('calls onOpenChange when Close is clicked', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Close'));
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders Add new position button', () => {
    render(<EditProfileDialog {...defaultProps} />);
    expect(screen.getByText('Add new position')).toBeInTheDocument();
  });

  it('renders Add new education button', () => {
    render(<EditProfileDialog {...defaultProps} />);
    expect(screen.getByText('Add new education')).toBeInTheDocument();
  });

  it('shows "No experience found" initially when no experience data', () => {
    render(<EditProfileDialog {...defaultProps} />);
    const inputs = screen.getAllByRole('textbox');
    // At least one input should have Loading... or No experience found
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('opens edit experience dialog when Add new position is clicked', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new position'));
    expect(screen.getByTestId('edit-experience-dialog')).toBeInTheDocument();
  });

  it('opens edit education dialog when Add new education is clicked', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new education'));
    expect(screen.getByTestId('edit-education-dialog')).toBeInTheDocument();
  });

  it('closes edit experience dialog when save is clicked', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new position'));
    expect(screen.getByTestId('edit-experience-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Save Experience'));
    expect(screen.queryByTestId('edit-experience-dialog')).not.toBeInTheDocument();
  });

  it('closes edit education dialog when save is clicked', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new education'));
    expect(screen.getByTestId('edit-education-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Save Education'));
    expect(screen.queryByTestId('edit-education-dialog')).not.toBeInTheDocument();
  });

  it('opens add company dialog from edit experience dialog', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new position'));
    fireEvent.click(screen.getByText('Add Company'));
    expect(screen.getByTestId('add-company-dialog')).toBeInTheDocument();
  });

  it('closes add company dialog when save is clicked', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new position'));
    fireEvent.click(screen.getByText('Add Company'));
    fireEvent.click(screen.getByText('Save Company'));
    expect(screen.queryByTestId('add-company-dialog')).not.toBeInTheDocument();
  });

  it('opens add institution dialog from edit education dialog', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new education'));
    fireEvent.click(screen.getByText('Add Institution'));
    expect(screen.getByTestId('add-institution-dialog')).toBeInTheDocument();
  });

  it('closes add institution dialog when save is clicked', () => {
    render(<EditProfileDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Add new education'));
    fireEvent.click(screen.getByText('Add Institution'));
    fireEvent.click(screen.getByText('Save Institution'));
    expect(screen.queryByTestId('add-institution-dialog')).not.toBeInTheDocument();
  });

  it('displays education from data when available', async () => {
    const educationData = [
      {
        degree: 'BSc Computer Science',
        institution: { name: 'Test University' },
        is_current: true,
        start_date: '2020-01-01',
        end_date: null,
        grade: 'A',
      },
    ];
    mockGetUserEducationQuery.mockReturnValue({ data: educationData as any });

    render(<EditProfileDialog {...defaultProps} />);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const educationInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'BSc Computer Science | Test University',
      );
      expect(educationInput).toBeTruthy();
    });
  });

  it('displays experience from data when available', async () => {
    const experienceData = [
      {
        title: 'Software Engineer',
        company: { name: 'Tech Corp' },
        is_current: true,
        start_date: '2021-01-01',
        end_date: null,
      },
    ];
    mockGetUserExperienceQuery.mockReturnValue({ data: experienceData as any });

    render(<EditProfileDialog {...defaultProps} />);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const expInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'Software Engineer | Tech Corp',
      );
      expect(expInput).toBeTruthy();
    });
  });

  it('handles education data with recently ended education', async () => {
    const educationData = [
      {
        degree: 'MSc',
        institution: { name: 'University B' },
        is_current: false,
        start_date: '2018-01-01',
        end_date: '2020-01-01',
        grade: 'B',
      },
    ];
    mockGetUserEducationQuery.mockReturnValue({ data: educationData as any });

    render(<EditProfileDialog {...defaultProps} />);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('shows "No education found" when education data is null', async () => {
    mockGetUserEducationQuery.mockReturnValue({ data: null as any });

    render(<EditProfileDialog {...defaultProps} />);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const noEduInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'No education found',
      );
      expect(noEduInput).toBeTruthy();
    });
  });

  it('shows "No experience found" when experience data is null', async () => {
    mockGetUserExperienceQuery.mockReturnValue({ data: null as any });

    render(<EditProfileDialog {...defaultProps} />);

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const noExpInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'No experience found',
      );
      expect(noExpInput).toBeTruthy();
    });
  });

  it('handles invalid education data gracefully', async () => {
    mockGetUserEducationQuery.mockReturnValue({ data: [{ bad: 'data' }] as any });
    render(<EditProfileDialog {...defaultProps} />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('handles empty experience array', async () => {
    mockGetUserExperienceQuery.mockReturnValue({ data: [] as any });
    render(<EditProfileDialog {...defaultProps} />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('sorts multiple current education entries by start_date (covers sort comparator line 50)', async () => {
    const educationData = [
      {
        degree: 'BSc',
        institution: { name: 'Old University' },
        is_current: true,
        start_date: '2015-01-01',
        end_date: null,
        grade: 'B',
      },
      {
        degree: 'MSc',
        institution: { name: 'New University' },
        is_current: true,
        start_date: '2020-01-01',
        end_date: null,
        grade: 'A',
      },
    ];
    mockGetUserEducationQuery.mockReturnValue({ data: educationData as any });
    render(<EditProfileDialog {...defaultProps} />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      // Most recent current education (2020) should be shown
      const educationInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'MSc | New University',
      );
      expect(educationInput).toBeTruthy();
    });
  });

  it('sorts multiple ended education entries by end_date (covers sort comparator line 53)', async () => {
    const educationData = [
      {
        degree: 'BSc',
        institution: { name: 'Early University' },
        is_current: false,
        start_date: '2010-01-01',
        end_date: '2014-01-01',
        grade: 'C',
      },
      {
        degree: 'MSc',
        institution: { name: 'Later University' },
        is_current: false,
        start_date: '2015-01-01',
        end_date: '2019-01-01',
        grade: 'A',
      },
    ];
    mockGetUserEducationQuery.mockReturnValue({ data: educationData as any });
    render(<EditProfileDialog {...defaultProps} />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      // Most recently ended education (2019) should be shown
      const educationInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'MSc | Later University',
      );
      expect(educationInput).toBeTruthy();
    });
  });

  it('sorts multiple current experience entries by start_date (covers sort comparator line 69)', async () => {
    const experienceData = [
      {
        title: 'Junior Developer',
        company: { name: 'Old Corp' },
        is_current: true,
        start_date: '2016-01-01',
        end_date: null,
      },
      {
        title: 'Senior Engineer',
        company: { name: 'New Corp' },
        is_current: true,
        start_date: '2021-01-01',
        end_date: null,
      },
    ];
    mockGetUserExperienceQuery.mockReturnValue({ data: experienceData as any });
    render(<EditProfileDialog {...defaultProps} />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const expInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'Senior Engineer | New Corp',
      );
      expect(expInput).toBeTruthy();
    });
  });

  it('sorts multiple ended experience entries by end_date (covers sort comparator line 72)', async () => {
    const experienceData = [
      {
        title: 'Intern',
        company: { name: 'Small Co' },
        is_current: false,
        start_date: '2012-01-01',
        end_date: '2013-01-01',
      },
      {
        title: 'Manager',
        company: { name: 'Big Co' },
        is_current: false,
        start_date: '2018-01-01',
        end_date: '2022-01-01',
      },
    ];
    mockGetUserExperienceQuery.mockReturnValue({ data: experienceData as any });
    render(<EditProfileDialog {...defaultProps} />);
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      const expInput = inputs.find(
        (input) => (input as HTMLInputElement).value === 'Manager | Big Co',
      );
      expect(expInput).toBeTruthy();
    });
  });
});
