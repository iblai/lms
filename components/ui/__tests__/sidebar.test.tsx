import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the useIsMobile hook used by SidebarProvider
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '../sidebar';

describe('Sidebar', () => {
  it('renders without crashing', () => {
    render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>Header</SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Group</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Item</SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>Footer</SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div>Main content</div>
        </SidebarInset>
      </SidebarProvider>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });
});
