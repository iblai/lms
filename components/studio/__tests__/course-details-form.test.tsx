import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockToast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock('sonner', () => ({ toast: mockToast }));
vi.mock('@/components/default-empty-box', () => ({
  DefaultEmptyBox: ({ message }: { message: string }) => <div data-testid="empty">{message}</div>,
}));
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select data-testid="select" value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const query = vi.hoisted(() => ({ data: undefined as any, isLoading: false, isError: false }));
const mutation = vi.hoisted(() => ({ isLoading: false }));
const mockUpdateSettings = vi.fn();
vi.mock('@/services/studio', () => ({
  useGetStudioCourseSettingsQuery: () => query,
  useUpdateStudioCourseSettingsMutation: () => [mockUpdateSettings, mutation],
}));

import { CourseDetailsForm, buildSettingsPayload } from '../course-details-form';

const COURSE_KEY = 'course-v1:org+CS101+2026';
const FORM_DATA = {
  title: 'Algebra',
  subtitle: null,
  short_description: 'Short',
  description: 'Long',
  language: 'en',
  duration: '',
  effort: null,
  subject: null,
  level: null,
  intro_video: 'Yq0QkCxoTHM',
  start_date: '2026-06-19T19:28:12Z',
  end_date: null,
  enrollment_start: '2026-06-18T19:28:12Z',
  enrollment_end: null,
  tags: null,
  topics: ['math', 'logic'],
  self_paced: true,
  instructor_info: { instructors: [{ name: 'Ada' }] },
  course_key: COURSE_KEY,
};
const unwrapResolve = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const unwrapReject = (error: unknown) => ({ unwrap: () => Promise.reject(error) });

