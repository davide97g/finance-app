import { useLiveQuery } from "dexie-react-hooks";
import { Checkbox } from "@/components/ui/checkbox";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import { SwipeableItem } from "@/components/ui/SwipeableItem";
import { cn } from "@/lib/utils";
import { ShoppingListItemWithItem } from "@/hooks/useShoppingItems";
import { db } from "@/lib/db";

interface ShoppingItemRowProps {
  listItem: ShoppingListItemWithItem;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function ShoppingItemRow({
  listItem,
  onToggle,
  onDelete,
  onEdit,
}: ShoppingItemRowProps) {
  // Check if item has images
  const hasImages = useLiveQuery(async () => {
    const images = await db.shopping_list_item_images
      .filter((img) => img.list_item_id === listItem.id && !img.deleted_at)
      .count();
    return images > 0;
  }, [listItem.id]);

  const quantity = listItem.quantity || 1;
  const hasNote = listItem.note && listItem.note.trim().length > 0;

  const handleClick = () => {
    onEdit();
  };

  return (
    <SwipeableItem onDelete={onDelete} onEdit={onEdit} onClick={handleClick}>
      <div 
        className="bg-card p-2.5 rounded-lg border shadow-sm flex items-center gap-2 cursor-pointer active:bg-muted/50 focus:outline-none"
        onClick={(e) => {
          // Don't open edit dialog if clicking checkbox or delete button
          if (
            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
            (e.target as HTMLElement).closest('button[aria-label="Delete item"]')
          ) {
            return;
          }
          handleClick();
        }}
      >
        <Checkbox
          checked={listItem.checked}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 h-5 w-5 [&_svg]:h-3.5 [&_svg]:w-3.5"
        />
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "text-sm truncate",
              listItem.checked && "line-through text-muted-foreground"
            )}
          >
            {listItem.item.name}
            {quantity > 1 && (
              <span className="text-muted-foreground ml-1">(x{quantity})</span>
            )}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {hasNote && (
              <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-label="Has note" />
            )}
            {hasImages && (
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" aria-label="Has images" />
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 p-1 hover:bg-destructive/10 rounded transition-colors"
          aria-label="Delete item"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </SwipeableItem>
  );
}

