import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">Search</span>,
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  ChevronLeft: () => <span data-testid="chevron-left">ChevronLeft</span>,
  ChevronRight: () => <span data-testid="chevron-right">ChevronRight</span>,
}));

// Mock lodash
vi.mock('lodash', () => ({
  default: {
    isEmpty: vi.fn(
      (val: any) => !val || (Array.isArray(val) ? val.length === 0 : Object.keys(val).length === 0),
    ),
  },
}));

// Mock useProfileSkills
const mockHandleSkillsDeletion = vi.fn();
const mockHandleSkillsUpdate = vi.fn();

vi.mock('@/hooks/profile/use-profile-skills', () => ({
  useProfileSkills: vi.fn(() => ({
    earnedSkills: null,
    earnedSkillsLoading: false,
    earnedSkillsError: false,
    earnedSkillsSuccess: false,
    selfReportedSkills: null,
    selfReportedSkillsError: false,
    selfReportedSkillsLoading: false,
    selfReportedSkillsSuccess: false,
    desiredSkills: null,
    desiredSkillsLoading: false,
    desiredSkillsError: false,
    desiredSkillsSuccess: false,
    handleSkillsDeletion: mockHandleSkillsDeletion,
    updatingSkill: false,
    deletingSkill: false,
    handleSkillsUpdate: mockHandleSkillsUpdate,
  })),
}));

// Mock AddSkillDialog
vi.mock('@/components/add-skill-dialog', () => ({
  AddSkillDialog: ({ open, onOpenChange, type }: any) =>
    open ? (
      <div data-testid="add-skill-dialog" data-type={type}>
        AddSkillDialog
        <button onClick={() => onOpenChange(false)} data-testid="close-add-skill">
          Close
        </button>
      </div>
    ) : null,
}));

// Mock SkillDetailModal
vi.mock('@/components/skill-detail-modal', () => ({
  SkillDetailModal: ({ skill, onClose, onRatingChange, onDeleteSkill, onConfirm }: any) => (
    <div data-testid="skill-detail-modal" data-skill-name={skill?.name}>
      SkillDetailModal
      <button onClick={onClose} data-testid="close-skill-modal">
        Close
      </button>
      <button onClick={() => onRatingChange(3)} data-testid="change-rating">
        Change Rating
      </button>
      <button onClick={onDeleteSkill} data-testid="delete-skill">
        Delete
      </button>
      <button onClick={onConfirm} data-testid="confirm-skill">
        Confirm
      </button>
    </div>
  ),
}));

// Mock SkillBox
vi.mock('@/components/skill-box', () => ({
  SkillBox: ({ skill, onSkillClick, showRating }: any) => (
    <div
      data-testid="skill-box"
      data-skill-name={skill?.name}
      data-show-rating={showRating}
      onClick={onSkillClick}
    >
      {skill?.name}
    </div>
  ),
}));

// Mock SkeletonSkillBox
vi.mock('@/components/skeleton-skill-box', () => ({
  SkeletonSkillBox: () => <div data-testid="skeleton-skill-box">Loading...</div>,
}));

// Mock DefaultEmptyBox
vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message, className }: any) => (
    <div data-testid="default-empty-box" className={className}>
      {message}
    </div>
  ),
}));

// Mock SkeletonMultiplier
vi.mock('@/components/skeleton-multiplier', () => ({
  SkeletonMultiplier: ({ multiplier }: any) => (
    <div data-testid="skeleton-multiplier" data-multiplier={multiplier}>
      Loading skeletons
    </div>
  ),
}));

import SkillsPage from '../page';
import { useProfileSkills } from '@/hooks/profile/use-profile-skills';

