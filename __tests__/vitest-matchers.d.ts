// jest-dom matchers for vitest. jest-dom 6.x only ships a single-type-param
// `Assertion<T>` augmentation, which no longer merges with vitest 5's two-param
// `Assertion<R extends void | Promise<void>, T>` — so `toBeInTheDocument` & co.
// drop off the type. Re-augment with the correct arity here; the runtime
// matchers still come from the `@testing-library/jest-dom` import in the setup.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<
    R extends void | Promise<void> = void,
    T = unknown,
  > extends TestingLibraryMatchers<T, R> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, unknown> {}
}
