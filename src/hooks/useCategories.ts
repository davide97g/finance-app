import { useLiveQuery } from 'dexie-react-hooks';
import { db, Category } from '../lib/db';
import { syncManager } from '../lib/sync';
import { v4 as uuidv4 } from 'uuid';

export function useCategories() {
    const categories = useLiveQuery(() =>
        db.categories.toArray()
    );

    // Filter out deleted items in JS if Dexie query is tricky with null
    const activeCategories = categories?.filter(c => !c.deleted_at) || [];

    const addCategory = async (category: Omit<Category, 'id' | 'sync_token' | 'pendingSync' | 'deleted_at'>) => {
        const id = uuidv4();
        await db.categories.add({
            ...category,
            id,
            active: category.active ?? 1,
            pendingSync: 1,
            deleted_at: null,
        });
        syncManager.sync();
    };

    const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'sync_token' | 'pendingSync'>>) => {
        await db.categories.update(id, {
            ...updates,
            pendingSync: 1,
        });
    };

    const deleteCategory = async (id: string) => {
        await db.categories.update(id, {
            deleted_at: new Date().toISOString(),
            pendingSync: 1,
        });
    };

    const reparentChildren = async (oldParentId: string, newParentId: string | undefined) => {
        // Find all children of the old parent
        // Since parent_id is not indexed, we use filter
        await db.categories
            .filter(c => c.parent_id === oldParentId)
            .modify({
                parent_id: newParentId,
                pendingSync: 1
            });
        syncManager.sync();
    };

    return {
        categories: activeCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        reparentChildren,
    };
}
