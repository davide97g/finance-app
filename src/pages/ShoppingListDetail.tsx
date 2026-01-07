import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ShoppingItemAutocomplete } from "@/components/shopping/ShoppingItemAutocomplete";
import { ShoppingItemRow } from "@/components/shopping/ShoppingItemRow";
import { Button } from "@/components/ui/button";
import { ContentLoader } from "@/components/ui/content-loader";
import { Progress } from "@/components/ui/progress";
import { useShoppingCollections } from "@/hooks/useShoppingCollections";
import {
  ShoppingListItemWithItem,
  useShoppingItems,
} from "@/hooks/useShoppingItems";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import { List, Share2 } from "lucide-react";
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

  const handleShareList = async () => {
    if (!collectionId || !listId) return;
    const shareUrl = `${window.location.origin}/shopping-lists/${collectionId}/lists/${listId}`;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: list?.name || "",
          text: t("share_list_text") || `Check out my shopping list: ${list?.name || ""}`,
          url: shareUrl,
        });
        toast.success(t("list_shared") || "List shared");
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("link_copied") || "Link copied to clipboard");
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error(t("error.copy_failed") || "Failed to copy link");
    }
  };

  if (!collection || !list) {
    return <ContentLoader variant="card" count={3} />;
  }

  const checkedCount = listItems.filter((li) => li.checked).length;
  const totalCount = listItems.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{list.name}</h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShareList}
            className="shrink-0 sm:hidden"
            title={t("share") || "Share"}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleShareList}
            className="gap-2 hidden sm:flex"
          >
            <Share2 className="h-4 w-4" />
            {t("share") || "Share"}
          </Button>
        </div>

        {totalCount > 0 && (
          <div className="space-y-1.5 bg-card p-4 rounded-lg border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {checkedCount} / {totalCount} {t("items_checked") || "items checked"}
              </span>
              <span className="font-medium text-muted-foreground">
                {progress.toFixed(0)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <ShoppingItemAutocomplete
          items={items}
          onSelect={handleAddItem}
          placeholder={t("add_item") || "Add item..."}
        />

        {listItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
            <List className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center font-medium">
              {t("no_items_in_list") || "No items in this list yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
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
