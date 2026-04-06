import { Plus } from 'lucide-react';
import { Skill } from '@/types/skills';
import { useRouter } from 'next/navigation';

export const LatestSkillsBox = ({ skills, onClose }: { skills: Skill[]; onClose?: () => void }) => {
  const router = useRouter();

  return (
    <div className="mb-4 rounded-md border border-[var(--sidebar-border)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--sidebar-text)] md:text-base">
          Latest Skills
        </h3>
        <button
          className="group relative rounded-sm p-1 text-[var(--text-light)] hover:bg-[var(--sidebar-hover-bg)]"
          onClick={() => {
            if (onClose) onClose();
            router.push('/profile/skills');
          }}
          aria-label="Add Skill"
        >
          <Plus className="h-5 w-5" />
          <span className="pointer-events-none absolute -top-8 right-0 w-20 rounded-sm bg-[var(--text-dark)] px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Add Skill
          </span>
        </button>
      </div>
      <div className="space-y-2">
        {skills.map((skill, index) => (
          <div
            key={`latest-skill-${index}`}
            className="cursor-pointer rounded-sm bg-[var(--sidebar-skill-bg)] px-3 py-2 text-xs text-[var(--sidebar-skill-text)] transition-colors duration-200 hover:bg-[var(--sidebar-skill-hover-bg)]"
          >
            <span>{skill.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
