import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RadioGroup, RadioGroupItem } from '../radio-group';

describe('RadioGroup', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <RadioGroup defaultValue="option-1">
        <RadioGroupItem value="option-1" id="option-1" />
        <RadioGroupItem value="option-2" id="option-2" />
      </RadioGroup>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
