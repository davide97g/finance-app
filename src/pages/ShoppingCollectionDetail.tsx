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
import { useShoppingCollections } from "@/hooks/useShoppingCollections";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import { ArrowLeft, Edit, List, Plus, Search, Trash2 } from "lucide-react";
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

  if (!collection) {
    return <ContentLoader variant="card" count={3} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/shopping-lists")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          <p className="text-muted-foreground mt-1">
            {t("shopping_collection_description") ||
              "Manage lists in this collection"}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("create_list") || "Create List"}
        </Button>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLists.map((list) => (
            <Card
              key={list.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                navigate(`/shopping-lists/${collectionId}/lists/${list.id}`)
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{list.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditList(list);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingList(list);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
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
