import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, User, Crown, UserPlus } from "lucide-react";
import { useResponsaveis, Responsavel } from "@/services/responsaveis";

interface ResponsavelSelectorProps {
  value: string | null;
  onChange: (responsavelId: string | null, responsavel?: Responsavel) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  onAddNew?: () => void;
}

export function ResponsavelSelector({
  value,
  onChange,
  label,
  placeholder = "Selecionar responsável",
  required = false,
  onAddNew,
}: ResponsavelSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: responsaveis = [], isLoading } = useResponsaveis();

  const selected = responsaveis.find((r) => r.id === value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={isLoading}
          >
            {selected ? (
              <div className="flex items-center gap-2">
                {selected.is_titular ? (
                  <Crown className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <span>{selected.apelido || selected.nome}</span>
                {selected.is_titular && (
                  <Badge variant="secondary" className="text-xs ml-1">
                    Eu
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">
                {isLoading ? "Carregando..." : placeholder}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar pessoa..." />
            <CommandList>
              <CommandEmpty>Nenhuma pessoa encontrada.</CommandEmpty>
              <CommandGroup>
                {responsaveis.map((responsavel) => (
                  <CommandItem
                    key={responsavel.id}
                    value={responsavel.nome}
                    onSelect={() => {
                      onChange(responsavel.id, responsavel);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {responsavel.is_titular ? (
                        <Crown className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{responsavel.apelido || responsavel.nome}</span>
                      {responsavel.apelido && responsavel.apelido !== responsavel.nome && (
                        <span className="text-xs text-muted-foreground">
                          ({responsavel.nome})
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === responsavel.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              {onAddNew && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onAddNew();
                    }}
                    className="text-primary"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar nova pessoa
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}