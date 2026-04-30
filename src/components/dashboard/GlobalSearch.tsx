
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CreditCard, ArrowRightLeft, ShoppingCart, Tag, Users, Landmark, Loader2, Repeat, Target, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
} from "@/components/ui/command";
import { globalSearch, SearchResult } from "@/services/global-search";
import { formatCurrency } from "@/lib/formatters";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function GlobalSearch({ variant = "default" }: { variant?: "default" | "minimal" | "icon" }) {
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
    if (open) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery, handleSearch, open]);

  const onSelect = (result: SearchResult) => {
    setOpen(false);
    if (result.url) {
      navigate(result.url);
    }
  };

  const categories = Array.from(new Set(results.map(r => r.category)));

  const getIcon = (category: string) => {
    switch (category) {
      case "Cartões": return <CreditCard className="mr-2 h-4 w-4 text-primary" />;
      case "Transações": return <ArrowRightLeft className="mr-2 h-4 w-4 text-primary" />;
      case "Compras no Cartão": return <ShoppingCart className="mr-2 h-4 w-4 text-primary" />;
      case "Categorias": return <Tag className="mr-2 h-4 w-4 text-primary" />;
      case "Responsáveis": return <Users className="mr-2 h-4 w-4 text-primary" />;
      case "Bancos": return <Landmark className="mr-2 h-4 w-4 text-primary" />;
      case "Assinaturas": return <Repeat className="mr-2 h-4 w-4 text-primary" />;
      case "Metas": return <Target className="mr-2 h-4 w-4 text-primary" />;
      case "Investimentos": return <BarChart3 className="mr-2 h-4 w-4 text-primary" />;
      default: return <Search className="mr-2 h-4 w-4 text-primary" />;
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-muted/50 transition-colors shrink-0 text-muted-foreground hover:text-foreground"
          title="Busca global (Ctrl+K)"
        >
          <Search className="h-5 w-5" />
        </button>
      ) : variant === "minimal" ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-md border border-border/50 transition-all w-full text-left"
          title="Busca global (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Buscar...</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg border border-border shadow-sm transition-all w-full max-w-[240px] text-left group"
          title="Busca global (Ctrl+K)"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="truncate group-hover:text-foreground transition-colors font-medium">Busca global...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex ml-auto shrink-0 shadow-xs">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}

      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        shouldFilter={false}
      >
        <CommandInput 
          placeholder="Pesquisar por cartões, despesas, responsáveis..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[80vh] sm:max-h-[400px]">
          {isLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Buscando...</span>
            </div>
          )}
          
          {!isLoading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}

          {!isLoading && query.length < 2 && (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <Search className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Digite pelo menos 2 caracteres para pesquisar em todo o sistema.
              </p>
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
                    className="flex items-center justify-between cursor-pointer py-3"
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      {getIcon(result.category)}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-xs text-muted-foreground ml-2 shrink-0">
                      {result.amount !== undefined && (
                        <span className="font-semibold text-foreground">
                          {formatCurrency(result.amount)}
                        </span>
                      )}
                      {result.date && (
                        <span>
                          {format(new Date(result.date), "dd MMM yyyy", { locale: ptBR })}
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
