import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

import { AccountDialog } from '../account-dialog';

describe('AccountDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    initialInfo: {
      fullName: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      title: 'Developer',
      about: 'About me',
      language: 'English',
      mentorAI: false,
      skillsLeaderboard: false,
      facebook: '',
      linkedin: '',
      twitter: '',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    const { container } = render(<AccountDialog {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('does not render when closed', () => {
    const { queryByTestId } = render(<AccountDialog {...defaultProps} open={false} />);
    expect(queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders Basic tab by default', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByRole('heading', { name: 'Basic' })).toBeInTheDocument();
  });

  it('renders all navigation tabs', () => {
    render(<AccountDialog {...defaultProps} />);
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('button', { name: 'Basic' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Social' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Security' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Admin' })).toBeInTheDocument();
  });

  it('renders Full Name field in basic tab', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('Full Name')).toBeInTheDocument();
  });

  it('renders Email field in basic tab', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders Username field in basic tab', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

  it('renders Title field in basic tab', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('renders About field in basic tab', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders Language field in basic tab', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('renders preferences checkboxes in basic tab', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('Public Profile')).toBeInTheDocument();
    expect(screen.getByText('Mentor AI')).toBeInTheDocument();
    expect(screen.getByText('Skills Leaderboard')).toBeInTheDocument();
  });

  it('renders profile name from initialInfo', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders ADMIN badge', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('switches to Social tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Social'));
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });

  it('switches to Security tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Security'));
    expect(screen.getByText('Send Password Reset Link')).toBeInTheDocument();
    expect(screen.getByText('Click to reset your password.')).toBeInTheDocument();
  });

  it('switches to Admin tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.getByPlaceholderText('Search Users')).toBeInTheDocument();
    expect(screen.getByText('sonitwo')).toBeInTheDocument();
  });

  it('hides Save button on Security tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Security'));
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('shows Save button on Basic tab', () => {
    render(<AccountDialog {...defaultProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows Save button on Social tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Social'));
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows Save button on Admin tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('calls onSave and closes dialog when Save is clicked', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Save'));
    expect(defaultProps.onSave).toHaveBeenCalled();
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles password reset click', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Security'));
    fireEvent.click(screen.getByText('Send Password Reset Link'));
    expect(alertSpy).toHaveBeenCalledWith('Password reset link sent to your email');
    alertSpy.mockRestore();
  });

  it('filters users in admin tab by search query', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Admin'));
    const searchInput = screen.getByPlaceholderText('Search Users');
    fireEvent.change(searchInput, { target: { value: 'sonitwo' } });
    expect(screen.getByText('sonitwo')).toBeInTheDocument();
    expect(screen.queryByText('Brian Ngabidong')).not.toBeInTheDocument();
  });

  it('shows "No users found" when search matches nothing', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Admin'));
    const searchInput = screen.getByPlaceholderText('Search Users');
    fireEvent.change(searchInput, { target: { value: 'nonexistentuser' } });
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('updates full name input', () => {
    render(<AccountDialog {...defaultProps} />);
    const fullNameInput = screen.getByPlaceholderText('Enter your full name');
    fireEvent.change(fullNameInput, { target: { value: 'New Name' } });
    expect(fullNameInput).toHaveValue('New Name');
  });

  it('updates email input', () => {
    render(<AccountDialog {...defaultProps} />);
    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.change(emailInput, { target: { value: 'new@email.com' } });
    expect(emailInput).toHaveValue('new@email.com');
  });

  it('updates about textarea', () => {
    render(<AccountDialog {...defaultProps} />);
    const aboutTextarea = screen.getByPlaceholderText('Tell us about yourself');
    fireEvent.change(aboutTextarea, { target: { value: 'New about' } });
    expect(aboutTextarea).toHaveValue('New about');
  });

  it('toggles mentorAI checkbox', () => {
    render(<AccountDialog {...defaultProps} />);
    const mentorCheckbox = screen.getByLabelText('Display Mentor AI');
    fireEvent.click(mentorCheckbox);
    expect(mentorCheckbox).toBeChecked();
  });

  it('toggles skillsLeaderboard checkbox', () => {
    render(<AccountDialog {...defaultProps} />);
    const leaderboardCheckbox = screen.getByLabelText('Display Leaderboard');
    fireEvent.click(leaderboardCheckbox);
    expect(leaderboardCheckbox).toBeChecked();
  });

  it('toggles publicProfile checkbox', () => {
    render(<AccountDialog {...defaultProps} />);
    const publicProfileCheckbox = screen.getByLabelText('Make Profile Public');
    fireEvent.click(publicProfileCheckbox);
    expect(publicProfileCheckbox).toBeChecked();
  });

  it('updates facebook input in social tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Social'));
    const fbInput = screen.getByPlaceholderText('Facebook Username');
    fireEvent.change(fbInput, { target: { value: 'myFacebook' } });
    expect(fbInput).toHaveValue('myFacebook');
  });

  it('updates linkedin input in social tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Social'));
    const linkedinInput = screen.getByPlaceholderText('LinkedIn Username');
    fireEvent.change(linkedinInput, { target: { value: 'myLinkedIn' } });
    expect(linkedinInput).toHaveValue('myLinkedIn');
  });

  it('updates twitter input in social tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Social'));
    const twitterInput = screen.getByPlaceholderText('X Username');
    fireEvent.change(twitterInput, { target: { value: 'myTwitter' } });
    expect(twitterInput).toHaveValue('myTwitter');
  });

  it('renders without initialInfo', () => {
    const { container } = render(
      <AccountDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />,
    );
    expect(container).toBeTruthy();
  });

  it('closes dialog via X button', () => {
    render(<AccountDialog {...defaultProps} />);
    const rounded = screen
      .getAllByRole('button')
      .filter((btn) => typeof btn.className === 'string' && btn.className.includes('rounded-full'));
    const closeButton = rounded[rounded.length - 1];
    fireEvent.click(closeButton);
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders all users in admin tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.getByText('sonitwo')).toBeInTheDocument();
    expect(screen.getByText('Ibl')).toBeInTheDocument();
    expect(screen.getByText('Brian Ngabidong')).toBeInTheDocument();
    expect(screen.getByText('Mikel Amigot')).toBeInTheDocument();
  });

  it('displays user emails in admin tab', () => {
    render(<AccountDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.getByText('sonitwo@ibleducation.com')).toBeInTheDocument();
    expect(screen.getByText('iblai@ibleducation.com')).toBeInTheDocument();
  });
});
