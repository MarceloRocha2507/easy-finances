import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ImportStatus = "idle" | "preview" | "importing" | "success" | "error";

interface PreviewRow {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  valid: boolean;
  error?: string;
}

export default function Importar() {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [helpOpen, setHelpOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Verificar tipo de arquivo
    const validTypes = [".csv", ".txt", ".ofx"];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    
    if (!validTypes.includes(fileExt)) {
      toast.error("Formato não suportado. Use CSV, TXT ou OFX.");
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast.error("Arquivo vazio ou formato inválido");
        return;
      }

      setPreviewData(rows);
      setStatus("preview");
      toast.success(`${rows.length} transações encontradas`);
    } catch (error) {
      toast.error("Erro ao ler arquivo");
      console.error(error);
    }
  };

  const parseCSV = (text: string): PreviewRow[] => {
    const lines = text.split("\n").filter(line => line.trim());
    const rows: PreviewRow[] = [];
    
    // Pular cabeçalho se existir
    const startIndex = lines[0]?.toLowerCase().includes("data") || 
                       lines[0]?.toLowerCase().includes("date") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Suportar tanto vírgula quanto ponto e vírgula como separador
      const separator = line.includes(";") ? ";" : ",";
      const parts = line.split(separator).map(p => p.trim().replace(/"/g, ""));
      
      if (parts.length >= 3) {
        const [dateStr, description, amountStr] = parts;
        const amount = parseFloat(amountStr.replace(",", ".").replace(/[^\d.-]/g, ""));
        
        const valid = !isNaN(amount) && description.length > 0 && dateStr.length > 0;
        
        rows.push({
          date: dateStr,
          description: description.slice(0, 100),
          amount: Math.abs(amount),
          type: amount < 0 ? "expense" : "income",
          valid,
          error: valid ? undefined : "Dados inválidos"
        });
      }
    }
    
    return rows;
  };

  const handleImport = async () => {
    const validRows = previewData.filter(r => r.valid);
    
    if (validRows.length === 0) {
      toast.error("Nenhuma transação válida para importar");
      return;
    }

    setStatus("importing");

    // Simulação de importação - em produção, chamar API
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success(`${validRows.length} transações importadas com sucesso!`);
    setStatus("success");
    setPreviewData([]);
    setFileName("");
  };

  const handleReset = () => {
    setStatus("idle");
    setPreviewData([]);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = `Data,Descrição,Valor
01/01/2024,Salário,5000.00
05/01/2024,Aluguel,-1500.00
10/01/2024,Mercado,-350.50
15/01/2024,Freelance,800.00`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_importacao.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Modelo baixado!");
  };

  const validCount = previewData.filter(r => r.valid).length;
  const invalidCount = previewData.filter(r => !r.valid).length;

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Importar Transações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importe transações de arquivos CSV, TXT ou OFX
          </p>
        </div>

        {/* Área de Upload */}
        {status === "idle" && (
          <>
            <Card>
              <CardContent className="pt-6">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.ofx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium text-foreground">
                    Clique para selecionar um arquivo
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    ou arraste e solte aqui
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Badge variant="secondary">CSV</Badge>
                    <Badge variant="secondary">TXT</Badge>
                    <Badge variant="secondary">OFX</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formatos Suportados */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-income/10 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-income" />
                    </div>
                    <div>
                      <p className="font-medium">CSV / Excel</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Formato mais comum. Exporte do seu banco ou crie manualmente.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">OFX</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Formato bancário padrão. Disponível na maioria dos bancos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/50 flex items-center justify-center">
                      <Download className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Modelo CSV</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Baixe nosso modelo para preencher manualmente.
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="px-0 h-auto mt-1"
                        onClick={downloadTemplate}
                      >
                        Baixar modelo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ajuda */}
            <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Como preparar seu arquivo?
                      </CardTitle>
                      {helpOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="font-medium">Formato esperado do CSV:</p>
                        <code className="block mt-2 p-3 bg-muted rounded text-xs">
                          Data,Descrição,Valor<br />
                          01/01/2024,Salário,5000.00<br />
                          05/01/2024,Aluguel,-1500.00
                        </code>
                      </div>
                      <Separator />
                      <div>
                        <p className="font-medium">Regras importantes:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                          <li>Use valores negativos para despesas</li>
                          <li>Formato de data aceito: DD/MM/AAAA ou AAAA-MM-DD</li>
                          <li>Separador pode ser vírgula (,) ou ponto e vírgula (;)</li>
                          <li>Valores decimais com ponto ou vírgula</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </>
        )}

        {/* Preview */}
        {status === "preview" && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Prévia da Importação</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <FileSpreadsheet className="h-4 w-4" />
                      {fileName}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-income/20 text-income">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {validCount} válidas
                    </Badge>
                    {invalidCount > 0 && (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {invalidCount} inválidas
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <TableRow key={index} className={!row.valid ? "bg-destructive/5" : ""}>
                          <TableCell className="font-mono text-sm">{row.date}</TableCell>
                          <TableCell>{row.description}</TableCell>
                          <TableCell>
                            <Badge variant={row.type === "income" ? "default" : "secondary"}>
                              {row.type === "income" ? "Receita" : "Despesa"}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-medium ${row.type === "income" ? "text-income" : "text-expense"}`}>
                            {row.type === "income" ? "+" : "-"}R$ {row.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            {row.valid ? (
                              <CheckCircle2 className="h-4 w-4 text-income mx-auto" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {previewData.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    Mostrando 10 de {previewData.length} transações
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} transações
              </Button>
            </div>
          </>
        )}

        {/* Importing */}
        {status === "importing" && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="font-medium">Importando transações...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Isso pode levar alguns segundos
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {status === "success" && (
          <Card className="border-income">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-income/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-income" />
                </div>
                <p className="text-xl font-bold text-foreground">Importação concluída!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suas transações foram importadas com sucesso
                </p>
                <Button className="mt-6" onClick={handleReset}>
                  Importar mais transações
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
