import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBancos } from "@/services/bancos";
import { Building2, Plus } from "lucide-react";
import { NovoBancoDialog } from "./NovoBancoDialog";

interface BancoSelectorProps {
  value: string | null;
  onChange: (bancoId: string | null) => void;
  label?: string;
  placeholder?: string;
  showAddButton?: boolean;
}

export function BancoSelector({
  value,
  onChange,
  label = "Banco",
  placeholder = "Selecione o banco",
  showAddButton = true,
}: BancoSelectorProps) {
  const { data: bancos = [], refetch } = useBancos();
  const [novoOpen, setNovoOpen] = useState(false);

  const handleChange = (val: string) => {
    if (val === "none") {
      onChange(null);
    } else {
      onChange(val);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Select value={value || "none"} onValueChange={handleChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">Nenhum banco</span>
            </SelectItem>
            {bancos.map((banco) => (
              <SelectItem key={banco.id} value={banco.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: banco.cor }}
                  />
                  <span>{banco.nome}</span>
                  {banco.codigo && (
                    <span className="text-xs text-muted-foreground">
                      ({banco.codigo})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showAddButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setNovoOpen(true)}
            title="Adicionar banco"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <NovoBancoDialog
        open={novoOpen}
        onOpenChange={setNovoOpen}
        onSaved={() => {
          refetch();
          setNovoOpen(false);
        }}
      />
    </div>
  );
}
