import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../resizable';

describe('Resizable', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>Panel 1</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Panel 2</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
