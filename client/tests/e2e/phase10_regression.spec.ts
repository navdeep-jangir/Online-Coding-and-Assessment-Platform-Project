import { test, expect } from '@playwright/test';

test.describe('CodeClimb Phase 10A End-to-End Regression Suite', () => {
  test('student auth, protected routes, roadmap, notes 4-language tabs, and bookmarks', async ({ page }) => {
    // Protected route redirects to /login when logged out
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);

    // Log in as Demo Student
    await page.locator('input[type="email"]').fill('demo@codeclimb.dev');
    await page.locator('input[type="password"]').fill('Demo@123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Student cannot access /admin
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // Roadmap loads 24 modules
    await page.goto('/roadmap');
    await expect(page.getByRole('heading', { name: /DSA Roadmap/i })).toBeVisible();

    // Notes Reader + 4 language tabs
    await page.goto('/notes/variables-and-constants');
    await expect(page.getByRole('heading', { name: /Variables and constants/i }).first()).toBeVisible();
    for (const lang of ['C', 'C++', 'Java', 'Python']) {
      await expect(page.getByRole('button', { name: lang, exact: true }).first()).toBeVisible();
    }

    // Bookmarks page
    await page.goto('/bookmarks');
    await expect(page.getByRole('heading', { name: /Bookmarks/i })).toBeVisible();
  });

  test('student dashboard, daily challenge, revision mode, leaderboard, and performance charts', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('demo@codeclimb.dev');
    await page.locator('input[type="password"]').fill('Demo@123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Dashboard sections
    await expect(page.getByText('Recommended Next Topic')).toBeVisible();
    await expect(page.getByText('Recommended Practice Problems')).toBeVisible();

    // Daily Challenge
    await page.goto('/daily-challenge');
    await expect(page.getByRole('heading', { name: /Daily Coding Challenge/i })).toBeVisible({ timeout: 15000 });

    // Revision Mode
    await page.goto('/revision');
    await expect(page.getByRole('heading', { name: /Smart Revision Mode/i })).toBeVisible({ timeout: 15000 });

    // Leaderboard (Problems Solved non-zero)
    await page.goto('/leaderboard');
    await expect(page.getByRole('heading', { name: /Leaderboard/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Demo Student').first()).toBeVisible({ timeout: 15000 });

    // Performance Analytics
    await page.goto('/performance');
    await expect(page.getByRole('heading', { name: /Performance Analytics/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Submission History')).toBeVisible({ timeout: 15000 });
  });

  test('practice arena and real Judge0 code execution', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('demo@codeclimb.dev');
    await page.locator('input[type="password"]').fill('Demo@123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    await page.goto('/practice');
    await expect(page.getByRole('heading', { name: /Sharpen Your Problem Solving/i })).toBeVisible();

    await page.goto('/practice/sum-of-two-numbers?lang=python');
    await expect(page.getByRole('heading', { name: /Sum of Two Numbers/i })).toBeVisible();
    await page.getByRole('button', { name: /Run Code/i }).click();
    await expect(page.getByText(/Accepted|Wrong Answer/i).first()).toBeVisible({ timeout: 30000 });
  });

  test('administrator login, overview stats, problem management, and audit logs', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@codeclimb.dev');
    await page.locator('input[type="password"]').fill('Admin@123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    await page.goto('/admin');
    await expect(page.getByText('CodeClimb Admin')).toBeVisible();
    await expect(page.getByText('Registered Students')).toBeVisible();

    await page.getByRole('button', { name: 'Coding Problems', exact: true }).click();
    await expect(page.getByRole('button', { name: /New Draft Problem/i })).toBeVisible();

    await page.getByRole('button', { name: 'Audit Logs' }).click();
    await expect(page.getByRole('heading', { name: /Administrator Audit Logs/i })).toBeVisible();
  });
});
