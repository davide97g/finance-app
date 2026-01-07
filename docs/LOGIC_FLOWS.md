# Logic Flows & Processes

This document details the exact sequence of events for critical application processes.

## 1. Authentication & Boot Process
**Goal**: Show the user their data as fast as possible (Instant Load), even if offline.

**File**: `src/contexts/AuthProvider.tsx`

1.  **App Mounts**: `AuthProvider` initializes.
2.  **Cache Check**: Checks `localStorage` for `expense_tracker_cached_user`.
    *   *Found*: Immediately sets `user` state. App renders the Dashboard. (Time: ~50ms)
    *   *Not Found*: App shows loading spinner.
3.  **Network Check**:
    *   **If Offline**: Stays in "Cached" mode. User can work normally.
    *   **If Online**: Fires `supabase.auth.getSession()` in the background to validate the token.
        *   *Valid*: Updates user state if metadata changed.
        *   *Invalid/Expired*:
            *   If using Cached User: Starts "Session Expired" countdown (5s toast).
            *   If No Cache: Redirects to `/auth`.
4.  **Cleanup**: After 10s, runs `cleanupSoftDeletedRecords()` to retain DB hygiene.

---

## 2. Data Operations & Retry Queue
**Goal**: Write data immediately to Supabase, queue failed operations for retry.

**File**: `src/lib/dbOperations.ts` & `src/lib/retryQueue.ts`

### Immediate Write Flow:
1.  **Operation Triggered**: User action (add/update/delete) calls `insertRecord()`, `updateRecord()`, or `deleteRecord()`.
2.  **Attempt Supabase Write**: Operation attempts immediate write to Supabase.
3.  **On Success**: 
    *   Record written to Supabase.
    *   Local IndexedDB updated with server response.
    *   UI updates via `useLiveQuery`.
4.  **On Failure (Offline/Error)**:
    *   Record written optimistically to IndexedDB.
    *   Operation queued in Retry Queue (stored in IndexedDB).
    *   When online: Retry Queue automatically retries all queued operations.
    *   On success: Queue entry removed.
    *   After max attempts: Queue entry removed (operation failed permanently).

---

## 3. Recurring Transactions Logic
**Goal**: Automatically create transactions from templates (e.g., "Netflix Subscription").

**File**: `src/hooks/useAutoGenerate.ts` & `src/lib/recurring.ts`

1.  **Trigger**: Runs on App Mount (inside `ProtectedRoute`).
2.  **Query**: Fetches active `recurring_transactions` from Dexie.
3.  **Evaluation**: For each template:
    *   Calculates `next_due_date` based on `last_generated` (or `start_date` if never generated) + formula (`frequency`).
    *   *Check*: Is `next_due_date <= TODAY`?
4.  **Generation**:
    *   If due, creates a **NEW** Transaction via `insertRecord()` (immediate write to Supabase).
    *   Updates the Template's `last_generated` date via `updateRecord()` (immediate write).
    *   *Loop*: Repeats if multiple periods were missed (e.g., app wasn't opened for 3 months -> generates 3 entries).
5.  **Offline Handling**: If offline, operations are queued and retried automatically when online.

---

## 5. Category Deletion & Migration
**Goal**: Safeguard data integrity when removing categories with associated data.

**File**: `src/pages/Categories.tsx` & `src/components/categories/CategoryMigrationDialog.tsx`

1.  **Conflict Detection**: Before deleting, the system checks for:
    *   Associated Transactions.
    *   Associated Recurring Transactions.
    *   Child Categories (Subcategories).
2.  **Sequential Resolution**:
    *   **Phase 1 (Transactions)**: User must choose to either **Migrate** transactions to a new category or **Delete All** (dangerous action).
    *   **Phase 2 (Subcategories)**: Once transactions are handled, if subcategories exist, the user must decide to move them to the parent level or delete them.
3.  **Execution**:
    *   Updates are performed via `updateRecord()` or `deleteRecord()` (immediate writes).
    *   If offline, operations are queued for retry.

---

## 6. Bank Import Wizard
**Goal**: Flexible CSV/JSON data ingestion with mobile optimization.

**File**: `src/components/import/ImportWizard.tsx`

1.  **File Loading**: Supports JSON (legacy app) and CSV (custom mapping).
2.  **Preview Phase**: Displays a card-based summary of incoming data.
3.  **Mapping Phase**: User maps CSV columns to Transaction fields (Amount, Date, Description).
4.  **Reconciliation**: Categorizes transactions based on keyword matching or manual selection.
5.  **Finalize**: Batch writes validated records to Dexie.

---

## 7. Category Color Semantic Palette
**Goal**: Assign meaningful colors based on category types.

**File**: `src/lib/colors.ts`

1.  **Type-Based Seed**:
    *   `Expense`: Warm colors (Reds/Oranges).
    *   `Income`: Green tones.
    *   `Investment`: Blue/Vibrant Indigo.
2.  **Variation Engine**: Uses a HSL-based generator to produce unique variations for subcategories, ensuring siblings are distinguishable while maintaining type-consistency.

---

## 4. Reset & Clear Data
**Goal**: Handle logout or "Fresh Start".

**File**: `src/lib/db.ts` -> `clearLocalCache()`

1.  User clicks Logout.
2.  **Confirmation**: Shows `SafeLogoutDialog` for confirmation.
3.  If confirmed, `AuthProvider` calls `db.clearLocalCache()`.
4.  **Dexie Truncate**: Runs `table.clear()` on ALL tables.
    *   *Note*: This wipes IndexedDB but leaves Supabase untouched.
5.  **Retry Queue Clear**: Clears any queued operations.
6.  `localStorage` cache is cleared.
7.  Redirect to `/auth`.
