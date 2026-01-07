# Development, Testing & Release Strategy

## 1. Environment Management (Database & API)

Managing different environments (Development, Staging, Production) is crucial for a stable release. Since you are using **Supabase**, the best practice is to utilize the **Supabase CLI** for local development.

### A. Local Development (Recommended)

Instead of connecting your local `localhost` app to a remote "Dev" Supabase project, run Supabase locally. This gives you a fast, isolated environment that includes the database, auth, and edge functions.

**Setup:**

1.  Install Supabase CLI: `brew install supabase/tap/supabase`
2.  Initialize in project: `supabase init`
3.  Start local stack: `supabase start`
    - This provides a local URL (e.g., `http://127.0.0.1:54321`) and keys.
4.  Link to your remote project (optional but recommended for schema sync): `supabase link --project-ref <your-project-id>`

### B. Environment Variables

Use `.env` files to manage connections.

- `.env.local`: Local development (not committed). Use local Supabase credentials here.
- `.env.staging`: Staging environment (optional).
- `.env.production`: Production environment.

**Example `.env.local`:**

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-local-anon-key>
```

## 2. Testing Strategy

A mature application should have a mix of testing layers.

### A. Unit Tests (Jest) - _Existing_

Continue using Jest for:

- Pure logic functions (e.g., currency conversion, date formatting).
- Complex algorithm verification (e.g., generic recurring transaction logic).
- Isolated component rendering (using `@testing-library/react`).

### B. End-to-End (E2E) Transactions (Playwright) - _Recommended_

For "Critical Paths" (e.g., creating a transaction, verifying budget updates), Unit Tests are often insufficient because they mock the database.
**Playwright** allows you to test the full flow:

1.  Spin up the app.
2.  Seed the _local_ database with known data.
3.  Simulate a user logging in and clicking buttons.
4.  Verify that the "Balance" on screen actually updates.

**Why Playwright?**

- It works visually (browser automation).
- It's reliable and fast.
- It can easily withstand changes in underlying implementation details (refactoring) as long as the UI stays the same.

**Proposed Test Flow:**

1.  **Pre-test**: Reset DB (`supabase db reset`) to ensure a clean slate.
2.  **Test**: Run Playwright script.
    - Script: Logs in -> Adds €50 Expense -> Navigates to Dashboard -> Checks if Total Expense increased by €50.

## 3. Database Management & Migrations

Never make changes directly in the Supabase Dashboard for a production app. Use **Migrations**.

### Workflow:

1.  **Make changes locally**: Edit headers/tables in your local Supabase Studio (`http://127.0.0.1:54323`).
2.  **Generate Migration**:
    ```bash
    supabase db diff -f add_new_column_to_transactions
    ```
    This creates a SQL file in `supabase/migrations`.
3.  **Review**: Check the SQL file to ensure it checks out.
4.  **Push to Prod**:
    - Automatic: Connect Supabase to GitHub. Pushing to `main` applies migrations.
    - Manual: `supabase db push` (Use with caution).

## 4. Seeding Data

You already have `seed_data.sql`. This is excellent.

- **Local Dev**: `supabase db reset` automatically parses `supabase/seed.sql`. Copy your `seed_data.sql` content there to always start with a populated data set (User A, User B, Transactions).
- **Automated Tests**: You can create a specialized `seed_test.sql` for consistent test states.

## 5. CI/CD (Continuous Integration)

Set up a **GitHub Action** to ensure quality before every merge.

**Suggested Workflow (`.github/workflows/ci.yml`):**

1.  **Trigger**: On Pull Request to `main`.
2.  **Jobs**:
    - **Lint**: `npm run lint` (Catch syntax/style errors).
    - **Type Check**: `tsc -b` (Catch TypeScript errors).
    - **Unit Test**: `npm test` (Run Jest).
    - **E2E Test** (Advanced): Spin up Supabase Local -> Run Playwright.

---

### **Action Plan Summary**

1.  **Install Supabase CLI** and get `supabase start` working.
2.  **Move `seed_data.sql`** to `supabase/seed.sql` to power your local dev environment.
3.  **Set up Playwright** (`npm init playwright@latest`) and write **one** critical test (e.g., "Add Transaction").
4.  **Create a CI Pipeline** to run Lint & Unit Tests automatically.
