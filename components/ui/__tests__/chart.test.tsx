import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChartContainer, type ChartConfig } from '../chart';
import { BarChart } from 'recharts';

describe('ChartContainer', () => {
  it('renders without crashing', () => {
    const config: ChartConfig = {
      value: { label: 'Value', color: '#000' },
    };
    const { container } = render(
      <ChartContainer config={config}>
        <BarChart data={[]} />
      </ChartContainer>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
