import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
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

const defaultHookState = {
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
};

vi.mock('@/hooks/profile/use-profile-skills', () => ({
  useProfileSkills: vi.fn(() => defaultHookState),
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
    <div data-testid="skill-detail-modal" data-skill-name={skill?.name} data-rating={skill?.rating}>
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
      data-skill-level={skill?.level}
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

import { ProfileSkillsContent } from '../profile-skills-content';
import { useProfileSkills } from '@/hooks/profile/use-profile-skills';

// jsdom does not implement smooth scrolling — stub scrollBy so the scroll
// handlers can run.
const mockScrollBy = vi.fn();

beforeAll(() => {
  Object.defineProperty(window.HTMLElement.prototype, 'scrollBy', {
    configurable: true,
    writable: true,
    value: mockScrollBy,
  });
});

const mockHookState = (overrides: Record<string, any> = {}) => {
  vi.mocked(useProfileSkills).mockReturnValue({
    ...defaultHookState,
    ...overrides,
  } as any);
};

const withSelfReportedSkills = (extra: Record<string, any> = {}) => ({
  selfReportedSkillsLoading: false,
  selfReportedSkillsError: false,
  selfReportedSkillsSuccess: true,
  selfReportedSkills: {
    skills: [{ name: 'React' }],
    data: { level: [3] },
  },
  ...extra,
});

describe('ProfileSkillsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookState();
  });

  it('renders without crashing', () => {
    const { container } = render(<ProfileSkillsContent />);
    expect(container).toBeTruthy();
  });

  it('renders search input and updates it on change', () => {
    render(<ProfileSkillsContent />);
    const searchInput = screen.getByPlaceholderText('Search');
    expect(searchInput).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: 'python' } });
    expect(searchInput).toHaveValue('python');
  });

  it('renders Earned, Self-Reported, and Desired sections', () => {
    render(<ProfileSkillsContent />);
    expect(screen.getByText('Earned')).toBeInTheDocument();
    expect(screen.getByText('Self-Reported')).toBeInTheDocument();
    expect(screen.getByText('Desired')).toBeInTheDocument();
  });

  // Earned skills
  it('shows SkeletonMultiplier when earned skills are loading', () => {
    mockHookState({ earnedSkillsLoading: true });
    render(<ProfileSkillsContent />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  it('shows DefaultEmptyBox when earned skills error', () => {
    mockHookState({ earnedSkillsError: true });
    render(<ProfileSkillsContent />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    expect(
      emptyBoxes.some((el) => el.textContent?.includes("You don't have any earned skills yet.")),
    ).toBe(true);
  });

  it('shows DefaultEmptyBox when earned skills succeed but are empty', () => {
    mockHookState({ earnedSkillsSuccess: true, earnedSkills: null });
    render(<ProfileSkillsContent />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    expect(
      emptyBoxes.some((el) => el.textContent?.includes("You don't have any earned skills yet.")),
    ).toBe(true);
  });

  it('renders earned SkillBox list when skills exist', () => {
    mockHookState({
      earnedSkillsSuccess: true,
      earnedSkills: {
        resources: [
          { name: 'Python', points: 5 },
          { name: 'JavaScript', points: 3 },
        ],
      },
    });
    render(<ProfileSkillsContent />);
    const skillBoxes = screen.getAllByTestId('skill-box');
    expect(skillBoxes.some((box) => box.dataset.skillName === 'Python')).toBe(true);
    expect(skillBoxes.some((box) => box.dataset.skillName === 'JavaScript')).toBe(true);
  });

  it('renders earned skills with fallback name and level when fields are missing', () => {
    mockHookState({
      earnedSkillsSuccess: true,
      earnedSkills: { resources: [{}] },
    });
    render(<ProfileSkillsContent />);
    const skillBoxes = screen.getAllByTestId('skill-box');
    expect(skillBoxes[0].dataset.skillName).toBe('');
    expect(skillBoxes[0].dataset.skillLevel).toBe('0');
  });

  // Self-reported skills
  it('shows SkeletonMultiplier when self-reported skills are loading', () => {
    mockHookState({ selfReportedSkillsLoading: true });
    render(<ProfileSkillsContent />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  it('shows DefaultEmptyBox when self-reported skills error', () => {
    mockHookState({ selfReportedSkillsError: true });
    render(<ProfileSkillsContent />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    expect(
      emptyBoxes.some((el) =>
        el.textContent?.includes("You don't have any self-reported skills yet."),
      ),
    ).toBe(true);
  });

  it('shows DefaultEmptyBox when self-reported skills succeed but are empty', () => {
    mockHookState({ selfReportedSkillsSuccess: true, selfReportedSkills: { skills: [] } });
    render(<ProfileSkillsContent />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    expect(
      emptyBoxes.some((el) =>
        el.textContent?.includes("You don't have any self-reported skills yet."),
      ),
    ).toBe(true);
  });

  it('renders self-reported SkillBox lists (mobile and desktop) when skills exist', () => {
    mockHookState(withSelfReportedSkills());
    render(<ProfileSkillsContent />);
    const reactBoxes = screen
      .getAllByTestId('skill-box')
      .filter((box) => box.dataset.skillName === 'React');
    // One in the mobile scroller, one in the desktop grid.
    expect(reactBoxes).toHaveLength(2);
  });

  it('opens SkillDetailModal when a mobile self-reported skill is clicked', () => {
    mockHookState(withSelfReportedSkills());
    render(<ProfileSkillsContent />);
    const reactBoxes = screen
      .getAllByTestId('skill-box')
      .filter((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBoxes[0]);
    expect(screen.getByTestId('skill-detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('skill-detail-modal')).toHaveAttribute('data-skill-name', 'React');
  });

  it('opens SkillDetailModal when a desktop self-reported skill is clicked', () => {
    mockHookState(withSelfReportedSkills());
    render(<ProfileSkillsContent />);
    const reactBoxes = screen
      .getAllByTestId('skill-box')
      .filter((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBoxes[1]);
    expect(screen.getByTestId('skill-detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('skill-detail-modal')).toHaveAttribute('data-rating', '3');
  });

  it('falls back to level 0 when self-reported level data is missing', () => {
    mockHookState(
      withSelfReportedSkills({
        selfReportedSkills: { skills: [{}], data: { level: [] } },
      }),
    );
    render(<ProfileSkillsContent />);
    const boxes = screen.getAllByTestId('skill-box');
    expect(boxes[0].dataset.skillName).toBe('');
    expect(boxes[0].dataset.skillLevel).toBe('0');
    // Clicking still opens the modal with fallback values.
    fireEvent.click(boxes[1]);
    expect(screen.getByTestId('skill-detail-modal')).toHaveAttribute('data-rating', '0');
  });

  it('closes SkillDetailModal via onClose', () => {
    mockHookState(withSelfReportedSkills());
    render(<ProfileSkillsContent />);
    const reactBoxes = screen
      .getAllByTestId('skill-box')
      .filter((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBoxes[0]);
    fireEvent.click(screen.getByTestId('close-skill-modal'));
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
  });

  it('calls handleSkillsUpdate on rating change and closes the modal via its callback', () => {
    mockHandleSkillsUpdate.mockImplementation((_skill, _existing, onDone) => onDone());
    mockHookState(withSelfReportedSkills());
    render(<ProfileSkillsContent />);
    const reactBoxes = screen
      .getAllByTestId('skill-box')
      .filter((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBoxes[0]);
    fireEvent.click(screen.getByTestId('change-rating'));

    expect(mockHandleSkillsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'React', level: 3, type: 'self-reported' }),
      expect.objectContaining({ selfReported: expect.anything() }),
      expect.any(Function),
    );
    // The success callback clears the selected skill, closing the modal.
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
  });

  it('calls handleSkillsDeletion on delete and closes the modal via its callback', () => {
    mockHandleSkillsDeletion.mockImplementation((_skill, _existing, onDone) => onDone());
    mockHookState(withSelfReportedSkills());
    render(<ProfileSkillsContent />);
    const reactBoxes = screen
      .getAllByTestId('skill-box')
      .filter((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBoxes[0]);
    fireEvent.click(screen.getByTestId('delete-skill'));

    expect(mockHandleSkillsDeletion).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'React' }),
      expect.objectContaining({ desired: null }),
      expect.any(Function),
    );
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
  });

  it('keeps the modal open when onConfirm is triggered', () => {
    mockHookState(withSelfReportedSkills());
    render(<ProfileSkillsContent />);
    const reactBoxes = screen
      .getAllByTestId('skill-box')
      .filter((box) => box.dataset.skillName === 'React');
    fireEvent.click(reactBoxes[0]);
    fireEvent.click(screen.getByTestId('confirm-skill'));
    expect(screen.getByTestId('skill-detail-modal')).toBeInTheDocument();
  });

  // Desired skills
  it('shows SkeletonMultiplier when desired skills are loading', () => {
    mockHookState({ desiredSkillsLoading: true });
    render(<ProfileSkillsContent />);
    expect(screen.getAllByTestId('skeleton-multiplier').length).toBeGreaterThan(0);
  });

  it('shows DefaultEmptyBox when desired skills error', () => {
    mockHookState({ desiredSkillsError: true });
    render(<ProfileSkillsContent />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    expect(
      emptyBoxes.some((el) => el.textContent?.includes("You don't have any desired skills yet.")),
    ).toBe(true);
  });

  it('shows DefaultEmptyBox when desired skills succeed but are empty', () => {
    mockHookState({ desiredSkillsSuccess: true, desiredSkills: { skills: [] } });
    render(<ProfileSkillsContent />);
    const emptyBoxes = screen.getAllByTestId('default-empty-box');
    expect(
      emptyBoxes.some((el) => el.textContent?.includes("You don't have any desired skills yet.")),
    ).toBe(true);
  });

  it('renders desired SkillBox lists without ratings when skills exist', () => {
    mockHookState({
      desiredSkillsSuccess: true,
      desiredSkills: {
        skills: [{ name: 'ML' }, { name: 'AI' }],
        data: { level: [1, 2] },
      },
    });
    render(<ProfileSkillsContent />);
    const mlBoxes = screen
      .getAllByTestId('skill-box')
      .filter((box) => box.dataset.skillName === 'ML');
    // One in the mobile scroller, one in the desktop grid.
    expect(mlBoxes).toHaveLength(2);
    expect(mlBoxes.every((box) => box.dataset.showRating === 'false')).toBe(true);
  });

  it('renders desired skills with fallback name and level when fields are missing', () => {
    mockHookState({
      desiredSkillsSuccess: true,
      desiredSkills: { skills: [{}] },
    });
    render(<ProfileSkillsContent />);
    const boxes = screen.getAllByTestId('skill-box');
    expect(boxes[0].dataset.skillName).toBe('');
    expect(boxes[0].dataset.skillLevel).toBe('0');
  });

  // Scroll buttons
  it('scrolls the self-reported and desired containers via the chevron buttons', () => {
    mockHookState(
      withSelfReportedSkills({
        desiredSkillsSuccess: true,
        desiredSkills: { skills: [{ name: 'ML' }], data: { level: [1] } },
      }),
    );
    render(<ProfileSkillsContent />);

    const prevButtons = screen.getAllByLabelText('Previous skills');
    const nextButtons = screen.getAllByLabelText('Next skills');
    expect(prevButtons).toHaveLength(2);
    expect(nextButtons).toHaveLength(2);

    // Self-reported + desired previous buttons scroll left.
    fireEvent.click(prevButtons[0]);
    fireEvent.click(prevButtons[1]);
    expect(mockScrollBy).toHaveBeenCalledTimes(2);
    expect(mockScrollBy).toHaveBeenCalledWith({ left: -200, behavior: 'smooth' });

    // Self-reported + desired next buttons scroll right.
    fireEvent.click(nextButtons[0]);
    fireEvent.click(nextButtons[1]);
    expect(mockScrollBy).toHaveBeenCalledTimes(4);
    expect(mockScrollBy).toHaveBeenLastCalledWith({ left: 200, behavior: 'smooth' });
  });

  // Add Skill dialog
  it('opens AddSkillDialog with self-reported type from the Self-Reported section', () => {
    render(<ProfileSkillsContent />);
    const addButtons = screen.getAllByText('Add Skill');
    fireEvent.click(addButtons[0]);
    const dialog = screen.getByTestId('add-skill-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('data-type', 'self-reported');
  });

  it('opens AddSkillDialog with desired type from the Desired section', () => {
    render(<ProfileSkillsContent />);
    const addButtons = screen.getAllByText('Add Skill');
    fireEvent.click(addButtons[addButtons.length - 1]);
    const dialog = screen.getByTestId('add-skill-dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('data-type', 'desired');
  });

  it('closes AddSkillDialog when onOpenChange(false) is called', () => {
    render(<ProfileSkillsContent />);
    fireEvent.click(screen.getAllByText('Add Skill')[0]);
    expect(screen.getByTestId('add-skill-dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close-add-skill'));
    expect(screen.queryByTestId('add-skill-dialog')).not.toBeInTheDocument();
  });

  it('does not render SkillDetailModal or AddSkillDialog by default', () => {
    render(<ProfileSkillsContent />);
    expect(screen.queryByTestId('skill-detail-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-skill-dialog')).not.toBeInTheDocument();
  });
});
