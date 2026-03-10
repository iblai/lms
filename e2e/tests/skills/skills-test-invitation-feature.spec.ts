import { test, expect } from '@playwright/test';

import { SKILL_HOST } from '../utils';
import { checkAdminStatus, waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';
import { inviteUserTest, navigateToAccountComponent } from '../shared';

test.describe('skills test users, courses, programs invitation feature', () => {
  test.setTimeout(200000);
  test.beforeEach(async ({ page }) => {
    await page.goto(SKILL_HOST, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    await waitForPageReady(page);
    await page.waitForTimeout(2000);
  });

  test('Should be able to invite', async ({ page }) => {
    const profileBtn = page
      .getByRole('banner')
      .locator('button[aria-haspopup="menu"]')
      .last();
    const tenantDialog = await navigateToAccountComponent(page, profileBtn);

    const managementBtn = tenantDialog.getByRole('button', {
      name: 'Management',
    });
    await managementBtn.click();

    const managementTabHeading = page
      .getByRole('dialog')
      .filter({ hasText: 'Management' });
    await expect(managementTabHeading).toBeVisible({ timeout: 10000 });

    const inviteUserBtn = tenantDialog.getByRole('button', {
      name: 'Invite',
    });
    await expect(inviteUserBtn).toBeVisible({ timeout: 10000 });
    await inviteUserBtn.click();

    const inviteModal = page.getByRole('dialog', { name: 'Invite Users' });
    await expect(inviteModal).toBeVisible({ timeout: 10000 });

    await inviteUserTest(page, inviteModal);

    //Checking courses search field are focusable
    const coursesTabMenu = inviteModal.getByRole('tab', { name: 'Courses' });
    await expect(coursesTabMenu).toBeVisible({ timeout: 10000 });
    await coursesTabMenu.click();
    //user search field
    const selectUserBtn = page.getByRole('button', {
      name: 'Select users...',
    });
    await expect(selectUserBtn).toBeVisible({ timeout: 10000 });
    await selectUserBtn.click();
    const userSearchInput = page.getByRole('textbox', {
      name: 'Search users...',
    });
    await expect(userSearchInput).toBeVisible({ timeout: 10000 });
    await expect(userSearchInput).toBeEnabled();
    await expect(userSearchInput).toBeFocused();
    await userSearchInput.fill('test@test.com');
    await expect(userSearchInput).toHaveValue('test@test.com');
    //course search field
    const selectCourseBtn = page.getByRole('button', {
      name: 'Select courses...',
    });
    await expect(selectCourseBtn).toBeVisible({ timeout: 10000 });
    await selectCourseBtn.click();
    const courseTitle = 'course A';
    const courseSearchInput = page.getByRole('textbox', {
      name: 'Search courses...',
    });
    await expect(courseSearchInput).toBeVisible({ timeout: 10000 });
    await expect(courseSearchInput).toBeEnabled();
    await expect(courseSearchInput).toBeFocused();
    await courseSearchInput.fill(courseTitle);
    await expect(courseSearchInput).toHaveValue(courseTitle);

    //Checking programs search field are focusable
    const programsTabMenu = page.getByRole('tab', { name: 'Programs' });
    await expect(programsTabMenu).toBeVisible({ timeout: 10000 });
    await programsTabMenu.click();
    const selectProgramBtn = page.getByRole('button', {
      name: 'Select programs...',
    });
    await expect(selectProgramBtn).toBeVisible({ timeout: 10000 });
    await selectProgramBtn.click();
    const programSearchInput = page.getByRole('textbox', {
      name: 'Search programs...',
    });
    await expect(programSearchInput).toBeVisible({ timeout: 10000 });
    await expect(programSearchInput).toBeEnabled();
    await expect(programSearchInput).toBeFocused();
    await programSearchInput.fill('program A');
    await expect(programSearchInput).toHaveValue('program A');
  });
});
