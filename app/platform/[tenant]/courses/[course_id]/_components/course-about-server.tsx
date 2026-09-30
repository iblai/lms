import { DEFAULT_OVERVIEW_PLACEHOLDER } from '@/utils/helpers';
import type { CourseServerData } from '@/lib/utils/seo-data';

/**
 * Server-rendered "About" content: the course description and the overview HTML
 * (headings + body text). Emitted in the initial server response so crawlers
 * that don't execute JavaScript still see the real course content. The client
 * image-error hiding from the old client AboutTab is intentionally dropped here
 * — it's a progressive enhancement, not content.
 */
function isOverviewValid(overview: string): boolean {
  if (!overview.trim()) return false;
  const normalized = overview.replace(/\s+/g, ' ').trim();
  const placeholder = DEFAULT_OVERVIEW_PLACEHOLDER.replace(/\s+/g, ' ').trim();
  return normalized !== placeholder;
}

function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function CourseAboutServer({ course }: { course: CourseServerData }) {
  const { description, overview } = course;

  return (
    <div className="space-y-6">
      {description && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-800">Course Description</h2>
          <p className="text-gray-600">{description}</p>
        </div>
      )}

      {isOverviewValid(overview) && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-gray-800">Course Overview</h2>
          {isHtmlContent(overview) ? (
            <div
              className="prose prose-sm course-overview-content max-w-none text-gray-600 [&_a]:text-amber-600 [&_a]:hover:text-amber-700 [&_article]:mb-3 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-gray-800 [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-gray-700 [&_img]:my-2 [&_img]:rounded-lg [&_p]:mb-2 [&_p]:text-gray-600 [&_section]:mb-4"
              dangerouslySetInnerHTML={{ __html: overview }}
            />
          ) : (
            <p className="text-gray-600">{overview}</p>
          )}
        </div>
      )}
    </div>
  );
}
