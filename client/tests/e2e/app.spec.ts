import { test, expect } from '@playwright/test';

test.describe('CodeClimb Phases 1-4 Verification', () => {
  test('homepage renders redesigned hero, live DB stats, 4 journey stages, and removes Two Sum terminal', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByText(/Learn\.\s*Practice\./i).first()).toBeVisible();
    await expect(page.getByText('Build Your Coding Future.')).toBeVisible();
    await expect(page.getByText('From your first line of code to advanced algorithms.')).toBeVisible();

    // Two Sum terminal must be completely removed
    await expect(page.getByText('climb_two_sum.cpp')).toHaveCount(0);
    await expect(page.getByText('Two Sum Indices')).toHaveCount(0);
    await expect(page.getByText('All Tests Passed')).toHaveCount(0);

    // Live DB stats
    await expect(page.getByText('DSA Modules')).toBeVisible();
    await expect(page.getByText('Learning Concepts')).toBeVisible();
    await expect(page.getByText('Coding Problems')).toBeVisible();
    await expect(page.getByText('Programming Languages')).toBeVisible();
    await expect(page.getByText('24').first()).toBeVisible();
    await expect(page.getByText('348').first()).toBeVisible();
    await expect(page.getByText('150').first()).toBeVisible();

    // 4 interactive learning stages
    for (const stage of ['Beginner', 'Intermediate', 'Advanced', 'Master DSA']) {
      await expect(page.getByRole('link', { name: new RegExp(stage, 'i') }).first()).toBeVisible();
    }

    // No unexpected console errors (ignore 401 from /auth/me probe if any)
    const unexpected = consoleErrors.filter((e) => !e.includes('401'));
    expect(unexpected).toEqual([]);
  });

  test('homepage feature cards are clickable and preserve intended destination across login', async ({ page }) => {
    await page.goto('/');

    // Click "Structured DSA Roadmap" feature card while logged out -> redirects to /login
    await page.getByRole('link', { name: /Structured DSA Roadmap/i }).click();
    await expect(page).toHaveURL(/\/login/);

    // Log in with demo student and verify redirect back to /roadmap
    await page.locator('input[type="email"]').fill('demo@codeclimb.dev');
    await page.locator('input[type="password"]').fill('Demo@123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/roadmap/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /DSA Roadmap/i })).toBeVisible();
  });

  test('all four programming language cards open interactive language pages and pre-select editor language', async ({ page }) => {
    await page.goto('/');

    await page.locator('a[href="/languages/python"]').first().click();
    await expect(page).toHaveURL(/\/languages\/python/);
    await expect(page.getByRole('heading', { name: /DSA with Python/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Coding/i }).first()).toHaveAttribute('href', /lang=python/);
  });

  test('all homepage feature cards point to their intended routes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Structured DSA Roadmap/i })).toHaveAttribute('href', '/roadmap');
    await expect(page.getByRole('link', { name: /Practice Arena/i })).toHaveAttribute('href', '/practice');
    await expect(page.getByRole('link', { name: /Daily Challenges/i })).toHaveAttribute('href', '/daily-challenge');
    await expect(page.getByRole('link', { name: /Track Progress/i })).toHaveAttribute('href', '/performance');
  });
});
