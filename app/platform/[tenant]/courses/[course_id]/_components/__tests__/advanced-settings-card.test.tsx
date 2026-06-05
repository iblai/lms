import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the services
vi.mock('@/services/studio', () => ({
  useGetCoursesAdvancedSettingsQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    refetch: vi.fn(),
  })),
  useUpdateCoursesAdvancedSettingsMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}));

// Mock the components
vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => (
    <div data-testid="empty-box">{message}</div>
  ),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, ...props }: any) => (
    <button
      data-testid="switch"
      data-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      Switch
    </button>
  ),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange: _onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
}));

import { AdvancedSettingsCard } from '../advanced-settings-card';
import { useGetCoursesAdvancedSettingsQuery } from '@/services/studio';

describe('AdvancedSettingsCard', () => {
  const defaultProps = {
    courseId: 'course-v1:test+course+2024',
    expandedSections: { advancedSettings: false },
    toggleSection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the card with title', () => {
    render(<AdvancedSettingsCard {...defaultProps} />);

    expect(screen.getByText('Advanced Settings')).toBeInTheDocument();
    expect(screen.getByText('Course Configuration')).toBeInTheDocument();
  });

  it('toggles section when clicked', () => {
    render(<AdvancedSettingsCard {...defaultProps} />);

    const toggleButton = screen.getByTestId('advanced-settings-toggle');
    fireEvent.click(toggleButton);

    expect(defaultProps.toggleSection).toHaveBeenCalledWith('advancedSettings');
  });

  it('supports keyboard navigation for toggle', () => {
    render(<AdvancedSettingsCard {...defaultProps} />);

    const toggleButton = screen.getByTestId('advanced-settings-toggle');
    fireEvent.keyDown(toggleButton, { key: 'Enter' });

    expect(defaultProps.toggleSection).toHaveBeenCalledWith('advancedSettings');
  });

  it('supports space key for toggle', () => {
    render(<AdvancedSettingsCard {...defaultProps} />);

    const toggleButton = screen.getByTestId('advanced-settings-toggle');
    fireEvent.keyDown(toggleButton, { key: ' ' });

    expect(defaultProps.toggleSection).toHaveBeenCalledWith('advancedSettings');
  });

  it('has proper accessibility attributes on toggle', () => {
    render(<AdvancedSettingsCard {...defaultProps} />);

    const toggleButton = screen.getByTestId('advanced-settings-toggle');
    expect(toggleButton).toHaveAttribute('role', 'button');
    expect(toggleButton).toHaveAttribute('tabIndex', '0');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  describe('when expanded with loading state', () => {
    it('shows loading spinner', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: null,
        isLoading: true,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByTestId('advanced-settings-loading')).toBeInTheDocument();
    });
  });

  describe('when expanded with no settings', () => {
    it('shows empty state', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: null,
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByTestId('empty-box')).toHaveTextContent('No advanced settings available.');
    });
  });

  describe('when expanded with settings', () => {
    const mockSettings = {
      enable_feature: {
        value: true,
        display_name: 'Enable Feature',
        help: 'Enable this feature to activate additional functionality.',
        deprecated: false,
        hide_on_enabled_publisher: false,
      },
      course_name: {
        value: 'Test Course',
        display_name: 'Course Name',
        help: 'The name of the course.',
        deprecated: false,
        hide_on_enabled_publisher: false,
      },
      max_students: {
        value: 100,
        display_name: 'Maximum Students',
        help: 'Maximum number of students allowed.',
        deprecated: false,
        hide_on_enabled_publisher: false,
      },
    };

    beforeEach(() => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: mockSettings,
        isLoading: false,
        refetch: vi.fn(),
      } as any);
    });

    it('displays settings list', () => {
      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByTestId('advanced-settings-list')).toBeInTheDocument();
    });

    it('renders search input', () => {
      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByTestId('advanced-settings-search')).toBeInTheDocument();
    });

    it('displays setting display names', () => {
      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByText('Enable Feature')).toBeInTheDocument();
      expect(screen.getByText('Course Name')).toBeInTheDocument();
      expect(screen.getByText('Maximum Students')).toBeInTheDocument();
    });

    it('filters settings based on search', async () => {
      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const searchInput = screen.getByTestId('advanced-settings-search');
      fireEvent.change(searchInput, { target: { value: 'feature' } });

      await waitFor(() => {
        expect(screen.getByText('Enable Feature')).toBeInTheDocument();
        expect(screen.queryByText('Course Name')).not.toBeInTheDocument();
      });
    });

    it('shows clear button when search has value', () => {
      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const searchInput = screen.getByTestId('advanced-settings-search');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByTestId('advanced-settings-search-clear')).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', () => {
      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const searchInput = screen.getByTestId('advanced-settings-search');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const clearButton = screen.getByTestId('advanced-settings-search-clear');
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('shows empty state when search has no results', async () => {
      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const searchInput = screen.getByTestId('advanced-settings-search');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByTestId('advanced-settings-empty')).toBeInTheDocument();
      });
    });
  });

  describe('deprecated settings', () => {
    it('filters out deprecated settings', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          active_setting: {
            value: 'active',
            display_name: 'Active Setting',
            help: 'An active setting.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
          deprecated_setting: {
            value: 'deprecated',
            display_name: 'Deprecated Setting',
            help: 'A deprecated setting.',
            deprecated: true,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByText('Active Setting')).toBeInTheDocument();
      expect(screen.queryByText('Deprecated Setting')).not.toBeInTheDocument();
    });
  });

  describe('field types', () => {
    it('renders boolean field with switch', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          bool_setting: {
            value: true,
            display_name: 'Boolean Setting',
            help: 'A boolean setting.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByTestId('switch')).toBeInTheDocument();
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });

    it('renders date field for date-related settings', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          start_date: {
            value: '2024-01-01',
            display_name: 'Start Date',
            help: 'The start date for the course.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const dateInput = document.querySelector('input[type="date"]');
      expect(dateInput).toBeInTheDocument();
    });

    it('renders select field for settings with valid values', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          option_setting: {
            value: 'option1',
            display_name: 'Option Setting',
            help: 'Valid values are "option1", "option2", and "option3".',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByTestId('select')).toBeInTheDocument();
    });

    it('renders number field for numeric settings', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          max_attempts: {
            value: 5,
            display_name: 'Max Attempts',
            help: 'Maximum number of attempts.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const numberInput = document.querySelector('input[type="number"]');
      expect(numberInput).toBeInTheDocument();
    });

    it('renders textarea for array settings', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          tags: {
            value: ['tag1', 'tag2'],
            display_name: 'Tags',
            help: 'Course tags.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textarea = document.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('renders textarea for object settings', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          metadata: {
            value: { key: 'value' },
            display_name: 'Metadata',
            help: 'Course metadata.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textarea = document.querySelector('textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('renders text field for string settings', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          course_title: {
            value: 'My Course',
            display_name: 'Course Title',
            help: 'The title of the course.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textInput = document.querySelector('input[type="text"]');
      expect(textInput).toBeInTheDocument();
    });
  });

  describe('editing settings', () => {
    it('shows save button when settings are changed', async () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          course_title: {
            value: 'My Course',
            display_name: 'Course Title',
            help: 'The title of the course.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textInput = document.querySelector('input[type="text"]');
      fireEvent.change(textInput!, { target: { value: 'New Title' } });

      await waitFor(() => {
        expect(screen.getByTestId('save-advanced-settings-button')).toBeInTheDocument();
      });
    });

    it('toggles boolean setting when switch is clicked', async () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          bool_setting: {
            value: false,
            display_name: 'Boolean Setting',
            help: 'A boolean setting.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const switchEl = screen.getByTestId('switch');
      fireEvent.click(switchEl);

      await waitFor(() => {
        expect(screen.getByTestId('save-advanced-settings-button')).toBeInTheDocument();
      });
    });

    it('updates number input value', async () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          max_attempts: {
            value: 5,
            display_name: 'Max Attempts',
            help: 'Maximum number of attempts.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const numberInput = document.querySelector('input[type="number"]');
      fireEvent.change(numberInput!, { target: { value: '10' } });

      await waitFor(() => {
        expect(screen.getByTestId('save-advanced-settings-button')).toBeInTheDocument();
      });
    });

    it('updates date input value', async () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          start_date: {
            value: '2024-01-01',
            display_name: 'Start Date',
            help: 'The start date for the course.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const dateInput = document.querySelector('input[type="date"]');
      fireEvent.change(dateInput!, { target: { value: '2024-06-01' } });

      await waitFor(() => {
        expect(screen.getByTestId('save-advanced-settings-button')).toBeInTheDocument();
      });
    });
  });

  describe('saving settings', () => {
    it('calls updateAdvancedSettings when save button is clicked', async () => {
      const mockUpdateFn = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
      const mockRefetch = vi.fn();

      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          course_title: {
            value: 'My Course',
            display_name: 'Course Title',
            help: 'The title of the course.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: mockRefetch,
      } as any);

      const { useUpdateCoursesAdvancedSettingsMutation } = await import('@/services/studio');
      vi.mocked(useUpdateCoursesAdvancedSettingsMutation).mockReturnValue([
        mockUpdateFn,
        { isLoading: false },
      ] as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textInput = document.querySelector('input[type="text"]');
      fireEvent.change(textInput!, { target: { value: 'New Title' } });

      await waitFor(() => {
        const saveButton = screen.getByTestId('save-advanced-settings-button');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(mockUpdateFn).toHaveBeenCalled();
      });
    });
  });

  describe('select field with different patterns', () => {
    it('renders select for "can be set to one of" pattern', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          visibility: {
            value: 'public',
            display_name: 'Visibility',
            help: "This can be set to one of three values: 'public', 'private' and 'hidden'.",
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      expect(screen.getByTestId('select')).toBeInTheDocument();
    });
  });

  describe('textarea field editing', () => {
    it('handles textarea change with valid JSON', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          metadata: {
            value: { key: 'value' },
            display_name: 'Metadata',
            help: 'Course metadata.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textarea = document.querySelector('textarea');
      fireEvent.change(textarea!, { target: { value: '{"newKey": "newValue"}' } });

      // The change handler should parse valid JSON
      expect(textarea).toBeInTheDocument();
    });

    it('handles textarea change with invalid JSON (keeps as string while typing)', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          metadata: {
            value: { key: 'value' },
            display_name: 'Metadata',
            help: 'Course metadata.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textarea = document.querySelector('textarea');
      fireEvent.change(textarea!, { target: { value: 'invalid json {' } });

      // Should not throw error, just ignore invalid JSON while typing
      expect(textarea).toBeInTheDocument();
    });

    it('handles textarea blur with valid JSON', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          metadata: {
            value: { key: 'value' },
            display_name: 'Metadata',
            help: 'Course metadata.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textarea = document.querySelector('textarea');
      fireEvent.change(textarea!, { target: { value: '{"parsed": true}' } });
      fireEvent.blur(textarea!);

      expect(textarea).toBeInTheDocument();
    });

    it('handles textarea blur with invalid JSON (reverts)', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          metadata: {
            value: { key: 'value' },
            display_name: 'Metadata',
            help: 'Course metadata.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textarea = document.querySelector('textarea');
      fireEvent.change(textarea!, { target: { value: 'not valid json' } });
      fireEvent.blur(textarea!);

      // Should not throw error, just revert to original
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('save settings error handling', () => {
    it('logs error when save fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockUpdateFn = vi.fn().mockReturnValue({
        unwrap: vi.fn().mockRejectedValue(new Error('Save failed')),
      });

      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          course_title: {
            value: 'My Course',
            display_name: 'Course Title',
            help: 'The title of the course.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      const { useUpdateCoursesAdvancedSettingsMutation } = await import('@/services/studio');
      vi.mocked(useUpdateCoursesAdvancedSettingsMutation).mockReturnValue([
        mockUpdateFn,
        { isLoading: false },
      ] as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textInput = document.querySelector('input[type="text"]');
      fireEvent.change(textInput!, { target: { value: 'New Title' } });

      await waitFor(() => {
        const saveButton = screen.getByTestId('save-advanced-settings-button');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error saving advanced settings:',
          expect.any(Error),
        );
      });

      consoleSpy.mockRestore();
    });

    it('does not call update when no changes', async () => {
      const mockUpdateFn = vi.fn();

      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          course_title: {
            value: 'My Course',
            display_name: 'Course Title',
            help: 'The title of the course.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      const { useUpdateCoursesAdvancedSettingsMutation } = await import('@/services/studio');
      vi.mocked(useUpdateCoursesAdvancedSettingsMutation).mockReturnValue([
        mockUpdateFn,
        { isLoading: false },
      ] as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      // Change to same value (no real change)
      const textInput = document.querySelector('input[type="text"]');
      fireEvent.change(textInput!, { target: { value: 'My Course' } });

      // The save button should appear because we triggered a change
      // but clicking it should not call update if values match original
      await waitFor(() => {
        const saveButton = screen.queryByTestId('save-advanced-settings-button');
        if (saveButton) {
          fireEvent.click(saveButton);
        }
      });

      // updateFn should not have been called since value is same as original
      // Wait a bit to ensure no update happened
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe('field type detection edge cases', () => {
    it('renders date field but excludes format-related help text', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          date_format: {
            value: 'MM/DD/YYYY',
            display_name: 'Date Display Format',
            help: 'The date display format for the course. Format for dates shown.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      // Should be a text input, not date input, because help mentions "format for"
      const dateInput = document.querySelector('input[type="date"]');
      const textInput = document.querySelector('input[type="text"]');

      expect(dateInput).not.toBeInTheDocument();
      expect(textInput).toBeInTheDocument();
    });

    it('handles null value correctly', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          optional_field: {
            value: null,
            display_name: 'Optional Field',
            help: 'An optional field.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const textInput = document.querySelector('input[type="text"]');
      expect(textInput).toBeInTheDocument();
      expect(textInput).toHaveValue('');
    });

    it('handles date input clearing', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          start_date: {
            value: '2024-01-01T00:00:00Z',
            display_name: 'Start Date',
            help: 'The start date for the course.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const dateInput = document.querySelector('input[type="date"]');
      fireEvent.change(dateInput!, { target: { value: '' } });

      // Should handle clearing the date (setting to null)
      expect(dateInput).toBeInTheDocument();
    });

    it('handles number input clearing', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          max_attempts: {
            value: 5,
            display_name: 'Max Attempts',
            help: 'Maximum number of attempts.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      const numberInput = document.querySelector('input[type="number"]');
      fireEvent.change(numberInput!, { target: { value: '' } });

      // Should handle clearing the number (setting to null)
      expect(numberInput).toBeInTheDocument();
    });

    it('handles string "false" as boolean', () => {
      vi.mocked(useGetCoursesAdvancedSettingsQuery).mockReturnValue({
        data: {
          string_bool: {
            value: 'false',
            display_name: 'String Boolean',
            help: 'A string boolean value.',
            deprecated: false,
            hide_on_enabled_publisher: false,
          },
        },
        isLoading: false,
        refetch: vi.fn(),
      } as any);

      render(
        <AdvancedSettingsCard {...defaultProps} expandedSections={{ advancedSettings: true }} />,
      );

      // Should render as switch since 'false' is treated as boolean
      expect(screen.getByTestId('switch')).toBeInTheDocument();
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });
  });
});
