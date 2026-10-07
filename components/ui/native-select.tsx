'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A native `<select>` with our own chevron. Browsers pin theirs to the very
 * edge of the box; this one sits inside the padding like the other inputs.
 * `className` sizes the control (e.g. `w-full`); everything else goes to the
 * `<select>` itself.
 */
export const NativeSelect = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { className?: string }
>(({ className, children, ...props }, ref) => (
  <span className={cn('relative inline-flex', className)}>
    <select
      ref={ref}
      className="h-9 w-full rounded-md border border-gray-200 bg-white pr-9 pl-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
      // Inline rather than `appearance-none`: Tailwind v4 emits no -webkit- prefix,
      // and older Safari only drops the native arrow with the prefixed property.
      style={{ appearance: 'none', WebkitAppearance: 'none' }}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400"
      aria-hidden
    />
  </span>
));
NativeSelect.displayName = 'NativeSelect';
