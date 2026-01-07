import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentLoader } from "@/components/ui/content-loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useShoppingCollections } from "@/hooks/useShoppingCollections";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Edit, List, Plus, Search, Trash2, Share2, Users } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export function ShoppingCollectionDetailPage() {
  const { t } = useTranslation();
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { collections } = useShoppingCollections();
  const { lists, addList, updateList, deleteList } = useShoppingLists(
    collectionId || null
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deletingList, setDeletingList] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newListName, setNewListName] = useState("");
  const [editListName, setEditListName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const collection = useMemo(() => {
    return collections?.find((c) => c.id === collectionId) || null;
  }, [collections, collectionId]);

  const filteredLists = useMemo(() => {
    if (!lists) return [];
    if (!searchQuery) return lists;
    return lists.filter((l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lists, searchQuery]);

  // Get items for all lists in the collection for preview
  const allListItems = useLiveQuery(async () => {
    if (!collectionId || !lists) return new Map();
    
    const listIds = lists.map((l) => l.id);
    const listItems = await db.shopping_list_items
      .filter((li) => listIds.includes(li.list_id) && !li.deleted_at)
      .toArray();
    
    const allItems = await db.shopping_items.toArray();
    const itemMap = new Map(allItems.map((i) => [i.id, i]));
    
    // Group items by list_id with checked state
    const itemsByList = new Map<string, Array<{ name: string; checked: boolean }>>();
    
    for (const listItem of listItems) {
      const item = itemMap.get(listItem.item_id);
      if (!item || item.deleted_at) continue;
      
      const existing = itemsByList.get(listItem.list_id) || [];
      existing.push({ name: item.name, checked: listItem.checked });
      itemsByList.set(listItem.list_id, existing);
    }
    
    // Sort items: unchecked first, then alphabetically
    for (const [_listId, items] of itemsByList.entries()) {
      items.sort((a, b) => {
        if (a.checked !== b.checked) {
          return a.checked ? 1 : -1; // unchecked first
        }
        return a.name.localeCompare(b.name);
      });
    }
    
    return itemsByList;
  }, [collectionId, lists]);

  const handleCreateList = async () => {
    if (!collectionId || !newListName.trim()) {
      toast.error(t("validation.name_required") || "Name is required");
      return;
    }

    try {
      await addList(collectionId, newListName.trim());
      toast.success(t("shopping_list_created") || "List created");
      setIsCreateDialogOpen(false);
      setNewListName("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.create_failed") || "Failed to create list"
      );
    }
  };

  const handleEditList = async () => {
    if (!editingList || !editListName.trim()) {
      toast.error(t("validation.name_required") || "Name is required");
      return;
    }

    try {
      await updateList(editingList.id, {
        name: editListName.trim(),
      });
      toast.success(t("shopping_list_updated") || "List updated");
      setEditingList(null);
      setEditListName("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.update_failed") || "Failed to update list"
      );
    }
  };

  const handleDeleteList = async () => {
    if (!deletingList) return;

    try {
      await deleteList(deletingList.id);
      toast.success(t("shopping_list_deleted") || "List deleted");
      setDeletingList(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.delete_failed") || "Failed to delete list"
      );
    }
  };

  const openEditList = (list: { id: string; name: string }) => {
    setEditingList(list);
    setEditListName(list.name);
  };

  const handleShareCollection = async () => {
    if (!collectionId) return;
    const shareUrl = `${window.location.origin}/shopping-lists/${collectionId}`;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection?.name || "",
          text: t("share_collection_text") || `Check out my shopping collection: ${collection?.name || ""}`,
          url: shareUrl,
        });
        toast.success(t("collection_shared") || "Collection shared");
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

  const handleShareList = async (list: { id: string; name: string }) => {
    if (!collectionId) return;
    const shareUrl = `${window.location.origin}/shopping-lists/${collectionId}/lists/${list.id}`;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: list.name,
          text: t("share_list_text") || `Check out my shopping list: ${list.name}`,
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

  if (!collection) {
    return <ContentLoader variant="card" count={3} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{collection.name}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1">
              <p className="text-sm sm:text-base text-muted-foreground">
                {t("shopping_collection_description") ||
                  "Manage lists in this collection"}
              </p>
              {collection.members && collection.members.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {collection.members.length}{" "}
                    {collection.members.length === 1
                      ? t("member") || "member"
                      : t("members") || "members"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={handleShareCollection}
            className="gap-2 w-full sm:w-auto"
          >
            <Share2 className="h-4 w-4" />
            {t("share") || "Share"}
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("create_list") || "Create List"}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("search_lists") || "Search lists..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredLists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <List className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? t("no_lists_found") || "No lists found"
                : t("no_lists") || "No lists in this collection yet"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("create_first_list") || "Create your first list"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLists.map((list) => (
            <Card
              key={list.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20"
              onClick={() =>
                navigate(`/shopping-lists/${collectionId}/lists/${list.id}`)
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg font-semibold leading-tight pr-2 break-words">
                    {list.name}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 min-size-override"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareList(list);
                      }}
                      title={t("share_list") || "Share list"}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 min-size-override"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditList(list);
                      }}
                      title={t("edit_list") || "Edit list"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 min-size-override"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingList(list);
                      }}
                      title={t("delete_list") || "Delete list"}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {allListItems && allListItems.get(list.id) && allListItems.get(list.id)!.length > 0 ? (
                  <>
                    {/* Progress Bar */}
                    {(() => {
                      const items = allListItems.get(list.id)!;
                      const totalItems = items.length;
                      const checkedItems = items.filter((item: { name: string; checked: boolean }) => item.checked).length;
                      const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
                      
                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {checkedItems} / {totalItems} {t("items_checked") || "items checked"}
                            </span>
                            <span className="font-medium text-muted-foreground">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      );
                    })()}
                    
                    {/* Item Preview */}
                    <div className="space-y-1">
                      {allListItems.get(list.id)!.slice(0, 3).map((item: { name: string; checked: boolean }, index: number) => (
                        <div
                          key={index}
                          className={cn(
                            "text-xs truncate",
                            item.checked
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          )}
                        >
                          {item.name}
                        </div>
                      ))}
                      {allListItems.get(list.id)!.length > 3 && (
                        <div className="text-xs text-muted-foreground font-medium">
                          + {allListItems.get(list.id)!.length - 3} {t("more") || "more"}...
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {t("no_items") || "No items yet"}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("create_list") || "Create List"}</DialogTitle>
            <DialogDescription>
              {t("create_list_description") || "Create a new shopping list"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("list_name") || "List name"}
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateList();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewListName("");
              }}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={handleCreateList}>
              {t("create") || "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingList}
        onOpenChange={(open) => {
          if (!open) {
            setEditingList(null);
            setEditListName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("edit_list") || "Edit List"}</DialogTitle>
            <DialogDescription>
              {t("edit_list_description") || "Update the list name"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("list_name") || "List name"}
              value={editListName}
              onChange={(e) => setEditListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEditList();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingList(null);
                setEditListName("");
              }}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={handleEditList}>{t("save") || "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deletingList}
        onOpenChange={(open) => {
          if (!open) setDeletingList(null);
        }}
        onConfirm={handleDeleteList}
        title={t("delete_list") || "Delete List"}
        description={
          t("delete_list_description") ||
          "Are you sure you want to delete this list? This will also delete all items in it."
        }
      />
    </div>
  );
}
