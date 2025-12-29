import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('Authentication Flow', () => {
    let testUserEmail: string;

    test.beforeAll(async () => {
        if (!supabaseServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
        const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } });

        // Ensure user exists
        testUserEmail = 'user_a@example.com';
        const { error } = await supabase.auth.admin.updateUserById(
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // ID from seed.sql for user_a
            { password: 'password123' }
        );
        // If user not found (seeds might change), create one
        if (error) {
            const { data, error: createError } = await supabase.auth.admin.createUser({
                email: `auth_test_${Date.now()}@example.com`,
                password: 'password123',
                email_confirm: true
            });
            if (createError) throw createError;
            testUserEmail = data.user.email!;
        }
    });

    test.beforeEach(async ({ page }) => {
        // Bypass Welcome Wizard
        await page.addInitScript(() => {
            window.localStorage.setItem('gonuts_welcome_wizard', JSON.stringify({ completed: true, skipped: false, completedAt: new Date().toISOString() }));
        });
        await page.goto('/auth');
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.getByTestId('auth-email-input').fill(testUserEmail);
        await page.getByTestId('auth-password-input').fill('password123');
        await page.getByTestId('auth-submit-button').click();

        await expect(page).toHaveURL('/');
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.getByTestId('auth-email-input').fill(testUserEmail);
        await page.getByTestId('auth-password-input').fill('wrongpassword');
        await page.getByTestId('auth-submit-button').click();

        await expect(page.getByText('Invalid login credentials')).toBeVisible({ timeout: 5000 });
        // Optionally check URL stays on /auth
        expect(page.url()).toContain('/auth');
    });
});