describe('SkillsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProfileSkills).mockReturnValue({
      earnedSkills: null,
      earnedSkillsLoading: false,
      earnedSkillsError: false,
      earnedSkillsSuccess: false,
      selfReportedSkills: null,
      selfReportedSkillsError: false,
      selfReportedSkillsLoading: false,
      selfReportedSkillsSuccess: false,
      desiredSkills: null,
      desiredSkillsLoading: false,
      desiredSkillsError: false,
      desiredSkillsSuccess: false,
      handleSkillsDeletion: mockHandleSkillsDeletion,
      updatingSkill: false,
      deletingSkill: false,
      handleSkillsUpdate: mockHandleSkillsUpdate,
    } as any);
  });

  it('renders without crashing', () => {
    const { container } = render(<SkillsPage />);
    expect(container).toBeTruthy();
  });

  it('renders search input', () => {
    render(<SkillsPage />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders Earned, Self-Reported, and Desired sections', () => {
    render(<SkillsPage />);
    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByText('Self-Reported')).toBeInTheDocument();
    expect(screen.getByText('Desired')).toBeInTheDocument();
  });

  it('handles search input change', () => {
    render(<SkillsPage />);
    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'python' } });
    expect(searchInput).toHaveValue('python');
  });

  // Earned skills tests
  it('shows SkeletonMultiplier when earned skills are loading', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      earnedSkillsLoading: true,
      earnedSkillsError: false,
      earnedSkillsSuccess: false,
    } as any);

    render(<SkillsPage />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  it('shows DefaultEmptyBox when earned skills error', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      earnedSkillsLoading: false,
      earnedSkillsError: true,
      earnedSkillsSuccess: false,
    } as any);

    render(<SkillsPage />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    const earnedEmptyBox = emptyBoxes.find((el) =>
      el.textContent?.includes("You don't have any earned skills yet."),
    );
    expect(earnedEmptyBox).toBeInTheDocument();
  });

  it('shows DefaultEmptyBox when earned skills success but empty', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      earnedSkillsLoading: false,
      earnedSkillsError: false,
      earnedSkillsSuccess: true,
      earnedSkills: null,
    } as any);

    render(<SkillsPage />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    const earnedEmptyBox = emptyBoxes.find((el) =>
      el.textContent?.includes("You don't have any earned skills yet."),
    );
    expect(earnedEmptyBox).toBeInTheDocument();
  });

  it('renders earned SkillBox list when skills exist', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      earnedSkillsLoading: false,
      earnedSkillsError: false,
      earnedSkillsSuccess: true,
      earnedSkills: {
        resources: [
          { name: 'Python', points: 5 },
          { name: 'JavaScript', points: 3 },
        ],
      },
    } as any);

    render(<SkillsPage />);
    const skillBoxes = screen.getAllByTestId('skill-box');
    expect(skillBoxes.some((box) => box.dataset.skillName === 'Python')).toBe(true);
    expect(skillBoxes.some((box) => box.dataset.skillName === 'JavaScript')).toBe(true);
  });

  // Self-reported skills tests
  it('shows SkeletonMultiplier when self-reported skills are loading', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      selfReportedSkillsLoading: true,
    } as any);

    render(<SkillsPage />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  it('shows DefaultEmptyBox when self-reported skills error', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      selfReportedSkillsLoading: false,
      selfReportedSkillsError: true,
      selfReportedSkillsSuccess: false,
    } as any);

    render(<SkillsPage />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    const selfReportedEmptyBox = emptyBoxes.find((el) =>
      el.textContent?.includes("You don't have any self-reported skills yet."),
    );
    expect(selfReportedEmptyBox).toBeInTheDocument();
  });

  it('shows DefaultEmptyBox when self-reported skills success but empty', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      selfReportedSkillsLoading: false,
      selfReportedSkillsError: false,
      selfReportedSkillsSuccess: true,
      selfReportedSkills: { skills: [] },
    } as any);

    render(<SkillsPage />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    const selfReportedEmptyBox = emptyBoxes.find((el) =>
      el.textContent?.includes("You don't have any self-reported skills yet."),
    );
    expect(selfReportedEmptyBox).toBeInTheDocument();
  });

  it('renders self-reported SkillBox list when skills exist', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      selfReportedSkillsLoading: false,
      selfReportedSkillsError: false,
      selfReportedSkillsSuccess: true,
      selfReportedSkills: {
        skills: [{ name: 'React' }, { name: 'TypeScript' }],
        data: { level: [2, 4] },
      },
    } as any);

    render(<SkillsPage />);
    const skillBoxes = screen.getAllByTestId('skill-box');
    expect(skillBoxes.some((box) => box.dataset.skillName === 'React')).toBe(true);
    expect(skillBoxes.some((box) => box.dataset.skillName === 'TypeScript')).toBe(true);
  });

  it('opens SkillDetailModal on self-reported skill click', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      selfReportedSkillsLoading: false,
      selfReportedSkillsError: false,
      selfReportedSkillsSuccess: true,
      selfReportedSkills: {
        skills: [{ name: 'React' }],
        data: { level: [3] },
      },
    } as any);

    render(<SkillsPage />);

    // Click a self-reported skill - click the first skill-box matching React
    const skillBoxes = screen.getAllByTestId('skill-box');
    const reactBox = skillBoxes.find((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBox!);

    expect(screen.getByTestId('skill-detail-modal')).toBeInTheDocument();
  });

  it('closes SkillDetailModal when onClose is called', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      selfReportedSkillsLoading: false,
      selfReportedSkillsError: false,
      selfReportedSkillsSuccess: true,
      selfReportedSkills: {
        skills: [{ name: 'React' }],
        data: { level: [3] },
      },
    } as any);

    render(<SkillsPage />);

    const skillBoxes = screen.getAllByTestId('skill-box');
    const reactBox = skillBoxes.find((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBox!);

    expect(screen.getByTestId('skill-detail-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-skill-modal'));
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
  });

  it('calls handleSkillsUpdate when rating is changed', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      selfReportedSkillsLoading: false,
      selfReportedSkillsError: false,
      selfReportedSkillsSuccess: true,
      selfReportedSkills: {
        skills: [{ name: 'React' }],
        data: { level: [3] },
      },
    } as any);

    render(<SkillsPage />);

    const skillBoxes = screen.getAllByTestId('skill-box');
    const reactBox = skillBoxes.find((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBox!);

    fireEvent.click(screen.getByTestId('change-rating'));
    expect(mockHandleSkillsUpdate).toHaveBeenCalled();
  });

  it('calls handleSkillsDeletion when delete skill is triggered', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      selfReportedSkillsLoading: false,
      selfReportedSkillsError: false,
      selfReportedSkillsSuccess: true,
      selfReportedSkills: {
        skills: [{ name: 'React' }],
        data: { level: [3] },
      },
    } as any);

    render(<SkillsPage />);

    const skillBoxes = screen.getAllByTestId('skill-box');
    const reactBox = skillBoxes.find((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBox!);

    fireEvent.click(screen.getByTestId('delete-skill'));
    expect(mockHandleSkillsDeletion).toHaveBeenCalled();
  });

  // Desired skills tests
  it('shows DefaultEmptyBox when desired skills error', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      desiredSkillsLoading: false,
      desiredSkillsError: true,
      desiredSkillsSuccess: false,
    } as any);

    render(<SkillsPage />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    const desiredEmptyBox = emptyBoxes.find((el) =>
      el.textContent?.includes("You don't have any desired skills yet."),
    );
    expect(desiredEmptyBox).toBeInTheDocument();
  });

  it('shows DefaultEmptyBox when desired skills success but empty', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      desiredSkillsLoading: false,
      desiredSkillsError: false,
      desiredSkillsSuccess: true,
      desiredSkills: { skills: [] },
    } as any);

    render(<SkillsPage />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    const desiredEmptyBox = emptyBoxes.find((el) =>
      el.textContent?.includes("You don't have any desired skills yet."),
    );
    expect(desiredEmptyBox).toBeInTheDocument();
  });

  it('renders desired SkillBox list when skills exist', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      desiredSkillsLoading: false,
      desiredSkillsError: false,
      desiredSkillsSuccess: true,
      desiredSkills: {
        skills: [{ name: 'ML' }, { name: 'AI' }],
        data: { level: [1, 2] },
      },
    } as any);

    render(<SkillsPage />);
    const skillBoxes = screen.getAllByTestId('skill-box');
    expect(skillBoxes.some((box) => box.dataset.skillName === 'ML')).toBe(true);
    expect(skillBoxes.some((box) => box.dataset.skillName === 'AI')).toBe(true);
  });

  it('shows SkeletonMultiplier when desired skills are loading', () => {
    vi.mocked(useProfileSkills).mockReturnValue({
      ...vi.mocked(useProfileSkills)(),
      desiredSkillsLoading: true,
    } as any);

    render(<SkillsPage />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  // AddSkillDialog tests
  it('opens AddSkillDialog with self-reported type on button click', () => {
    render(<SkillsPage />);

    // Find the "Add Skill" button in the Self-Reported section
    const addButtons = screen.getAllByText('Add Skill');
    fireEvent.click(addButtons[0]); // Self-Reported section's Add Skill button

    expect(screen.getByTestId('add-skill-dialog')).toBeInTheDocument();
  });

  it('closes AddSkillDialog when onOpenChange(false) is called', () => {
    render(<SkillsPage />);

    const addButtons = screen.getAllByText('Add Skill');
    fireEvent.click(addButtons[0]);

    expect(screen.getByTestId('add-skill-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-add-skill'));
    expect(screen.queryByTestId('add-skill-dialog')).not.toBeInTheDocument();
  });

  it('renders scroll buttons for Self-Reported and Desired sections', () => {
    render(<SkillsPage />);

    const prevButtons = screen.getAllByLabelText('Previous skills');
    const nextButtons = screen.getAllByLabelText('Next skills');

    expect(prevButtons.length).toBeGreaterThan(0);
    expect(nextButtons.length).toBeGreaterThan(0);
  });

  it('handles Add Skill for desired type', () => {
    render(<SkillsPage />);

    // The second "Add Skill" button should be for Desired section
    const addButtons = screen.getAllByText('Add Skill');
    fireEvent.click(addButtons[addButtons.length - 1]); // Desired section's Add Skill

    const dialog = screen.getByTestId('add-skill-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('data-type', 'desired');
  });

  it('does not render SkillDetailModal when no skill is selected', () => {
    render(<SkillsPage />);
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
  });

  it('renders AddSkillDialog (closed by default)', () => {
    render(<SkillsPage />);
    // The dialog should not be visible initially
    expect(screen.queryByTestId('add-skill-dialog')).not.toBeInTheDocument();
  });
});
