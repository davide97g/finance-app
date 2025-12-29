import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('Groups Management', () => {
    let testUserEmail: string;

    test.beforeAll(async () => {
        if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
        const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

        // Ensure user exists (User A from seed)
        testUserEmail = 'user_a@example.com';
        const { error } = await supabase.auth.admin.updateUserById(
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            { password: 'password123' }
        );
        if (error) {
            // Fallback if seed user missing
            const { data, error: createError } = await supabase.auth.admin.createUser({
                email: `groups_test_${Date.now()}@example.com`,
                password: 'password123',
                email_confirm: true
            });
            if (createError) throw createError;
            testUserEmail = data.user.email!;
        }
    });

    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('gonuts_welcome_wizard', JSON.stringify({ completed: true, skipped: false, completedAt: new Date().toISOString() }));
        });

        // Login
        await page.goto('/auth');
        await page.getByTestId('auth-email-input').fill(testUserEmail);
        await page.getByTestId('auth-password-input').fill('password123');
        await page.getByTestId('auth-submit-button').click();
        await expect(page).toHaveURL('/');
    });

    test.describe('Mobile', () => {
        test.use({ viewport: { width: 375, height: 667 } });

        test('should create a new group', async ({ page }) => {
            const groupName = `Mobile Group ${Date.now()}`;
            const groupDesc = 'Created via Mobile E2E';

            await page.goto('/groups');
            // Wait for navigation
            await expect(page).toHaveURL('/groups');

            // Open Create Dialog
            await page.getByTestId('create-group-button').click();

            // Fill Form
            await page.getByTestId('group-name-input').fill(groupName);
            await page.getByTestId('group-description-input').fill(groupDesc);
            await page.getByTestId('save-group-button').click();

            // Verify
            // Scope to visible on mobile
            await expect(page.locator('.md\\:hidden').getByText(groupName)).toBeVisible();
            await expect(page.locator('.md\\:hidden').getByText(groupDesc)).toBeVisible();
        });
    });

    test.describe('Desktop', () => {
        test.use({ viewport: { width: 1280, height: 720 } });

        test('should create a new group', async ({ page }) => {
            const groupName = `Desktop Group ${Date.now()}`;
            const groupDesc = 'Created via Desktop E2E';

            await page.goto('/groups');
            await expect(page).toHaveURL('/groups');

            await page.getByTestId('create-group-button').click();

            await page.getByTestId('group-name-input').fill(groupName);
            await page.getByTestId('group-description-input').fill(groupDesc);
            await page.getByTestId('save-group-button').click();

            // Verify in Table
            // Desktop table might truncate description, so check Name primarily
            await expect(page.getByRole('row').filter({ hasText: groupName })).toBeVisible();
        });
    });
});
