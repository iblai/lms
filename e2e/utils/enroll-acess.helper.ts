import { expect, Locator, Page } from '@playwright/test';

export const pathwaySelectors = {
  activeTab: '.border-b-2.border-amber-500.text-amber-500',
  grid: '.grid',
  card: '.border.border-gray-200.rounded-lg',
  noDataText: 'No pathways found.',
  createButton: 'Create Pathway',
  pathwayBadge: 'text="PATHWAY"',
  progressText: 'text="Progress"',
  tabsContainer: 'div.flex.space-x-8:has(button:has-text("My pathways"))',
};

export const programsSelectors = {
  activeTab: '.border-b-2.border-amber-500.text-amber-500',
  grid: '.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3.xl\\:grid-cols-4.\\32 xl\\:grid-cols-5.gap-4',
  card: '.border.border-gray-200.rounded-lg',
  noDataText: 'No programs found.',
  tabsContainer: 'div.flex.space-x-8:has(button:has-text("My program"))',
};

export async function switchAndVerifyTab(page: Page, tabName: string) {
  const tabButton = page.getByRole('button', { name: tabName });
  await tabButton.click();
  await page.waitForTimeout(500);
  // Verify tab is active
  await expect(tabButton).toHaveClass(/border-b-2/);
}

export async function switchAndVerifyProgramTab(page: Page, tabName: string) {
  const tabButton = page.getByRole('button', { name: tabName });
  await tabButton.click();
  await page.waitForTimeout(10000);

  // Verify tab is active
  await expect(tabButton).toHaveClass(/border-amber-500/);

  // Verify content for this tab
  await verifyProgramTabContent(page, tabName);
}

export async function verifyProgramTabContent(page: Page, tabName: string) {
  const hasData = !(await page
    .getByText(pathwaySelectors.noDataText)
    .isVisible());

  if (hasData) {
    await verifyProgramDataState(page);
  } else {
    await verifyProgramEmptyState(page);
  }
}

async function verifyProgramDataState(page: Page) {
  const pathwaysGrid = page.locator(pathwaySelectors.grid);
  await expect(pathwaysGrid).toBeVisible({ timeout: 1000 });

  const cards = page.locator('.border.border-gray-200.rounded-lg');
  // Wait until at least 1 card appears
  await expect(cards.first()).toBeVisible({ timeout: 10000 });

  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
}

async function verifyPathwaysEmptyState(page: Page) {
  await expect(page.getByText(programsSelectors.noDataText)).toBeVisible();
}

async function verifyProgramEmptyState(page: Page) {
  await expect(page.getByText(programsSelectors.noDataText)).toBeVisible();
}

export async function assertCoursePageContent(page: Page) {
  await expect(
    page.getByRole('heading', { name: /Course Description/i })
  ).toBeVisible();
}

export async function acessEnroll(page: Page) {
  const enrollBtn = page.locator('button:has-text("Enroll Now")');
  const accessBtn = page.locator('button:has-text("Access Course")');

  console.log('🔍 Checking visibility of Enroll Now and Access Course...');

  // parallel check for visibility
  const isEnrollVisible = await enrollBtn.first().isVisible();
  const isAccessVisible = await accessBtn.first().isVisible();

  console.log('✅ Visibility:', { isEnrollVisible, isAccessVisible });

  if (isEnrollVisible) {
    console.log('➡️ Clicking Enroll Now');
    await assertCoursePageContent(page);
    await enrollBtn.first().click(), await page.waitForTimeout(5000);
    await assertCourseComponentsLoaded(page);
    return;
  }

  if (isAccessVisible) {
    console.log('➡️ Clicking Access Course');
    await assertCoursePageContent(page);
    await accessBtn.first().click(), await page.waitForTimeout(5000);
    await assertCourseComponentsLoaded(page);
    return;
  }
}

async function assertCourseComponentsLoaded(page: Page) {
  // Wait for nav tabs
  page.locator('a', { hasText: 'Progress' });

  await expect(page.locator('a', { hasText: 'Course' }).first()).toBeVisible();
  await expect(page.locator('a', { hasText: 'Progress' })).toBeVisible();
  await expect(page.locator('a', { hasText: 'Dates' })).toBeVisible();
  await expect(page.locator('a', { hasText: 'Discussion' })).toBeVisible();

  const sidebar = page.locator('.w-72.border-r');
  await expect(sidebar).toBeVisible();

  // Step 3: Get the content frame
  const iframeLocator = page.frameLocator('iframe#edx-iframe');
  await expect(page.locator('iframe#edx-iframe')).toBeVisible({
    timeout: 10000,
  });

  // Now check for text content inside the iframe
  await expect(iframeLocator.locator('text=Welcome to the Course')).toBeVisible(
    { timeout: 10000 }
  );
}

function verifyDataPathwayState(page: Page) {
  throw new Error('Function not implemented.');
}
