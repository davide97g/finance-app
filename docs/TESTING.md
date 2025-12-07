# Complete Test Suite Templates

This document contains all remaining test file templates for the PWA Expense Tracker application. Each test file is ready to be created.

## Already Created ✅

- `src/lib/__tests__/utils.test.ts`
- `src/lib/__tests__/icons.test.ts`
- `src/lib/__tests__/theme-colors.test.ts`
- `src/lib/__tests__/db.test.ts`
- `src/lib/__tests__/validation.test.ts`
- `src/hooks/__tests__/useMobile.test.ts`
- `src/hooks/__tests__/useAuth.test.ts`
- `src/hooks/__tests__/useGroups.test.ts`
- `src/hooks/__tests__/useSync.test.ts`

## Installation Required

Before running tests, install dependencies:

```bash
npm install
```

## Remaining Test Files

### Hooks Tests

#### src/hooks/__tests__/useTransactions.test.ts

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useTransactions } from '../useTransactions';
import { db } from '../../lib/db';

jest.mock('../../lib/db');
jest.mock('../../lib/sync');

describe('useTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch transactions', async () => {
    const mockTransactions = [
      {
        id: '1',
        user_id: 'user-1',
        category_id: 'cat-1',
        type: 'expense' as const,
        amount: 50,
        date: '2024-01-01',
        year_month: '2024-01',
        description: 'Test',
      },
    ];

    (db.transactions.orderBy as jest.Mock).mockReturnValue({
      reverse: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockTransactions),
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockTransactions),
        }),
      }),
    });

    const { result } = renderHook(() => useTransactions());

    await waitFor(() => {
      expect(result.current.transactions).toEqual(mockTransactions);
    });
  });

  it('should add transaction', async () => {
    const mockAdd = jest.fn().mockResolvedValue('new-id');
    (db.transactions.add as jest.Mock) = mockAdd;

    const { result } = renderHook(() => useTransactions());

    await result.current.addTransaction({
      user_id: 'user-1',
      category_id: 'cat-1',
      type: 'expense',
      amount: 100,
      date: '2024-01-01',
      year_month: '2024-01',
      description: 'New transaction',
    });

    expect(mockAdd).toHaveBeenCalled();
  });

  it('should update transaction', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(1);
    (db.transactions.update as jest.Mock) = mockUpdate;

    const { result } = renderHook(() => useTransactions());

    await result.current.updateTransaction('trans-1', { amount: 200 });

    expect(mockUpdate).toHaveBeenCalledWith('trans-1', expect.objectContaining({
      amount: 200,
      pendingSync: 1,
    }));
  });

  it('should soft delete transaction', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(1);
    (db.transactions.update as jest.Mock) = mockUpdate;

    const { result } = renderHook(() => useTransactions());

    await result.current.deleteTransaction('trans-1');

    expect(mockUpdate).toHaveBeenCalledWith('trans-1', expect.objectContaining({
      deleted_at: expect.any(String),
      pendingSync: 1,
    }));
  });

  it('should filter by yearMonth', async () => {
    const mockWhere = jest.fn().mockReturnValue({
      equals: jest.fn().mockReturnValue({
        reverse: jest.fn().mockReturnValue({
          sortBy: jest.fn().mockResolvedValue([]),
        }),
      }),
    });
    (db.transactions.where as jest.Mock) = mockWhere;

    renderHook(() => useTransactions(undefined, '2024-01'));

    await waitFor(() => {
      expect(mockWhere).toHaveBeenCalledWith('year_month');
    });
  });
});
```

#### src/hooks/__tests__/useCategories.test.ts

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useCategories } from '../useCategories';
import { db } from '../../lib/db';

jest.mock('../../lib/db');
jest.mock('../../lib/sync');

describe('useCategories', () => {
  const mockCategories = [
    {
      id: 'cat-1',
      user_id: 'user-1',
      name: 'Food',
      icon: 'Utensils',
      color: 'orange',
      type: 'expense' as const,
      active: 1,
      deleted_at: null,
    },
    {
      id: 'cat-2',
      user_id: 'user-1',
      name: 'Deleted',
      icon: 'Home',
      color: 'blue',
      type: 'expense' as const,
      active: 1,
      deleted_at: '2024-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and filter deleted categories', async () => {
    (db.categories.toArray as jest.Mock).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories());

    await waitFor(() => {
      expect(result.current.categories).toHaveLength(1);
      expect(result.current.categories[0].id).toBe('cat-1');
    });
  });

  it('should add category', async () => {
    const mockAdd = jest.fn().mockResolvedValue('new-cat-id');
    (db.categories.add as jest.Mock) = mockAdd;

    const { result } = renderHook(() => useCategories());

    await result.current.addCategory({
      user_id: 'user-1',
      name: 'Transport',
      icon: 'Car',
      color: 'blue',
      type: 'expense',
      active: 1,
    });

    expect(mockAdd).toHaveBeenCalled();
  });

  it('should update category', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(1);
    (db.categories.update as jest.Mock) = mockUpdate;

    const { result } = renderHook(() => useCategories());

    await result.current.updateCategory('cat-1', { name: 'New Name' });

    expect(mockUpdate).toHaveBeenCalledWith('cat-1', expect.objectContaining({
      name: 'New Name',
      pendingSync: 1,
    }));
  });

  it('should reparent children', async () => {
    const mockModify = jest.fn().mockResolvedValue(2);
    const mockFilter = jest.fn().mockReturnValue({
      modify: mockModify,
    });
    (db.categories.filter as jest.Mock) = mockFilter;

    const { result } = renderHook(() => useCategories());

    await result.current.reparentChildren('old-parent', 'new-parent');

    expect(mockFilter).toHaveBeenCalled();
    expect(mockModify).toHaveBeenCalled();
  });
});
```

