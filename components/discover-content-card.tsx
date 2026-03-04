import { getRandomCourseImage } from '@/utils/helpers';
import Image from 'next/image';
import { useState } from 'react';
import { DiscoverContentCardProps } from '../types/discover';
import { useRouter } from 'next/navigation';
import { PathwayDetailModal } from './pathway-detail-modal';
import { ProgramDetailModal } from './program-detail-modal';

export function DiscoverContentCard({ content }: { content: DiscoverContentCardProps }) {
  const router = useRouter();
  const [randomImage] = useState(() => getRandomCourseImage());
  const [selectedPathway, setSelectedPathway] = useState<any>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const handleContentClick = () => {
    switch (content.contentType) {
      case 'pathway':
        setSelectedPathway(content);
        break;
      case 'program':
        setSelectedProgram(content);
        break;
      default:
        router.push(`/courses/${content.id}`);
        break;
    }
  };
  return (
    <>
      <div onClick={handleContentClick} className="block h-full">
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white transition-transform duration-500 ease-in-out hover:scale-105 flex flex-col h-full w-full cursor-pointer shadow-sm">
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={content.image || randomImage}
              alt={content.title}
              fill
              className="object-cover"
              onError={(e) => {
                e.currentTarget.src = randomImage;
              }}
            />
            <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-sm uppercase">
              {content.contentType}
            </div>
          </div>
          <div className="flex flex-col flex-1 p-4 pb-6 justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 h-10">
                {content.title}
              </h3>
            </div>
          </div>
        </div>
      </div>
      {selectedPathway && (
        <PathwayDetailModal pathway={selectedPathway} onClose={() => setSelectedPathway(null)} />
      )}
      {selectedProgram && (
        <ProgramDetailModal
          program={{
            ...selectedProgram,
            program_metadata: selectedProgram?.data,
            metadata: selectedProgram?.data,
          }}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </>
  );
}
