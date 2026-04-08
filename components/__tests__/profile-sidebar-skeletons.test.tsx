import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  SkillsSkeleton,
  CredentialsSkeleton,
  AllTimeSkeleton,
  ProfileSectionSkeleton,
} from '../profile-sidebar-skeletons';

describe('Profile Sidebar Skeletons', () => {
  describe('SkillsSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkillsSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('CredentialsSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<CredentialsSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('AllTimeSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<AllTimeSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ProfileSectionSkeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<ProfileSectionSkeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
