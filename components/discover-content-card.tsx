import { getRandomCourseImage } from '@/utils/helpers';
import Image from 'next/image';
import { useState } from 'react';
import { DiscoverContentCardProps } from '../types/discover';
import { useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { PathwayDetailModal } from './pathway-detail-modal';

export function DiscoverContentCard({ content }: { content: DiscoverContentCardProps }) {
  const router = useRouter();
  const tenant = useTenantParam();
  const [randomImage] = useState(() => getRandomCourseImage());
  const [selectedPathway, setSelectedPathway] = useState<any>(null);
  const handleContentClick = () => {
    switch (content.contentType) {
      case 'pathway':
        setSelectedPathway(content);
        break;
      case 'program':
        router.push(`/platform/${tenant}/programs/${content.id}`);
        break;
      default:
        router.push(`/platform/${tenant}/courses/${content.id}`);
        break;
    }
  };
  return (
    <>
      <div
        onClick={handleContentClick}
        className="block h-full"
        data-testid="discover-content-card"
      >
        <div className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition-transform duration-500 ease-in-out hover:scale-105">
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
            <div className="absolute bottom-2 left-2 rounded-sm bg-amber-500 px-2 py-1 text-xs text-white uppercase">
              {content.contentType}
            </div>
            {(content.enrolled || content.recommended) && (
              <div className="absolute top-2 right-2 flex gap-1">
                {content.enrolled && (
                  <div className="rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#1d4ed8]">
                    Enrolled
                  </div>
                )}
                {content.recommended && (
                  <div className="rounded-full border border-[#bfdbfe] bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#1d4ed8]">
                    Recommended
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between p-4 pb-6">
            <div>
              <h3 className="line-clamp-2 h-10 text-xs font-medium text-gray-900 sm:text-sm">
                {content.title}
              </h3>
            </div>
          </div>
        </div>
      </div>
      {selectedPathway && (
        <PathwayDetailModal pathway={selectedPathway} onClose={() => setSelectedPathway(null)} />
      )}
    </>
  );
}
