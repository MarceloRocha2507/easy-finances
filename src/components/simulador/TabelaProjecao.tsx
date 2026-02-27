import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { TableProperties } from "lucide-react";
import type { ProjecaoMes } from "@/hooks/useSimuladorCompra";

interface Props {
  projecao: ProjecaoMes[];
  valorSeguranca: number;
}

export function TabelaProjecao({ projecao, valorSeguranca }: Props) {
  return (
    <Card className="border rounded-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TableProperties className="w-4 h-4" />
          Detalhamento Mês a Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Parcela</TableHead>
                <TableHead className="text-right">Saldo s/ compra</TableHead>
                <TableHead className="text-right">Saldo c/ compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projecao.map((row) => {
                const isNegative = row.saldoComCompra < 0;
                const isBelowSafety =
                  !isNegative &&
                  valorSeguranca > 0 &&
                  row.saldoComCompra < valorSeguranca;

                return (
                  <TableRow
                    key={row.mes}
                    className={cn(
                      isNegative && "bg-destructive/10",
                      isBelowSafety && "bg-yellow-500/10"
                    )}
                  >
                    <TableCell className="font-medium capitalize">
                      {row.mesLabel}
                    </TableCell>
                    <TableCell className="text-right text-[hsl(var(--income))]">
                      {formatCurrency(row.receitasPrevistas)}
                    </TableCell>
                    <TableCell className="text-right text-destructive">
                      {formatCurrency(row.despesasPrevistas)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.parcelaCompra > 0
                        ? formatCurrency(row.parcelaCompra)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(row.saldoSemCompra)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        isNegative && "text-destructive",
                        isBelowSafety && "text-yellow-600"
                      )}
                    >
                      {formatCurrency(row.saldoComCompra)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
