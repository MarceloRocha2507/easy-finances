import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CreditCard, ArrowRightLeft, ShoppingCart, Tag, Users, Landmark, Loader2 } from "lucide-react";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "@/components/ui/command";
import { globalSearch, SearchResult } from "@/services/global-search";
import { formatCurrency } from "@/lib/formatters";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await globalSearch(q);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    handleSearch(debouncedQuery);
  }, [debouncedQuery, handleSearch]);

  const onSelect = (result: SearchResult) => {
    setOpen(false);
    if (result.url) {
      navigate(result.url);
    }
  };

  const categories = Array.from(new Set(results.map(r => r.category)));

  const getIcon = (category: string) => {
    switch (category) {
      case "Cartões": return <CreditCard className="mr-2 h-4 w-4" />;
      case "Transações": return <ArrowRightLeft className="mr-2 h-4 w-4" />;
      case "Compras no Cartão": return <ShoppingCart className="mr-2 h-4 w-4" />;
      case "Categorias": return <Tag className="mr-2 h-4 w-4" />;
      case "Responsáveis": return <Users className="mr-2 h-4 w-4" />;
      case "Bancos": return <Landmark className="mr-2 h-4 w-4" />;
      default: return <Search className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-full border border-border/50 transition-colors w-full max-w-[240px] text-left"
      >
        <Search className="h-4 w-4" />
        <span>Busca global...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Pesquisar por cartões, despesas, responsáveis..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Buscando...</span>
            </div>
          )}
          
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para começar a buscar.
            </div>
          )}

          {categories.map((cat) => (
            <CommandGroup key={cat} heading={cat}>
              {results
                .filter((r) => r.category === cat)
                .map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => onSelect(result)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center">
                      {getIcon(result.category)}
                      <div className="flex flex-col">
                        <span>{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-muted-foreground">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-xs text-muted-foreground">
                      {result.amount !== undefined && (
                        <span className="font-medium text-foreground">
                          {formatCurrency(result.amount)}
                        </span>
                      )}
                      {result.date && (
                        <span>
                          {format(new Date(result.date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
