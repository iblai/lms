import { Award, Clock, FileText, Play } from 'lucide-react';

interface AllTimePerLearnerBoxProps {
  total_assessments: number;
  total_time_spent: number;
  total_videos: number;
  course_completions: number;
}

export const AllTimePerLearnerBox = ({
  total_assessments,
  total_time_spent,
  total_videos,
  course_completions,
}: AllTimePerLearnerBoxProps) => {
  const hours =
    typeof total_time_spent === 'number' && !isNaN(total_time_spent)
      ? Math.round(total_time_spent / 3600)
      : 0;

  return (
    <div className="mb-4 rounded-md border border-[var(--sidebar-border)] p-4">
      <h3 className="mb-3 text-sm font-medium text-[var(--sidebar-text)] md:text-base">All Time</h3>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--sidebar-icon-bg)]">
              <Clock className="h-3 w-3 text-[var(--sidebar-icon-color)]" />
            </div>
            <span className="text-xs text-[var(--sidebar-text)]">Time Spent</span>
          </div>
          <span className="text-xs font-medium text-[var(--text-dark)]">{hours} hours</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--sidebar-icon-bg)]">
              <Play className="h-3 w-3 text-[var(--sidebar-icon-color)]" />
            </div>
            <span className="text-xs text-[var(--sidebar-text)]">Watched Video</span>
          </div>
          <span className="text-xs font-medium text-[var(--text-dark)]">{total_videos}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--sidebar-icon-bg)]">
              <FileText className="h-3 w-3 text-[var(--sidebar-icon-color)]" />
            </div>
            <span className="text-xs text-[var(--sidebar-text)]">Assessments</span>
          </div>
          <span className="text-xs font-medium text-[var(--text-dark)]">{total_assessments}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-[var(--sidebar-icon-bg)]">
              <Award className="h-3 w-3 text-[var(--sidebar-icon-color)]" />
            </div>
            <span className="text-xs text-[var(--sidebar-text)]">Courses Completions</span>
          </div>
          <span className="text-xs font-medium text-[var(--text-dark)]">{course_completions}</span>
        </div>
      </div>
    </div>
  );
};
