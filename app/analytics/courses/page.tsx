'use client';

import { getTenant } from '@/utils/helpers';
import { AnalyticsCourses } from '@iblai/web-containers';

export default function CoursesPage() {
  return <AnalyticsCourses tenantKey={getTenant()} mentorId={''} basePath="/analytics" />;
}
