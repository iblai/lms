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
      <h2 className="text-lg font-medium mb-4">Skill Rating Example</h2>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center">
          <span className="font-medium mr-2">{skill.name}:</span>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
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
