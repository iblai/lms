import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const hooks = vi.hoisted(() => ({
  roleMembers: vi.fn(),
  forumMembers: vi.fn(),
  updateEnrollment: vi.fn(),
  modifyAccess: vi.fn(),
  betaAccess: vi.fn(),
  updateForum: vi.fn(),
}));
// Profile lookups are covered by the hook's own tests; here names resolve to the fallback.
vi.mock('@/hooks/users/use-user-display-name', () => ({
  useUserDisplayName: (username: string, fallback?: string) => fallback || username,
}));

vi.mock('@/services/instructor', () => ({
  useListCourseRoleMembersQuery: (...args: any[]) => hooks.roleMembers(...args),
  useListForumMembersQuery: (...args: any[]) => hooks.forumMembers(...args),
  useUpdateEnrollmentMutation: () => [hooks.updateEnrollment, { isLoading: false }],
  useModifyAccessMutation: () => [hooks.modifyAccess, { isLoading: false }],
  useBulkBetaModifyAccessMutation: () => [hooks.betaAccess, { isLoading: false }],
  useUpdateForumRoleMembershipMutation: () => [hooks.updateForum, { isLoading: false }],
}));

import { MembershipSection, describeEnrollmentResult } from '../membership-section';

const ok = (value: unknown) => ({ unwrap: () => Promise.resolve(value) });
const fail = (value: unknown) => ({ unwrap: () => Promise.reject(value) });
const state = (enrollment: boolean, allowed = false, user = true) => ({
  user,
  enrollment,
  allowed,
  auto_enroll: false,
});

describe('describeEnrollmentResult', () => {
  const base = { identifier: 'ada@x.org', before: state(false), after: state(true) };
  it('describes every outcome of an enroll / unenroll call', () => {
    expect(describeEnrollmentResult(base, 'enroll')).toBe('ada@x.org: enrolled');
    expect(describeEnrollmentResult({ ...base, before: state(true) }, 'enroll')).toBe(
      'ada@x.org: already enrolled',
    );
    expect(describeEnrollmentResult({ ...base, after: state(false, true, false) }, 'enroll')).toBe(
      'ada@x.org: no account yet — will be enrolled on sign-up',
    );
    expect(describeEnrollmentResult({ ...base, after: state(false, false, false) }, 'enroll')).toBe(
      'ada@x.org: no account found',
    );
    expect(
      describeEnrollmentResult({ ...base, before: state(true), after: state(false) }, 'unenroll'),
    ).toBe('ada@x.org: unenrolled');
    expect(
      describeEnrollmentResult({ ...base, before: state(false), after: state(false) }, 'unenroll'),
    ).toBe('ada@x.org: was not enrolled');
    expect(describeEnrollmentResult({ ...base, invalidIdentifier: true }, 'enroll')).toBe(
      'ada@x.org: not a valid email or username',
    );
    expect(describeEnrollmentResult({ ...base, error: true }, 'enroll')).toBe(
      'ada@x.org: something went wrong',
    );
  });
});

