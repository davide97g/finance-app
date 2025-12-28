import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');
    // Basic sanity check
    await expect(page).toHaveTitle(/GoNuts/);
});
