import { getRandomCourseImage } from '@/utils/helpers';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { DiscoverContentCardProps } from '../types/discover';
import { useRouter } from 'next/navigation';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { useCourseCardImage } from '@/hooks/courses/use-course-card-image';

export function DiscoverContentCard({
  content,
  onClick,
}: {
  content: DiscoverContentCardProps;
  /** Overrides the default navigation (e.g. pathway resources open a URL). */
  onClick?: () => void;
}) {
  const router = useRouter();
  const tenant = useTenantParam();
  const [randomImage] = useState(() => getRandomCourseImage());
  const handleContentClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    switch (content.contentType) {
      case 'pathway':
        router.push(`/platform/${tenant}/pathways/${content.id}`);
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
          <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
            {!content.image && content.imageCourseId ? (
              <LazyCourseImage
                courseId={content.imageCourseId}
                alt={content.title}
                fallback={randomImage}
              />
            ) : (
              <CardImage
                src={content.image || randomImage}
                alt={content.title}
                fallback={randomImage}
              />
            )}
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
    </>
  );
}

function CardImage({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={(e) => {
        e.currentTarget.src = fallback;
      }}
    />
  );
}

/**
 * Artwork looked up from the course's metadata once the card nears the
 * viewport. Split out so only cards that need the lookup subscribe to it.
 */
function LazyCourseImage({
  courseId,
  alt,
  fallback,
}: {
  courseId: string;
  alt: string;
  fallback: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { image, isPending } = useCourseCardImage(courseId, ref);
  return (
    <div ref={ref} className="absolute inset-0">
      {/* No random placeholder while the real artwork is still being looked
          up — it would flash and then swap. */}
      {isPending ? (
        <div className="absolute inset-0 animate-pulse" data-testid="card-image-pending" />
      ) : (
        <CardImage src={image || fallback} alt={alt} fallback={fallback} />
      )}
    </div>
  );
}
