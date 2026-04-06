import { Star } from 'lucide-react';
import { UserSkill } from '@/types/skills';

interface SkillBoxProps {
  skill: UserSkill;
  onSkillClick?: (skill: UserSkill) => void;
  showRating?: boolean;
}

export const SkillBox = ({ skill, onSkillClick, showRating = true }: SkillBoxProps) => {
  return (
    <div
      key={skill.id}
      className="flex cursor-pointer flex-col items-center rounded-lg border border-gray-200 p-6 transition-all hover:shadow-md"
      onClick={() => onSkillClick?.(skill)}
    >
      <div className="mb-2">
        <img
          src="/images/empty-data-icon.svg"
          alt="Skills icon"
          width={32}
          height={32}
          className="h-8 w-8"
        />
      </div>
      <p className="mb-4 text-center text-sm text-gray-600">{skill.name}</p>

      {showRating && (
        <div className="relative mb-4 h-20 w-20">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#F8B43A"
              strokeWidth="10"
              strokeDasharray="251.2"
              strokeDashoffset={(100 - ((skill.level || 1) / 5) * 100) * 2.512}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-700">{skill.level || 1}</span>
          </div>
        </div>
      )}
      <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
    </div>
  );
};
