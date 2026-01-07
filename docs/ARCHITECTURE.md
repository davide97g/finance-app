# System Architecture

## Philosophy: Immediate Writes with Offline Queue

PWA GoNuts uses an **immediate write** strategy. All operations attempt to write directly to Supabase immediately. If offline or on error, operations are queued locally and retried automatically when connection is restored.

### Why Immediate Writes?
1.  **Instant Sync**: Changes are pushed to the server immediately, ensuring data is always up-to-date across devices.
2.  **Offline Support**: Failed operations are queued locally and retried automatically when online.
3.  **Simplicity**: No complex sync logic or conflict resolution needed - the server is the source of truth.

---

## High-Level Diagram

```mermaid
graph TD
    User[User / UI] -->|Immediate Write| Supabase[Remote DB (Supabase)]
    Supabase -->|On Success| Dexie[Local DB (Dexie.js)]
    User -->|If Offline/Error| Queue[Retry Queue]
    Queue -->|When Online| Supabase
    Supabase -->|Realtime Updates| Dexie
    
    subgraph Client [Browser / PWA]
        User
        Dexie
        Queue
    end
    
    subgraph Cloud
        Supabase
    end
```

## Core Components

### 1. The Local Database (Dexie.js)
*   **Role**: The Source of Truth for the UI.
*   **Implementation**: `src/lib/db.ts`
*   **Behavior**: ALL reads happening in React components come from here. We generally *never* `await supabase.from(...).select(...)` inside a UI component.
*   **Reactive**: We use `useLiveQuery` which automatically re-renders React components whenever the Dexie data changes (whether changed by the user or by the background sync).

### 2. Immediate Write Operations
*   **Role**: Write data directly to Supabase with offline queue fallback.
*   **Implementation**: `src/lib/dbOperations.ts` & `src/lib/retryQueue.ts`
*   **Strategy**: 
    *   **Immediate Write**: All operations attempt Supabase write immediately.
    *   **Offline Queue**: Failed operations stored in IndexedDB queue, retried when online.
    *   **Realtime**: Subscribes via `supabase.channel` to PostgreSQL changes for instant cross-device updates.

### 3. The Auth Provider
*   **Role**: Manages User Identity.
*   **Implementation**: `src/contexts/AuthProvider.tsx`
*   **Behavior**: It creates a "Session" that persists even if offline. If the app boots offline, it uses the cached user object to allow immediate access to the private data in Dexie.

### 4. Application Logic (Hooks)
*   **Role**: The bridge between UI and Data.
*   **Implementation**: `src/hooks/*.ts`
*   **Pattern**: Components use hooks like `useTransactions()`. These hooks encapsulate the `useLiveQuery` logic. The component doesn't know it's talking to IndexedDB; it just gets an array of data that updates automatically.

---

## Data Flow Scenarios

### Scenario A: User Adds a Transaction (Online)
1.  User clicks "Save".
2.  `useTransactions.addTransaction()` is called.
3.  `insertRecord()` attempts immediate write to Supabase.
4.  On success: Record written to both Supabase and Dexie.
5.  UI updates **instantly** (thanks to `useLiveQuery`).

### Scenario B: User Adds a Transaction (Offline)
1.  User clicks "Save".
2.  `insertRecord()` attempts Supabase write but fails (offline).
3.  Record written optimistically to Dexie.
4.  Operation queued in Retry Queue.
5.  When online: Retry Queue automatically retries the operation.
6.  On success: Queue entry removed, local record updated with server response.

### Scenario C: Another Device Updates a Shared Group
1.  Device B updates a Group Name.
2.  Supabase broadcasts a `postgres_changes` event (`UPDATE`).
3.  Device A (User) receives event via `useRealtimeSync`.
4.  `useRealtimeSync` writes the new name to Dexie.
5.  Dexie fires an event.
6.  UI re-renders with the new Group Name visible.
