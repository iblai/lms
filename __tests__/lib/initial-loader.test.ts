import { describe, it, expect, beforeEach } from 'vitest';
import { hideInitialLoader } from '@/lib/initial-loader';

describe('hideInitialLoader', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('does nothing when no element with id "initial-loader" exists', () => {
    expect(() => hideInitialLoader()).not.toThrow();
  });

  it('adds "hidden" class to the loader element', () => {
    const loader = document.createElement('div');
    loader.id = 'initial-loader';
    document.body.appendChild(loader);

    hideInitialLoader();

    expect(loader.classList.contains('hidden')).toBe(true);
  });

  it('does not add "hidden" class a second time if already hidden', () => {
    const loader = document.createElement('div');
    loader.id = 'initial-loader';
    loader.classList.add('hidden');
    document.body.appendChild(loader);

    hideInitialLoader();

    // classList should still only have one 'hidden' entry
    expect(loader.classList.length).toBe(1);
    expect(loader.classList.contains('hidden')).toBe(true);
  });

  it('does not remove the element from the DOM', () => {
    const loader = document.createElement('div');
    loader.id = 'initial-loader';
    document.body.appendChild(loader);

    hideInitialLoader();

    expect(document.getElementById('initial-loader')).not.toBeNull();
  });
});
