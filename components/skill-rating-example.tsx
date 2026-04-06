'use client';

import { useState } from 'react';
import { SkillDetailModal } from './skill-detail-modal';
import { Button } from '@/components/ui/button';

export function SkillRatingExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [skill, setSkill] = useState({
    name: 'JavaScript',
    rating: 3,
  });

  const handleRatingChange = (rating: number) => {
    setSkill({
      ...skill,
      rating,
    });
  };

  const handleDeleteSkill = () => {
    console.log('Deleting skill:', skill.name);
    setIsModalOpen(false);
    // Here you would typically remove the skill from your data store
  };

  const handleConfirm = () => {
    console.log('Confirmed skill rating:', skill);
    setIsModalOpen(false);
    // Here you would typically save the updated rating to your data store
  };

  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-medium">Skill Rating Example</h2>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center">
          <span className="mr-2 font-medium">{skill.name}:</span>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800">
            Level {skill.rating}
          </span>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>Edit Rating</Button>
      </div>

      {isModalOpen && (
        <SkillDetailModal
          skill={skill}
          onClose={() => setIsModalOpen(false)}
          onRatingChange={handleRatingChange}
          onDeleteSkill={handleDeleteSkill}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
