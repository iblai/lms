import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCssVariables, applyCssVariables, getColor } from '../theme-utils';
import { themeConfig } from '@/config/config';

describe('theme-utils', () => {
  describe('generateCssVariables', () => {
    it('returns an object of CSS variable key-value pairs', () => {
      const cssVars = generateCssVariables();
      expect(typeof cssVars).toBe('object');
      expect(Object.keys(cssVars).length).toBeGreaterThan(0);
    });

    // Primary colors
    it('generates primary color variables', () => {
      const cssVars = generateCssVariables();
      expect(cssVars['--primary']).toBe(themeConfig.colors.primary.DEFAULT);
      expect(cssVars['--primary-light']).toBe(themeConfig.colors.primary.light);
      expect(cssVars['--primary-dark']).toBe(themeConfig.colors.primary.dark);
    });

    // Secondary colors
    it('generates secondary color variables', () => {
      const cssVars = generateCssVariables();
      expect(cssVars['--secondary']).toBe(themeConfig.colors.secondary.DEFAULT);
      expect(cssVars['--secondary-light']).toBe(themeConfig.colors.secondary.light);
      expect(cssVars['--secondary-dark']).toBe(themeConfig.colors.secondary.dark);
    });

    // Accent colors
    it('generates accent color variables', () => {
      const cssVars = generateCssVariables();
      expect(cssVars['--accent']).toBe(themeConfig.colors.accent.DEFAULT);
      expect(cssVars['--accent-light']).toBe(themeConfig.colors.accent.light);
      expect(cssVars['--accent-dark']).toBe(themeConfig.colors.accent.dark);
    });

    // Background colors
    it('generates background color variables', () => {
      const cssVars = generateCssVariables();
      expect(cssVars['--background']).toBe(themeConfig.colors.background.DEFAULT);
      expect(cssVars['--background-light']).toBe(themeConfig.colors.background.light);
      expect(cssVars['--background-dark']).toBe(themeConfig.colors.background.dark);
    });

    // Text colors
    it('generates text color variables', () => {
      const cssVars = generateCssVariables();
      expect(cssVars['--text']).toBe(themeConfig.colors.text.DEFAULT);
      expect(cssVars['--text-light']).toBe(themeConfig.colors.text.light);
      expect(cssVars['--text-dark']).toBe(themeConfig.colors.text.dark);
    });

    // Border colors
    it('generates border color variables', () => {
      const cssVars = generateCssVariables();
      expect(cssVars['--border']).toBe(themeConfig.colors.border.DEFAULT);
      expect(cssVars['--border-light']).toBe(themeConfig.colors.border.light);
      expect(cssVars['--border-dark']).toBe(themeConfig.colors.border.dark);
    });

    // Status colors
    it('generates status color variables', () => {
      const cssVars = generateCssVariables();
      expect(cssVars['--success']).toBe(themeConfig.colors.status.success);
      expect(cssVars['--warning']).toBe(themeConfig.colors.status.warning);
      expect(cssVars['--error']).toBe(themeConfig.colors.status.error);
      expect(cssVars['--info']).toBe(themeConfig.colors.status.info);
    });

    // Navbar component colors
    it('generates navbar component variables', () => {
      const cssVars = generateCssVariables();
      const navbar = themeConfig.colors.components.navbar;
      expect(cssVars['--navbar-bg']).toBe(navbar.background);
      expect(cssVars['--navbar-text']).toBe(navbar.text);
      expect(cssVars['--navbar-active-text']).toBe(navbar.activeText);
      expect(cssVars['--navbar-active-border']).toBe(navbar.activeBorder);
      expect(cssVars['--navbar-hover-text']).toBe(navbar.hoverText);
      expect(cssVars['--navbar-hover-bg']).toBe(navbar.hoverBackground);
    });

    // Sidebar component colors
    it('generates sidebar component variables', () => {
      const cssVars = generateCssVariables();
      const sidebar = themeConfig.colors.components.sidebar;
      expect(cssVars['--sidebar-bg']).toBe(sidebar.background);
      expect(cssVars['--sidebar-border']).toBe(sidebar.border);
      expect(cssVars['--sidebar-text']).toBe(sidebar.text);
      expect(cssVars['--sidebar-icon-bg']).toBe(sidebar.iconBackground);
      expect(cssVars['--sidebar-icon-color']).toBe(sidebar.iconColor);
      expect(cssVars['--sidebar-hover-bg']).toBe(sidebar.hoverBackground);
      expect(cssVars['--sidebar-skill-bg']).toBe(sidebar.skillBackground);
      expect(cssVars['--sidebar-skill-hover-bg']).toBe(sidebar.skillHoverBackground);
      expect(cssVars['--sidebar-skill-text']).toBe(sidebar.skillText);
    });

    // Button component colors
    it('generates button primary component variables', () => {
      const cssVars = generateCssVariables();
      const button = themeConfig.colors.components.button;
      expect(cssVars['--button-primary-bg']).toBe(button.primary.background);
      expect(cssVars['--button-primary-gradient-from']).toBe(button.primary.gradient.from);
      expect(cssVars['--button-primary-gradient-to']).toBe(button.primary.gradient.to);
      expect(cssVars['--button-primary-text']).toBe(button.primary.text);
      expect(cssVars['--button-primary-hover-opacity']).toBe(
        button.primary.hoverOpacity.toString(),
      );
    });

    it('generates button secondary component variables', () => {
      const cssVars = generateCssVariables();
      const button = themeConfig.colors.components.button;
      expect(cssVars['--button-secondary-bg']).toBe(button.secondary.background);
      expect(cssVars['--button-secondary-gradient-from']).toBe(button.secondary.gradient.from);
      expect(cssVars['--button-secondary-gradient-to']).toBe(button.secondary.gradient.to);
      expect(cssVars['--button-secondary-text']).toBe(button.secondary.text);
      expect(cssVars['--button-secondary-hover-bg']).toBe(button.secondary.hoverBackground);
      expect(cssVars['--button-secondary-gradient']).toContain('linear-gradient');
    });

    it('generates button accent component variables', () => {
      const cssVars = generateCssVariables();
      const button = themeConfig.colors.components.button;
      expect(cssVars['--button-accent-gradient']).toContain('linear-gradient');
      expect(cssVars['--button-accent-gradient-from']).toBe(button.accent.gradient.from);
      expect(cssVars['--button-accent-gradient-to']).toBe(button.accent.gradient.to);
      expect(cssVars['--button-accent-text']).toBe(button.accent.text);
      expect(cssVars['--button-accent-hover-opacity']).toBe(button.accent.hoverOpacity.toString());
    });

    // Dialog component colors
    it('generates dialog component variables', () => {
      const cssVars = generateCssVariables();
      const dialog = themeConfig.colors.components.dialog;
      expect(cssVars['--dialog-bg']).toBe(dialog.background);
      expect(cssVars['--dialog-text']).toBe(dialog.text);
      expect(cssVars['--dialog-border']).toBe(dialog.border);
      expect(cssVars['--dialog-sidebar-bg']).toBe(dialog.sidebar.background);
      expect(cssVars['--dialog-sidebar-text']).toBe(dialog.sidebar.text);
      expect(cssVars['--dialog-sidebar-active-bg']).toBe(dialog.sidebar.activeTab.background);
      expect(cssVars['--dialog-sidebar-active-border']).toBe(dialog.sidebar.activeTab.border);
      expect(cssVars['--dialog-sidebar-active-text']).toBe(dialog.sidebar.activeTab.text);
    });

    // Badge component colors
    it('generates badge component variables', () => {
      const cssVars = generateCssVariables();
      const badge = themeConfig.colors.components.badge;
      expect(cssVars['--badge-admin-bg']).toBe(badge.admin.background);
      expect(cssVars['--badge-admin-text']).toBe(badge.admin.text);
      expect(cssVars['--badge-default-bg']).toBe(badge.default.background);
      expect(cssVars['--badge-default-text']).toBe(badge.default.text);
    });

    it('all CSS variable keys start with --', () => {
      const cssVars = generateCssVariables();
      for (const key of Object.keys(cssVars)) {
        expect(key.startsWith('--')).toBe(true);
      }
    });

    it('all CSS variable values are strings', () => {
      const cssVars = generateCssVariables();
      for (const value of Object.values(cssVars)) {
        expect(typeof value).toBe('string');
      }
    });
  });

  describe('applyCssVariables', () => {
    let mockElement: HTMLElement;

    beforeEach(() => {
      mockElement = document.createElement('div');
      vi.spyOn(mockElement.style, 'setProperty');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('applies CSS variables to the provided element', () => {
      applyCssVariables(mockElement);

      const cssVars = generateCssVariables();
      const totalVars = Object.keys(cssVars).length;

      expect(mockElement.style.setProperty).toHaveBeenCalledTimes(totalVars);
    });

    it('sets specific CSS variable values on the element', () => {
      applyCssVariables(mockElement);

      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        '--primary',
        themeConfig.colors.primary.DEFAULT,
      );
      expect(mockElement.style.setProperty).toHaveBeenCalledWith(
        '--secondary',
        themeConfig.colors.secondary.DEFAULT,
      );
    });

    it('defaults to document.documentElement when no element is provided', () => {
      const spy = vi.spyOn(document.documentElement.style, 'setProperty');

      applyCssVariables();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('applies all generated CSS variables', () => {
      applyCssVariables(mockElement);

      const cssVars = generateCssVariables();
      for (const [key, value] of Object.entries(cssVars)) {
        expect(mockElement.style.setProperty).toHaveBeenCalledWith(key, value);
      }
    });
  });

  describe('getColor', () => {
    it('returns a top-level color group', () => {
      const result = getColor('primary');
      expect(result).toEqual(themeConfig.colors.primary);
    });

    it('returns a nested color value using dot notation', () => {
      const result = getColor('primary.DEFAULT');
      expect(result).toBe(themeConfig.colors.primary.DEFAULT);
    });

    it('returns primary.light color', () => {
      expect(getColor('primary.light')).toBe(themeConfig.colors.primary.light);
    });

    it('returns primary.dark color', () => {
      expect(getColor('primary.dark')).toBe(themeConfig.colors.primary.dark);
    });

    it('returns secondary colors', () => {
      expect(getColor('secondary.DEFAULT')).toBe(themeConfig.colors.secondary.DEFAULT);
      expect(getColor('secondary.light')).toBe(themeConfig.colors.secondary.light);
      expect(getColor('secondary.dark')).toBe(themeConfig.colors.secondary.dark);
    });

    it('returns status colors', () => {
      expect(getColor('status.success')).toBe(themeConfig.colors.status.success);
      expect(getColor('status.warning')).toBe(themeConfig.colors.status.warning);
      expect(getColor('status.error')).toBe(themeConfig.colors.status.error);
      expect(getColor('status.info')).toBe(themeConfig.colors.status.info);
    });

    it('returns component-specific colors', () => {
      expect(getColor('components.navbar.background')).toBe(
        themeConfig.colors.components.navbar.background,
      );
    });

    it('returns undefined for non-existent color path', () => {
      expect(getColor('nonexistent')).toBeUndefined();
    });

    it('returns undefined for partially valid path', () => {
      expect(getColor('primary.nonexistent')).toBeUndefined();
    });

    it('returns undefined for deeply invalid path', () => {
      expect(getColor('primary.DEFAULT.deeper.path')).toBeUndefined();
    });

    it('returns the entire components object for components path', () => {
      const result = getColor('components');
      expect(result).toEqual(themeConfig.colors.components);
    });

    it('returns background colors', () => {
      expect(getColor('background.DEFAULT')).toBe(themeConfig.colors.background.DEFAULT);
      expect(getColor('background.light')).toBe(themeConfig.colors.background.light);
      expect(getColor('background.dark')).toBe(themeConfig.colors.background.dark);
    });

    it('returns text colors', () => {
      expect(getColor('text.DEFAULT')).toBe(themeConfig.colors.text.DEFAULT);
      expect(getColor('text.light')).toBe(themeConfig.colors.text.light);
      expect(getColor('text.dark')).toBe(themeConfig.colors.text.dark);
    });

    it('returns border colors', () => {
      expect(getColor('border.DEFAULT')).toBe(themeConfig.colors.border.DEFAULT);
      expect(getColor('border.light')).toBe(themeConfig.colors.border.light);
      expect(getColor('border.dark')).toBe(themeConfig.colors.border.dark);
    });
  });
});
