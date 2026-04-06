import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select';

describe('Select', () => {
  it('renders trigger without crashing', () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });
});
