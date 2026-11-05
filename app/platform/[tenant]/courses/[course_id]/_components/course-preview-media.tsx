'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Play, X } from 'lucide-react';
import { getYouTubeVideoId } from '@/utils/course-creation';

const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

// `intro_video` is normally a bare YouTube ID (what edX Studio stores), but
// course authors sometimes paste the full watch/share URL instead.
export function resolveYouTubeId(introVideo: string | null | undefined): string {
  const value = introVideo?.trim() ?? '';
  if (YOUTUBE_ID_PATTERN.test(value)) return value;
  return getYouTubeVideoId(value);
}

interface CoursePreviewMediaProps {
  title: string;
  imageSrc: string;
  fallbackImageSrc: string;
  introVideo?: string | null;
}

export function CoursePreviewMedia({
  title,
  imageSrc,
  fallbackImageSrc,
  introVideo,
}: CoursePreviewMediaProps) {
  const [open, setOpen] = useState(false);
  const videoId = resolveYouTubeId(introVideo);

  const image = (
    <Image
      src={imageSrc}
      alt={title}
      fill
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      onError={(e) => {
        e.currentTarget.src = fallbackImageSrc;
      }}
    />
  );

  if (!videoId) {
    return (
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
        {image}
      </div>
    );
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Play introduction video for ${title}`}
          data-testid="course-intro-video-trigger"
          className="group relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-900 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {image}
          <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5 transition-colors duration-300 group-hover:via-black/30" />
          <span className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/40 [animation-duration:2s]" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl ring-4 ring-white/30 transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-1 h-7 w-7 fill-amber-500 text-amber-500" />
            </span>
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-testid="course-intro-video-modal"
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-[min(64rem,calc((100dvh-8rem)*16/9))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 duration-200 focus:outline-none"
        >
          <div className="flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="truncate text-base font-semibold text-white sm:text-lg">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close video"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={`${title} introduction video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
