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
import {
  ShoppingCollectionWithMembers,
  useShoppingCollections,
} from "@/hooks/useShoppingCollections";
import { Edit, Plus, Search, ShoppingCart, Trash2, Users, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ShoppingListsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { collections, addCollection, updateCollection, deleteCollection } =
    useShoppingCollections();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<ShoppingCollectionWithMembers | null>(null);
  const [deletingCollection, setDeletingCollection] =
    useState<ShoppingCollectionWithMembers | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [editCollectionName, setEditCollectionName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCollections = useMemo(() => {
    if (!collections) return [];
    if (!searchQuery) return collections;
    return collections.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collections, searchQuery]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error(t("validation.name_required") || "Name is required");
      return;
    }

    try {
      await addCollection(newCollectionName.trim(), false);
      toast.success(t("shopping_collection_created") || "Collection created");
      setIsCreateDialogOpen(false);
      setNewCollectionName("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.create_failed") || "Failed to create collection"
      );
    }
  };

  const handleEditCollection = async () => {
    if (!editingCollection || !editCollectionName.trim()) {
      toast.error(t("validation.name_required") || "Name is required");
      return;
    }

    try {
      await updateCollection(editingCollection.id, {
        name: editCollectionName.trim(),
      });
      toast.success(t("shopping_collection_updated") || "Collection updated");
      setEditingCollection(null);
      setEditCollectionName("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.update_failed") || "Failed to update collection"
      );
    }
  };

  const handleDeleteCollection = async () => {
    if (!deletingCollection) return;

    try {
      await deleteCollection(deletingCollection.id);
      toast.success(t("shopping_collection_deleted") || "Collection deleted");
      setDeletingCollection(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("error.delete_failed") || "Failed to delete collection"
      );
    }
  };

  const openEditCollection = (collection: ShoppingCollectionWithMembers) => {
    setEditingCollection(collection);
    setEditCollectionName(collection.name);
  };

  const handleShareCollection = async (collection: ShoppingCollectionWithMembers) => {
    const shareUrl = `${window.location.origin}/shopping-lists/${collection.id}`;
    
    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.name,
          text: t("share_collection_text") || `Check out my shopping collection: ${collection.name}`,
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

  if (!collections) {
    return <ContentLoader variant="card" count={3} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t("shopping_lists") || "Shopping Lists"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {t("shopping_lists_description") ||
              "Manage your shopping collections and lists"}
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full sm:w-auto shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("create_collection") || "Create Collection"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("search_collections") || "Search collections..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredCollections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? t("no_collections_found") || "No collections found"
                : t("no_collections") || "No shopping collections yet"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("create_first_collection") || "Create your first collection"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCollections.map((collection) => (
            <Card
              key={collection.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20"
              onClick={() => navigate(`/shopping-lists/${collection.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg font-semibold leading-tight pr-2 break-words">
                    {collection.name}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 min-size-override"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareCollection(collection);
                      }}
                      title={t("share_collection") || "Share collection"}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 min-size-override"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditCollection(collection);
                      }}
                      title={t("edit_collection") || "Edit collection"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 min-size-override"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCollection(collection);
                      }}
                      title={t("delete_collection") || "Delete collection"}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>
                      {collection.members.length}{" "}
                      {collection.members.length === 1
                        ? t("member") || "member"
                        : t("members") || "members"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareCollection(collection);
                    }}
                  >
                    <Share2 className="h-3 w-3 mr-1.5" />
                    <span className="hidden sm:inline">{t("share") || "Share"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("create_collection") || "Create Collection"}
            </DialogTitle>
            <DialogDescription>
              {t("create_collection_description") ||
                "Create a new shopping collection"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("collection_name") || "Collection name"}
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateCollection();
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
                setNewCollectionName("");
              }}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={handleCreateCollection}>
              {t("create") || "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingCollection}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCollection(null);
            setEditCollectionName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("edit_collection") || "Edit Collection"}
            </DialogTitle>
            <DialogDescription>
              {t("edit_collection_description") || "Update the collection name"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("collection_name") || "Collection name"}
              value={editCollectionName}
              onChange={(e) => setEditCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEditCollection();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingCollection(null);
                setEditCollectionName("");
              }}
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button onClick={handleEditCollection}>
              {t("save") || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deletingCollection}
        onOpenChange={(open) => {
          if (!open) setDeletingCollection(null);
        }}
        onConfirm={handleDeleteCollection}
        title={t("delete_collection") || "Delete Collection"}
        description={
          t("delete_collection_description") ||
          "Are you sure you want to delete this collection? This will also delete all lists and items in it."
        }
      />
    </div>
  );
}