describe('CourseDetailsForm', () => {
  const change = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  const savedSettings = () => mockUpdateSettings.mock.calls[0][0].settings;

  beforeEach(() => {
    vi.clearAllMocks();
    query.data = {
      formData: FORM_DATA,
      formChoices: {
        level: [
          { value: '', label: '---' },
          { value: 'Beginner', label: 'Beginner' },
        ],
      },
    };
    query.isLoading = false;
    query.isError = false;
    mutation.isLoading = false;
    mockUpdateSettings.mockReturnValue(unwrapResolve({}));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('shows a spinner while the settings load', () => {
    query.data = undefined;
    query.isLoading = true;
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    expect(screen.getByTestId('course-details-loading')).toBeInTheDocument();
  });

  it('shows an error when the settings cannot be loaded', () => {
    query.data = undefined;
    query.isError = true;
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    expect(screen.getByTestId('empty')).toHaveTextContent("couldn't load this course's details");
  });

  it('fills the form from the loaded settings', () => {
    render(<CourseDetailsForm courseId={COURSE_KEY} />);

    expect(screen.getByLabelText('Title *')).toHaveValue('Algebra');
    expect(screen.getByLabelText('Subtitle')).toHaveValue('');
    expect(screen.getByLabelText('Course start')).toHaveValue('2026-06-19');
    expect(screen.getByLabelText('Course end')).toHaveValue('');
    expect(screen.getByLabelText('Topics')).toHaveValue('math, logic');
    expect(screen.getByLabelText('Self-paced')).toBeChecked();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('saves the edits laid over the full loaded settings', async () => {
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    change('Title *', ' Algebra II ');
    change('Short description', 'Shorter');
    change('Description', 'Longer');
    change('Course end', '2026-12-01');
    change('Tags', 'a, b,, ');
    change('Intro video', 'https://youtu.be/dQw4w9WgXcQ');
    fireEvent.click(screen.getByLabelText('Self-paced'));
    const [language, level] = screen.getAllByTestId('select');
    fireEvent.change(language, { target: { value: 'fr' } });
    fireEvent.change(level, { target: { value: 'Beginner' } });
    save();

    await waitFor(() => expect(mockToast.success).toHaveBeenCalledWith('Course details saved.'));
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      courseKey: COURSE_KEY,
      settings: {
        ...FORM_DATA,
        title: 'Algebra II',
        short_description: 'Shorter',
        description: 'Longer',
        end_date: '2026-12-01T00:00:00Z',
        tags: ['a', 'b'],
        intro_video: 'dQw4w9WgXcQ',
        self_paced: false,
        language: 'fr',
        level: 'Beginner',
      },
    });
  });

  it('leaves untouched fields exactly as they were loaded', async () => {
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    change('Subtitle', 'A subtitle');
    save();

    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    expect(savedSettings()).toEqual({ ...FORM_DATA, subtitle: 'A subtitle' });
    expect(savedSettings()).not.toHaveProperty('display_name');
  });

  it('clears a level back to unset', async () => {
    query.data = { ...query.data, formData: { ...FORM_DATA, level: 'Beginner' } };
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    fireEvent.change(screen.getAllByTestId('select')[1], { target: { value: '__none__' } });
    save();

    await waitFor(() => expect(mockUpdateSettings).toHaveBeenCalled());
    expect(savedSettings().level).toBe('');
  });

  it('keeps a language the built-in list does not have', () => {
    query.data = { ...query.data, formData: { ...FORM_DATA, language: 'yo' }, formChoices: {} };
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    expect(screen.getAllByTestId('select')[0]).toHaveValue('yo');
    expect(screen.getByRole('option', { name: 'yo' })).toBeInTheDocument();
  });

  it('offers no extra language option when none is set', () => {
    query.data = { ...query.data, formData: { ...FORM_DATA, language: null } };
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    expect(screen.getAllByRole('option', { name: 'English' })).toHaveLength(1);
    expect(screen.queryByRole('option', { name: '' })).not.toBeInTheDocument();
  });

  it('rejects a blank title', () => {
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    change('Title *', '  ');
    save();
    expect(mockToast.error).toHaveBeenCalledWith('Please enter a course title.');
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it('rejects an end date before the start date', () => {
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    change('Course end', '2026-01-01');
    save();
    expect(mockToast.error).toHaveBeenCalledWith(
      'The course end date cannot be before its start date.',
    );
    expect(mockUpdateSettings).not.toHaveBeenCalled();
  });

  it('reports a failed save', async () => {
    mockUpdateSettings.mockReturnValue(unwrapReject(new Error('boom')));
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    change('Duration', '6 weeks');
    change('Effort', '3 hours');
    change('Subject', 'Math');
    change('Topics', '');
    change('Enrollment opens', '2026-06-01');
    change('Enrollment closes', '2026-06-30');
    change('Course start', '2026-06-20');
    save();

    await waitFor(() =>
      expect(mockToast.error).toHaveBeenCalledWith(
        'Could not save the course details. Please try again.',
      ),
    );
  });

  it('disables saving while a save is in flight', () => {
    mutation.isLoading = true;
    render(<CourseDetailsForm courseId={COURSE_KEY} />);
    change('Subtitle', 'x');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
});

describe('buildSettingsPayload', () => {
  const values = {
    title: 'T',
    subtitle: '',
    short_description: '',
    description: '',
    language: '',
    duration: '',
    effort: '',
    subject: '',
    level: '',
    intro_video: '',
    start_date: '',
    end_date: '',
    enrollment_start: '',
    enrollment_end: '',
    tags: '',
    topics: '',
    self_paced: false,
  };

  it('keeps null for fields that were null and are still empty', () => {
    const payload = buildSettingsPayload({ subtitle: null, tags: null, start_date: null }, values);
    expect(payload.subtitle).toBeNull();
    expect(payload.tags).toBeNull();
    expect(payload.start_date).toBeNull();
  });

  it('writes empty values over fields that previously held something', () => {
    const payload = buildSettingsPayload({ subtitle: 'Old', tags: ['old'] }, values);
    expect(payload.subtitle).toBe('');
    expect(payload.tags).toEqual([]);
  });
});