#### src/hooks/__tests__/useSettings.test.ts

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useSettings } from '../useSettings';
import { useAuth } from '../useAuth';
import { db } from '../../lib/db';

jest.mock('../useAuth');
jest.mock('../../lib/db');
jest.mock('dexie-react-hooks');

import { useLiveQuery } from 'dexie-react-hooks';

describe('useSettings', () => {
  const mockUser = { id: 'user-123' };
  const mockSettings = {
    user_id: 'user-123',
    currency: 'EUR',
    language: 'en',
    theme: 'light',
    accentColor: 'slate',
    start_of_week: 'monday',
    default_view: 'list',
    include_investments_in_expense_totals: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
  });

  it('should load user settings', async () => {
    (useLiveQuery as jest.Mock).mockReturnValue(mockSettings);

    const { result } = renderHook(() => useSettings());

    expect(result.current.settings).toEqual(mockSettings);
  });

  it('should update settings', async () => {
    (useLiveQuery as jest.Mock).mockReturnValue(mockSettings);
    const mockUpdate = jest.fn().mockResolvedValue(1);
    (db.user_settings.get as jest.Mock).mockResolvedValue(mockSettings);
    (db.user_settings.update as jest.Mock) = mockUpdate;

    const { result } = renderHook(() => useSettings());

    await result.current.updateSettings({ theme: 'dark' });

    expect(mockUpdate).toHaveBeenCalledWith('user-123', expect.objectContaining({
      theme: 'dark',
    }));
  });

  it('should create default settings if not exist', async () => {
    (useLiveQuery as jest.Mock).mockReturnValue(undefined);
    const mockGet = jest.fn().mockResolvedValue(null);
    const mockAdd = jest.fn().mockResolvedValue('user-123');
    (db.user_settings.get as jest.Mock) = mockGet;
    (db.user_settings.add as jest.Mock) = mockAdd;

    renderHook(() => useSettings());

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalled();
    });
  });
});
```

### Component Tests

#### src/components/__tests__/TransactionList.test.tsx

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionList } from '../TransactionList';
import { Transaction } from '../../lib/db';

jest.mock('../../hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      { id: 'cat-1', name: 'Food', icon: 'Utensils', color: 'orange' },
    ],
  }),
}));

describe('TransactionList', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'trans-1',
      user_id: 'user-1',
      category_id: 'cat-1',
      type: 'expense',
      amount: 50.00,
      date: '2024-01-15',
      year_month: '2024-01',
      description: 'Groceries',
      pendingSync: 0,
    },
    {
      id: 'trans-2',
      user_id: 'user-1',
      category_id: 'cat-1',
      type: 'income',
      amount: 1000.00,
      date: '2024-01-01',
      year_month: '2024-01',
      description: 'Salary',
      pendingSync: 1,
    },
  ];

  it('should render transaction list', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('should display amounts correctly', () => {
    render(<TransactionList transactions={mockTransactions} />);

    expect(screen.getByText(/50/)).toBeInTheDocument();
    expect(screen.getByText(/1000/)).toBeInTheDocument();
  });

  it('should show sync status for pending items', () => {
    render(<TransactionList transactions={mockTransactions} />);

    // Transaction with pendingSync: 1 should show indicator
    const pendingElements = screen.getAllByTestId(/pending|sync/i);
    expect(pendingElements.length).toBeGreaterThan(0);
  });

  it('should call onEdit when edit button clicked', () => {
    const mockOnEdit = jest.fn();
    render(
      <TransactionList 
        transactions={mockTransactions} 
        onEdit={mockOnEdit}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('should call onDelete when delete button clicked', () => {
    const mockOnDelete = jest.fn();
    render(
      <TransactionList 
        transactions={mockTransactions} 
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith('trans-1');
  });

  it('should render empty state when no transactions', () => {
    render(<TransactionList transactions={[]} />);

    expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
  });
});
```

