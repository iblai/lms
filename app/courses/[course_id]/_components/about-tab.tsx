'use client';

import { useRef, useEffect } from 'react';
import { DEFAULT_OVERVIEW_PLACEHOLDER } from '@/utils/helpers';

interface AboutTabProps {
  course: any;
}

export function AboutTab({ course }: AboutTabProps) {
  const overviewRef = useRef<HTMLDivElement>(null);

  // Handle image errors in Course Overview section
  useEffect(() => {
    if (overviewRef.current) {
      const handleImageError = (e: Event) => {
        const target = e.target as HTMLImageElement;
        if (target) {
          target.style.display = 'none';
        }
      };

      const processImages = () => {
        const images = overviewRef.current?.querySelectorAll('img');
        if (!images || images.length === 0) return;

        images.forEach((img) => {
          img.removeEventListener('error', handleImageError);

          if (img.complete && img.naturalHeight === 0) {
            img.style.display = 'none';
          } else {
            img.addEventListener('error', handleImageError);

            if (img.src && !img.complete) {
              img.onerror = () => {
                img.style.display = 'none';
              };
            }
          }
        });
      };

      requestAnimationFrame(() => {
        processImages();
      });

      const timeoutId1 = setTimeout(processImages, 0);
      const timeoutId2 = setTimeout(processImages, 50);
      const timeoutId3 = setTimeout(processImages, 100);
      const timeoutId4 = setTimeout(processImages, 300);
      const timeoutId5 = setTimeout(processImages, 500);

      const observer = new MutationObserver(() => {
        processImages();
      });

      if (overviewRef.current) {
        observer.observe(overviewRef.current, {
          childList: true,
          subtree: true,
        });
      }

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
        clearTimeout(timeoutId4);
        clearTimeout(timeoutId5);
        observer.disconnect();
        const images = overviewRef.current?.querySelectorAll('img');
        if (images) {
          images.forEach((img) => {
            img.removeEventListener('error', handleImageError);
            img.onerror = null;
          });
        }
      };
    }
  }, [course?.overview]);

  // Check if overview content is valid (exists and is not the default placeholder)
  const isOverviewValid = (overview: string | undefined): boolean => {
    if (!overview || (overview || '').trim() === '') return false;
    const normalizedOverview = (overview || '').replace(/\s+/g, ' ').trim();
    const normalizedPlaceholder = DEFAULT_OVERVIEW_PLACEHOLDER.replace(/\s+/g, ' ').trim();
    return normalizedOverview !== normalizedPlaceholder;
  };

  // Check if content appears to be HTML
  const isHtmlContent = (content: string): boolean => {
    return /<[a-z][\s\S]*>/i.test(content);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-gray-800">Course Description</h2>
        <p className="text-gray-600">{course.description}</p>
      </div>

      {isOverviewValid(course.overview) && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-800">Course Overview</h2>
          {isHtmlContent(course.overview || '') ? (
            <div
              ref={overviewRef}
              className="prose prose-sm course-overview-content max-w-none text-gray-600 [&_a]:text-amber-600 [&_a]:hover:text-amber-700 [&_article]:mb-3 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-gray-800 [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-gray-700 [&_img]:my-2 [&_img]:rounded-lg [&_p]:mb-2 [&_p]:text-gray-600 [&_section]:mb-4"
              dangerouslySetInnerHTML={{ __html: course.overview || '' }}
            />
          ) : (
            <p className="text-gray-600">{course.overview || ''}</p>
          )}
        </div>
      )}
    </div>
  );
}
