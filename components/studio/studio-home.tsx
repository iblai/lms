'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, GraduationCap, Layers, Plus, Search } from 'lucide-react';
// @ts-ignore
import { useGetCatalogSearchQuery } from '@iblai/iblai-js/data-layer';
import { useCanCreateCourse } from '@/components/course-creation-access-guard';
import { CourseCreationModal } from '@/components/course-creation/course-creation-modal';
import { DefaultEmptyBox } from '@/components/default-empty-box';
import {
  ProgramCreationModal,
  type CreatedProgram,
} from '@/components/studio/program-creation-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenantParam } from '@/hooks/use-tenant-param';
import { cn } from '@/lib/utils';
import { useGetStudioCoursesQuery } from '@/services/studio';
import { useCurrentTenant } from '@/utils/localstorage';
import { studioCoursePath, type StudioView } from '@/utils/studio';

interface StudioRow {
  id: string;
  name: string;
  detail: string;
  href: string;
  archived?: boolean;
}

const VIEWS: { key: StudioView; label: string; icon: typeof GraduationCap }[] = [
  { key: 'courses', label: 'Courses', icon: GraduationCap },
  { key: 'programs', label: 'Programs', icon: Layers },
];

const PRIMARY_BUTTON_CLASS =
  'bg-gradient-to-r from-[var(--button-primary-gradient-from)] to-[var(--button-primary-gradient-to)] text-[var(--button-primary-text)] transition-opacity hover:opacity-[var(--button-primary-hover-opacity)]';

function RowList({ rows, icon: Icon }: { rows: StudioRow[]; icon: typeof GraduationCap }) {
  return (
    <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={row.href}
            data-testid="studio-row"
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-amber-50">
              <Icon className="h-4 w-4 text-amber-600" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-900">{row.name}</span>
                {row.archived && (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                    Archived
                  </span>
                )}
              </span>
              <span className="block truncate text-xs text-gray-500">{row.detail}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The native Studio landing page: the tenant's courses and programs, with the
 * entry points to create either. A course opens its Studio pages; a program
 * opens its own page, where admins already edit it.
 */
export function StudioHome() {
  const tenant = useTenantParam();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentTenant } = useCurrentTenant();
  const { canCreateCourse } = useCanCreateCourse();
  const org = currentTenant?.org;

  const view: StudioView = searchParams?.get('view') === 'programs' ? 'programs' : 'courses';
  const [search, setSearch] = useState('');
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  // The search index lists a new program only after it is re-indexed; until
  // then the one just created is shown from here.
  const [createdPrograms, setCreatedPrograms] = useState<CreatedProgram[]>([]);

  const {
    data: studioCourses,
    isLoading: coursesLoading,
    isError: coursesError,
  } = useGetStudioCoursesQuery(undefined, { refetchOnMountOrArgChange: true });
  const {
    data: programSearch,
    isLoading: programsLoading,
    isError: programsError,
  } = useGetCatalogSearchQuery([{ tenant, content: ['programs'], limit: 100 }], { skip: !tenant });

  const courseRows = useMemo<StudioRow[]>(
    () =>
      (studioCourses ?? [])
        .filter((course) => !org || course.org === org)
        .map((course) => ({
          id: course.course_key,
          name: course.display_name || course.course_key,
          detail: course.course_key,
          href: studioCoursePath(tenant, course.course_key),
          archived: course.archived,
        })),
    [studioCourses, org, tenant],
  );

  const programRows = useMemo<StudioRow[]>(() => {
    const indexed = (programSearch?.results ?? []).map(
      (result: Record<string, any>) => result.data as CreatedProgram,
    );
    const indexedKeys = new Set(indexed.map((program) => program.program_key));
    return [
      ...createdPrograms.filter((program) => !indexedKeys.has(program.program_key)),
      ...indexed,
    ].map((program) => ({
      id: program.program_key || program.program_id,
      name: program.name || program.program_id,
      detail: program.program_key || program.program_id,
      href: `/platform/${tenant}/programs/${encodeURIComponent(
        program.program_key || program.program_id,
      )}`,
    }));
  }, [programSearch, createdPrograms, tenant]);

  const rows = view === 'courses' ? courseRows : programRows;
  const loading = view === 'courses' ? coursesLoading : programsLoading;
  const failed = view === 'courses' ? coursesError : programsError;
  const term = search.trim().toLowerCase();
  const visibleRows = term
    ? rows.filter((row) => `${row.name} ${row.detail}`.toLowerCase().includes(term))
    : rows;
  const noun = view === 'courses' ? 'courses' : 'programs';

  const selectView = (next: StudioView) => {
    setSearch('');
    router.replace(next === 'courses' ? pathname : `${pathname}?view=${next}`, { scroll: false });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6" data-testid="studio-home">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Studio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your organization&apos;s courses and programs.
          </p>
        </div>
        {canCreateCourse && (
          <Button
            size="sm"
            onClick={() =>
              view === 'courses' ? setCourseModalOpen(true) : setProgramModalOpen(true)
            }
            className={PRIMARY_BUTTON_CLASS}
          >
            <Plus className="mr-2 h-4 w-4" />
            {view === 'courses' ? 'Create Course' : 'Create Program'}
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Studio content"
          className="inline-flex items-center rounded-lg bg-gray-100/80 p-0.5"
        >
          {VIEWS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => selectView(key)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none',
                view === key
                  ? 'bg-white text-amber-600 shadow-sm ring-1 ring-gray-200/80'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${noun}`}
            aria-label={`Search ${noun}`}
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="mt-4" role="tabpanel">
        {loading ? (
          <div className="flex justify-center p-12" data-testid="studio-loading">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          </div>
        ) : failed ? (
          <DefaultEmptyBox message={`We couldn't load your ${noun}. Please try again.`} />
        ) : visibleRows.length === 0 ? (
          <DefaultEmptyBox
            message={term ? `No ${noun} match "${search.trim()}".` : `No ${noun} yet.`}
          />
        ) : (
          <RowList rows={visibleRows} icon={view === 'courses' ? GraduationCap : Layers} />
        )}
      </div>

      <CourseCreationModal
        open={courseModalOpen}
        onOpenChange={setCourseModalOpen}
        onCreated={(courseKey) => router.push(studioCoursePath(tenant, courseKey))}
      />
      <ProgramCreationModal
        open={programModalOpen}
        onOpenChange={setProgramModalOpen}
        onCreated={(program) => {
          setCreatedPrograms((previous) => [program, ...previous]);
          setProgramModalOpen(false);
        }}
      />
    </div>
  );
}