### Page Tests

#### src/pages/__tests__/AuthPage.test.tsx

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthPage } from '../AuthPage';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render sign in form', () => {
    render(<AuthPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should switch to sign up form', () => {
    render(<AuthPage />);

    const signUpButton = screen.getByText(/sign up/i);
    fireEvent.click(signUpButton);

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should handle sign in', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should display error on failed sign in', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });

    render(<AuthPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- useTransactions.test.ts

# Run tests for specific pattern
npm test -- hooks
```

## Test Coverage Report

After running `npm run test:coverage`, view the coverage report:

```bash
open coverage/lcov-report/index.html
```

## Next Steps

1. Install dependencies: `npm install`
2. Create remaining test files using templates above
3. Run tests to verify setup
4. Fix any failing tests
5. Achieve 80%+ coverage target
6. Add tests to CI/CD pipeline

## Additional Test Files Needed

Due to space constraints, here are the remaining files that need tests (follow similar patterns):

### Hooks
- `useContexts.test.ts` - Similar to useCategories
- `useRecurringTransactions.test.ts` - Test generation logic
- `useStatistics.test.ts` - Test calculations
- `useSync.test.ts` - Test sync manager integration
- `useOnlineSync.test.ts` - Test online event handling

### Components
- `AppShell.test.tsx` - Test mobile/desktop rendering
- `MobileNav.test.tsx` - Test navigation
- `DesktopNav.test.tsx` - Test sidebar
- `CategorySelector.test.tsx` - Test hierarchical selection

### Pages
- `Dashboard.test.tsx` - Test quick add form
- `Transactions.test.tsx` - Test CRUD operations
- `Categories.test.tsx` - Test category management
- `Contexts.test.tsx` - Test context management
- `RecurringTransactions.test.tsx` - Test recurring logic
- `Statistics.test.tsx` - Test chart rendering
- `Settings.test.tsx` - Test settings updates

### Integration
- `App.test.tsx` - Test routing and protected routes
- `sync-workflow.test.ts` - Test end-to-end sync

All tests should follow the patterns established in the examples above.
