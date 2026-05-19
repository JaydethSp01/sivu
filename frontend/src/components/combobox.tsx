import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxProps<T> {
  items: T[];
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  placeholder: string;
  searchPlaceholder?: string;
  getKey: (i: T) => number;
  getLabel: (i: T) => string;
  getSecondary?: (i: T) => string | undefined;
  disabled?: boolean;
  allowClear?: boolean;
  emptyLabel?: string;
  className?: string;
}

export function Combobox<T>({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Buscar...",
  getKey,
  getLabel,
  getSecondary,
  disabled,
  allowClear = false,
  emptyLabel = "Sin resultados.",
  className,
}: ComboboxProps<T>): JSX.Element {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => getKey(i) === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? getLabel(selected) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {allowClear && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-4 w-4", value == null ? "opacity-100" : "opacity-0")} />
                  <span className="text-muted-foreground">(sin selección)</span>
                </CommandItem>
              )}
              {items.map((i) => {
                const k = getKey(i);
                return (
                  <CommandItem
                    key={k}
                    value={`${getLabel(i)} ${getSecondary?.(i) ?? ""} ${k}`}
                    onSelect={() => {
                      onChange(k);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("h-4 w-4", value === k ? "opacity-100" : "opacity-0")} />
                    <div className="flex flex-col">
                      <span>{getLabel(i)}</span>
                      {getSecondary?.(i) && (
                        <span className="text-xs text-muted-foreground">{getSecondary(i)}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
