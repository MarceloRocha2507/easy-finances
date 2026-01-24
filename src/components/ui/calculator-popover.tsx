import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { Calculator, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CalculatorPopoverProps {
  onResult: (value: number) => void;
  trigger?: React.ReactNode;
}

function calcularExpressao(expr: string): number | null {
  // Normalizar a expressão
  const normalized = expr
    .replace(/,/g, ".")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .trim();

  // Se está vazio, retornar null
  if (!normalized) return null;

  // Validar que só contém números e operadores permitidos
  if (!/^[\d+\-*/.\s]+$/.test(normalized)) {
    return null;
  }

  // Verificar se termina com operador (expressão incompleta)
  if (/[+\-*/]$/.test(normalized)) {
    return null;
  }

  try {
    // Usar Function para avaliar de forma mais segura que eval
    const result = new Function(`return (${normalized})`)();
    return typeof result === "number" && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function CalculatorPopover({ onResult, trigger }: CalculatorPopoverProps) {
  const [open, setOpen] = useState(false);
  const [expressao, setExpressao] = useState("");
  const [resultado, setResultado] = useState<number | null>(null);

  // Recalcular resultado quando expressão mudar
  useEffect(() => {
    const res = calcularExpressao(expressao);
    setResultado(res);
  }, [expressao]);

  // Adicionar caractere à expressão
  const adicionarCaractere = useCallback((char: string) => {
    setExpressao((prev) => {
      // Prevenir múltiplos operadores seguidos
      const ultimoChar = prev.slice(-1);
      const operadores = ["+", "−", "×", "÷"];
      
      if (operadores.includes(char) && operadores.includes(ultimoChar)) {
        // Substituir operador anterior
        return prev.slice(0, -1) + char;
      }
      
      // Prevenir múltiplas vírgulas no mesmo número
      if (char === ",") {
        // Encontrar o último número na expressão
        const partes = prev.split(/[+−×÷]/);
        const ultimoNumero = partes[partes.length - 1];
        if (ultimoNumero.includes(",")) {
          return prev; // Já tem vírgula neste número
        }
      }
      
      return prev + char;
    });
  }, []);

  // Limpar expressão
  const limpar = useCallback(() => {
    setExpressao("");
    setResultado(null);
  }, []);

  // Backspace
  const apagar = useCallback(() => {
    setExpressao((prev) => prev.slice(0, -1));
  }, []);

  // Calcular e usar o valor
  const usarValor = useCallback(() => {
    if (resultado !== null && resultado > 0) {
      onResult(resultado);
      setExpressao("");
      setResultado(null);
      setOpen(false);
    }
  }, [resultado, onResult]);

  // Calcular (pressionar =)
  const calcular = useCallback(() => {
    if (resultado !== null) {
      // Substituir expressão pelo resultado
      setExpressao(resultado.toString().replace(".", ","));
    }
  }, [resultado]);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setExpressao("");
      setResultado(null);
    }
  }, [open]);

  const botoes = [
    ["7", "8", "9", "÷", "⌫"],
    ["4", "5", "6", "×", ""],
    ["1", "2", "3", "−", ""],
    ["0", ",", "C", "+", "="],
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label="Abrir calculadora"
          >
            <Calculator className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          {/* Header */}
          <div className="text-sm font-medium text-center">Calculadora</div>

          {/* Display */}
          <div className="p-2 bg-muted rounded-md min-h-[48px] flex flex-col justify-center">
            <div className="text-sm text-muted-foreground break-all">
              {expressao || "0"}
            </div>
            {resultado !== null && expressao && (
              <div className="text-lg font-semibold text-foreground">
                = {resultado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="grid grid-cols-5 gap-1">
            {botoes.flat().map((btn, index) => {
              if (btn === "") return <div key={index} />;

              const isOperador = ["÷", "×", "−", "+"].includes(btn);
              const isAcao = ["C", "⌫", "="].includes(btn);

              return (
                <Button
                  key={index}
                  type="button"
                  variant={isOperador ? "secondary" : isAcao ? "outline" : "ghost"}
                  size="sm"
                  className={`h-10 text-base font-medium ${
                    btn === "=" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                  }`}
                  onClick={() => {
                    if (btn === "C") {
                      limpar();
                    } else if (btn === "⌫") {
                      apagar();
                    } else if (btn === "=") {
                      calcular();
                    } else {
                      adicionarCaractere(btn);
                    }
                  }}
                >
                  {btn === "⌫" ? <Delete className="h-4 w-4" /> : btn}
                </Button>
              );
            })}
          </div>

          {/* Botão Usar Valor */}
          <Button
            type="button"
            className="w-full"
            disabled={resultado === null || resultado <= 0}
            onClick={usarValor}
          >
            Usar valor
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
