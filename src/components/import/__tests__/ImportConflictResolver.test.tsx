import { render, screen } from '@testing-library/react';
import { ImportConflictResolver } from '../ImportConflictResolver';
import { PotentialMerge, RecurringConflict } from '../../../lib/import/types';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock translation
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            if (options && typeof options === 'string') return options; // Default value case
            return key; // Return key for simplicity in tests
        },
    }),
}));

describe('ImportConflictResolver', () => {
    const mockOnResolve = jest.fn();
    const mockOnCancel = jest.fn();

    const mockConflicts: PotentialMerge[] = [
        {
            imported: { id: 'imp-1', name: 'Alimentari', color: '#000000', icon: 'test' } as any,
            existing: { id: 'ex-1', name: 'Alimenti', color: '#ffffff' } as any,
            score: 1
        }
    ];

    const mockRecurringConflicts: RecurringConflict[] = [
        {
            imported: { id: 'rec-1', name: 'Netflix', amount: '10' } as any,
            existing: { id: 'ex-rec-1', name: 'Netflix', color: '#000000' } as any,
            score: 0
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render conflicts and allow toggling merge status', async () => {
        const user = userEvent.setup();
        render(
            <ImportConflictResolver
                conflicts={mockConflicts}
                recurringConflicts={[]}
                onResolve={mockOnResolve}
                onCancel={mockOnCancel}
            />
        );

        // Verify incoming and existing names are displayed
        expect(screen.getByText('Alimentari')).toBeInTheDocument();
        expect(screen.getByText('Alimenti')).toBeInTheDocument();

        // Check if "Merge" button is present (default state is merged/selected)
        const mergeButton = screen.getByRole('button', { name: /Merge/i });
        expect(mergeButton).toBeInTheDocument();

        // Click to toggle (should change to "Keep Both")
        await user.click(mergeButton);
        expect(screen.getByRole('button', { name: /Keep Both/i })).toBeInTheDocument();

        // Click again to toggle back
        await user.click(screen.getByRole('button', { name: /Keep Both/i }));
        expect(screen.getByRole('button', { name: /Merge/i })).toBeInTheDocument();
    });

    it('should confirm resolution with correct merge map', async () => {
        const user = userEvent.setup();
        render(
            <ImportConflictResolver
                conflicts={mockConflicts}
                recurringConflicts={[]}
                onResolve={mockOnResolve}
                onCancel={mockOnCancel}
            />
        );

        // Default: merged. Confirm.
        await user.click(screen.getByRole('button', { name: /Confirm & Continue/i }));

        expect(mockOnResolve).toHaveBeenCalledWith(
            expect.any(Map),
            expect.any(Set)
        );

        const mergeMap = mockOnResolve.mock.calls[0][0] as Map<string, string>;
        expect(mergeMap.get('imp-1')).toBe('ex-1');
    });

    it('should handle recurring conflicts tabs and skip logic', async () => {
        const user = userEvent.setup();
        render(
            <ImportConflictResolver
                conflicts={[]} // No categories, implies Recurring tab active
                recurringConflicts={mockRecurringConflicts}
                onResolve={mockOnResolve}
                onCancel={mockOnCancel}
            />
        );

        // Wait for tab content
        // Wait for tab content - duplicate text expected (imported vs existing)
        expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0);

        // Default: Skipped (Button)
        const skipButton = screen.getByRole('button', { name: /Skipped/i });
        expect(skipButton).toBeInTheDocument();

        // Toggle to Import New
        await user.click(skipButton);

        const importNewButton = screen.getByRole('button', { name: /Import New/i });
        expect(importNewButton).toBeInTheDocument();

        // Confirm
        await user.click(screen.getByRole('button', { name: /Confirm & Continue/i }));

        const skippedIds = mockOnResolve.mock.calls[0][1] as Set<string>;
        expect(skippedIds.has('rec-1')).toBe(false); // We unskipped it
    });
});
