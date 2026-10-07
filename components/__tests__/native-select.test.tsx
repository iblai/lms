import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

vi.mock('lucide-react', () => ({
  ChevronDown: (props: any) => <span data-testid="chevron" {...props} />,
}));

import { NativeSelect } from '../ui/native-select';

describe('NativeSelect', () => {
  it('renders a real select with an inset, decorative chevron', () => {
    const onChange = vi.fn();
    render(
      <NativeSelect aria-label="Role" className="w-full" onChange={onChange} defaultValue="b">
        <option value="a">A</option>
        <option value="b">B</option>
      </NativeSelect>,
    );
    const select = screen.getByRole('combobox', { name: 'Role' }) as HTMLSelectElement;
    expect(select.value).toBe('b');
    expect(select.style.appearance).toBe('none');
    expect(select.className).toContain('pr-9');
    // Width goes on the wrapper so the chevron stays anchored to the control.
    expect(select.parentElement?.className).toContain('w-full');
    expect(screen.getByTestId('chevron')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('chevron').className).toContain('pointer-events-none');
    fireEvent.change(select, { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalled();
  });
});