describe('MembershipSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.roleMembers.mockReturnValue({
      data: [{ username: 'ada', email: 'ada@x.org', first_name: 'Ada', last_name: 'L' }],
      isLoading: false,
    });
    hooks.forumMembers.mockReturnValue({ data: [], isLoading: false });
  });

  it('enrolls learners and lists what happened to each', async () => {
    hooks.updateEnrollment.mockReturnValue(
      ok({
        action: 'enroll',
        auto_enroll: true,
        results: [
          { identifier: 'ada@x.org', before: state(false), after: state(true) },
          {
            identifier: 'new@x.org',
            before: state(false, false, false),
            after: state(false, true, false),
          },
        ],
      }),
    );
    render(<MembershipSection courseId="c" />);

    const button = screen.getByRole('button', { name: 'Enroll' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Learners'), {
      target: { value: 'ada@x.org, new@x.org' },
    });
    fireEvent.click(screen.getByLabelText('Notify by email'));
    fireEvent.click(button);

    await waitFor(() => expect(screen.getByTestId('enrollment-results')).toBeInTheDocument());
    expect(hooks.updateEnrollment).toHaveBeenCalledWith({
      courseId: 'c',
      identifiers: 'ada@x.org, new@x.org',
      action: 'enroll',
      autoEnroll: true,
      emailStudents: true,
    });
    const items = within(screen.getByTestId('enrollment-results')).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('ada@x.org: enrolled');
    expect(items[1]).toHaveTextContent('new@x.org: no account yet');
    expect(screen.getByLabelText('Learners')).toHaveValue('');
  });

  it('switches to unenroll and reports a failed call', async () => {
    hooks.updateEnrollment.mockReturnValue(fail(new Error('Forbidden')));
    render(<MembershipSection courseId="c" />);
    fireEvent.change(screen.getByLabelText('Enrollment action'), { target: { value: 'unenroll' } });
    fireEvent.click(screen.getByLabelText('Auto-enroll when they sign up'));
    fireEvent.change(screen.getByLabelText('Learners'), { target: { value: 'bob' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unenroll' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Forbidden'));
    expect(hooks.updateEnrollment).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'unenroll', autoEnroll: false }),
    );
  });

  it('lists the course team for the chosen role and adds / removes members', async () => {
    hooks.modifyAccess.mockReturnValue(ok({}));
    render(<MembershipSection courseId="c" />);
    expect(hooks.roleMembers).toHaveBeenCalledWith({ courseId: 'c', rolename: 'staff' });
    const team = screen.getByRole('region', { name: 'Course team' });
    expect(within(team).getByText('Ada L')).toBeInTheDocument();

    fireEvent.change(within(team).getByLabelText('Add Staff'), { target: { value: ' grace ' } });
    fireEvent.submit(within(team).getByLabelText('Add Staff').closest('form')!);
    await waitFor(() =>
      expect(within(team).getByRole('status')).toHaveTextContent('grace added as Staff'),
    );
    expect(hooks.modifyAccess).toHaveBeenCalledWith({
      courseId: 'c',
      identifier: 'grace',
      rolename: 'staff',
      action: 'allow',
    });

    fireEvent.click(within(team).getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(within(team).getByRole('status')).toHaveTextContent('ada@x.org removed'),
    );
    expect(hooks.modifyAccess).toHaveBeenLastCalledWith(
      expect.objectContaining({ identifier: 'ada@x.org', action: 'revoke' }),
    );
  });

  it('uses the beta-tester endpoint for the beta role and shows errors', async () => {
    hooks.betaAccess.mockReturnValueOnce(ok({})).mockReturnValueOnce(fail({}));
    render(<MembershipSection courseId="c" />);
    const team = screen.getByRole('region', { name: 'Course team' });
    fireEvent.change(within(team).getByLabelText('Course role'), { target: { value: 'beta' } });
    expect(hooks.roleMembers).toHaveBeenLastCalledWith({ courseId: 'c', rolename: 'beta' });

    fireEvent.change(within(team).getByLabelText('Add Beta testers'), {
      target: { value: 'tester@x.org' },
    });
    fireEvent.click(within(team).getByRole('button', { name: 'Add' }));
    await waitFor(() =>
      expect(hooks.betaAccess).toHaveBeenCalledWith({
        courseId: 'c',
        identifiers: 'tester@x.org',
        action: 'add',
        emailStudents: false,
        autoEnroll: true,
      }),
    );
    fireEvent.click(within(team).getByRole('button', { name: 'Remove' }));
    await waitFor(() =>
      expect(within(team).getByRole('alert')).toHaveTextContent('The change failed'),
    );
  });

  it('ignores an empty identifier submit and shows the loading / empty states', () => {
    hooks.roleMembers.mockReturnValue({ data: undefined, isLoading: true });
    hooks.forumMembers.mockReturnValue({ data: undefined, isLoading: false });
    render(<MembershipSection courseId="c" />);
    const team = screen.getByRole('region', { name: 'Course team' });
    fireEvent.submit(within(team).getByLabelText('Add Staff').closest('form')!);
    expect(hooks.modifyAccess).not.toHaveBeenCalled();
    expect(within(team).getByText('Loading…')).toBeInTheDocument();
    const forum = screen.getByRole('region', { name: 'Discussion roles' });
    expect(within(forum).getByText('No Moderator yet.')).toBeInTheDocument();
  });

  it('manages discussion roles', async () => {
    hooks.forumMembers.mockReturnValue({
      data: [{ username: 'mod', email: '', first_name: '', last_name: '' }],
      isLoading: false,
    });
    hooks.updateForum
      .mockReturnValueOnce(ok({}))
      .mockReturnValueOnce(fail(new Error('No such user')));
    render(<MembershipSection courseId="c" />);
    const forum = screen.getByRole('region', { name: 'Discussion roles' });
    fireEvent.change(within(forum).getByLabelText('Discussion role'), {
      target: { value: 'Administrator' },
    });
    expect(hooks.forumMembers).toHaveBeenLastCalledWith({
      courseId: 'c',
      rolename: 'Administrator',
    });

    fireEvent.submit(within(forum).getByLabelText('Add Administrator').closest('form')!);
    expect(hooks.updateForum).not.toHaveBeenCalled();
    fireEvent.change(within(forum).getByLabelText('Add Administrator'), {
      target: { value: 'ada' },
    });
    fireEvent.submit(within(forum).getByLabelText('Add Administrator').closest('form')!);
    await waitFor(() =>
      expect(within(forum).getByRole('status')).toHaveTextContent('ada is now a Administrator'),
    );
    expect(hooks.updateForum).toHaveBeenCalledWith({
      courseId: 'c',
      identifier: 'ada',
      rolename: 'Administrator',
      action: 'allow',
    });

    fireEvent.click(within(forum).getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(within(forum).getByRole('alert')).toHaveTextContent('No such user'));
    expect(hooks.updateForum).toHaveBeenLastCalledWith(
      expect.objectContaining({ identifier: 'mod', action: 'revoke' }),
    );
    hooks.forumMembers.mockReturnValue({ data: undefined, isLoading: true });
  });
});
