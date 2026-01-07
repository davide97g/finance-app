import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { SwipeableItem } from "@/components/ui/SwipeableItem";
import { cn } from "@/lib/utils";
import { ShoppingListItemWithItem } from "@/hooks/useShoppingItems";

interface ShoppingItemRowProps {
  listItem: ShoppingListItemWithItem;
  onToggle: () => void;
  onDelete: () => void;
}

export function ShoppingItemRow({
  listItem,
  onToggle,
  onDelete,
}: ShoppingItemRowProps) {
  return (
    <SwipeableItem onDelete={onDelete} onClick={onToggle}>
      <div className="bg-card p-2.5 rounded-lg border shadow-sm flex items-center gap-2 cursor-pointer active:bg-muted/50 focus:outline-none">
        <Checkbox
          checked={listItem.checked}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 h-5 w-5 [&_svg]:h-3.5 [&_svg]:w-3.5"
        />
        <span
          className={cn(
            "flex-1 text-sm",
            listItem.checked && "line-through text-muted-foreground"
          )}
        >
          {listItem.item.name}
        </span>
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

