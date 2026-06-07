'use client';

import { CredentialsCard } from './credentials-card';
import { AdvancedSettingsCard } from './advanced-settings-card';

interface ConfigurationTabProps {
  courseId: string;
  expandedSections: Record<string, boolean>;
  toggleSection: (index: number | string) => void;
}

export function ConfigurationTab({
  courseId,
  expandedSections,
  toggleSection,
}: ConfigurationTabProps) {
  return (
    <div className="space-y-6" data-testid="configuration-tab">
      <CredentialsCard
        courseId={courseId}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />
      <AdvancedSettingsCard
        courseId={courseId}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      />
    </div>
  );
}
