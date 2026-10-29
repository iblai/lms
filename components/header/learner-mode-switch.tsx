'use client';

import { Switch } from '@/components/ui/switch';
import { useLearnerMode } from '@/hooks/use-learner-mode';

export function LearnerModeSwitch() {
  const { isInstructorMode, toggleLearnerMode } = useLearnerMode();

  return (
    <Switch
      checked={isInstructorMode}
      onCheckedChange={toggleLearnerMode}
      // Read as a var rather than `bg-primary`: ThemeInitializer overwrites
      // --primary with a hex colour at runtime, which Tailwind's hsl() wrapper
      // cannot consume.
      className="data-[state=checked]:bg-[var(--primary)]"
      aria-label={`Admin mode ${isInstructorMode ? 'enabled' : 'disabled'}`}
      data-testid="learner-mode-switch"
    />
  );
}
