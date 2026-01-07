import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingItem } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ShoppingItemAutocompleteProps {
  items: ShoppingItem[];
  onSelect: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function ShoppingItemAutocomplete({
  items,
  onSelect,
  placeholder,
  className,
}: ShoppingItemAutocompleteProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter items based on search term
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show suggestions when typing
  useEffect(() => {
    setShowSuggestions(searchTerm.length > 0);
  }, [searchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    setSearchTerm("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    onSelect(name);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) return;

    handleSelect(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredItems[highlightedIndex].name);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              if (searchTerm.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t("add_item") || "Add item..."}
            className="pl-9"
          />
          {showSuggestions && filteredItems.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.name)}
                  className={cn(
                    "w-full text-left px-4 py-2 hover:bg-accent transition-colors",
                    index === highlightedIndex && "bg-accent"
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" size="default">
          <Plus className="h-4 w-4 mr-2" />
          {t("add") || "Add"}
        </Button>
      </form>
    </div>
  );
}
