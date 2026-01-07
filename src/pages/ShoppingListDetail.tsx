import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ShoppingItemAutocomplete } from "@/components/shopping/ShoppingItemAutocomplete";
import { ShoppingItemRow } from "@/components/shopping/ShoppingItemRow";
import { Button } from "@/components/ui/button";
import { ContentLoader } from "@/components/ui/content-loader";
import { useShoppingCollections } from "@/hooks/useShoppingCollections";
import {
  ShoppingListItemWithItem,
  useShoppingItems,
} from "@/hooks/useShoppingItems";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import { ArrowLeft, List } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export function ShoppingListDetailPage() {
  const { t } = useTranslation();
  const { collectionId, listId } = useParams<{
    collectionId: string;
    listId: string;
  }>();
  const navigate = useNavigate();
  const { collections } = useShoppingCollections();
  const { lists } = useShoppingLists(collectionId || null);
  const { items, listItems, addItem, toggleItemChecked, removeItemFromList } =
    useShoppingItems(collectionId || null, listId || null);

  const [deletingListItem, setDeletingListItem] =
    useState<ShoppingListItemWithItem | null>(null);

  const collection = useMemo(() => {
    return collections?.find((c) => c.id === collectionId) || null;
  }, [collections, collectionId]);

  const list = useMemo(() => {
    return lists?.find((l) => l.id === listId) || null;
  }, [lists, listId]);

  const handleAddItem = async (name: string) => {
    if (!collectionId || !listId) return;

    try {
      await addItem(collectionId, name, listId);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.add_item_failed") || "Failed to add item"
      );
    }
  };

  const handleToggleItem = async (listItem: ShoppingListItemWithItem) => {
    try {
      await toggleItemChecked(listItem.id);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.toggle_failed") || "Failed to toggle item"
      );
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingListItem) return;

    try {
      await removeItemFromList(deletingListItem.id);
      toast.success(t("item_removed") || "Item removed");
      setDeletingListItem(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.delete_failed") || "Failed to remove item"
      );
    }
  };

  if (!collection || !list) {
    return <ContentLoader variant="card" count={3} />;
  }

  const checkedCount = listItems.filter((li) => li.checked).length;
  const totalCount = listItems.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/shopping-lists/${collectionId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{list.name}</h1>
          <p className="text-muted-foreground mt-1">
            {totalCount > 0
              ? `${checkedCount} / ${totalCount} ${
                  t("items_checked") || "items checked"
                }`
              : t("no_items") || "No items yet"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <ShoppingItemAutocomplete
          items={items}
          onSelect={handleAddItem}
          placeholder={t("add_item") || "Add item..."}
        />

        {listItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
            <List className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {t("no_items_in_list") || "No items in this list yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {t("add_items_hint") ||
                "Start typing to add items from your collection"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {listItems.map((listItem) => (
              <ShoppingItemRow
                key={listItem.id}
                listItem={listItem}
                onToggle={() => handleToggleItem(listItem)}
                onDelete={() => setDeletingListItem(listItem)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deletingListItem}
        onOpenChange={(open) => {
          if (!open) setDeletingListItem(null);
        }}
        onConfirm={handleDeleteItem}
        title={t("remove_item") || "Remove Item"}
        description={
          t("remove_item_description") ||
          "Are you sure you want to remove this item from the list? The item will remain in the collection."
        }
      />
    </div>
  );
}
