import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, Table, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FiltroDataRange } from '@/components/FiltroDataRange';
import { Skeleton } from '@/components/ui/skeleton';
import jsPDF from 'jspdf';
import { startOfMonth, endOfMonth, format } from 'date-fns';

type ExportFormat = 'csv' | 'pdf';
type DataType = 'transactions' | 'categories' | 'summary';

export default function Exportacoes() {
  const { toast } = useToast();
  const hoje = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(hoje));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(hoje));
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [selectedDataTypes, setSelectedDataTypes] = useState<DataType[]>(['transactions']);
  const [isExporting, setIsExporting] = useState(false);

  const startDateStr = startDate ? startDate.toISOString().split('T')[0] : undefined;
  const endDateStr = endDate ? endDate.toISOString().split('T')[0] : undefined;

  const { data: transactions, isLoading, refetch } = useTransactions({ startDate: startDateStr, endDate: endDateStr });

  const periodLabel = startDate && endDate
    ? `${format(startDate, 'dd-MM-yy')}_${format(endDate, 'dd-MM-yy')}`
    : 'periodo';

  const toggleDataType = (dataType: DataType) => {
    setSelectedDataTypes(prev =>
      prev.includes(dataType)
        ? prev.filter(t => t !== dataType)
        : [...prev, dataType]
    );
  };

  const handleExportCSV = () => {
    if (!transactions) return;
    const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status'];
    const rows = transactions.map((t) => [
      formatDate(t.date),
      t.type === 'income' ? 'Receita' : 'Despesa',
      t.category?.name || 'Sem categoria',
      t.description || '',
      t.amount.toString(),
      t.status === 'completed' ? 'Pago' : 'Pendente',
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes-${periodLabel}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    if (!transactions) return;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.setFontSize(18);
    pdf.text('Relatório de Transações', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(12);
    const subtitle = startDate && endDate
      ? `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
      : '';
    pdf.text(subtitle, pageWidth / 2, 28, { align: 'center' });

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    pdf.setFontSize(10);
    let yPos = 45;
    pdf.text(`Total de Receitas: ${formatCurrency(totalIncome)}`, 20, yPos);
    pdf.text(`Total de Despesas: ${formatCurrency(totalExpense)}`, 20, yPos + 6);
    pdf.text(`Saldo: ${formatCurrency(balance)}`, 20, yPos + 12);

    yPos = 70;
    pdf.setFontSize(11);
    pdf.text('Data', 20, yPos);
    pdf.text('Descrição', 50, yPos);
    pdf.text('Categoria', 110, yPos);
    pdf.text('Valor', 160, yPos);

    pdf.setFontSize(9);
    yPos += 8;
    transactions.slice(0, 30).forEach((t) => {
      if (yPos > 280) { pdf.addPage(); yPos = 20; }
      pdf.text(formatDate(t.date), 20, yPos);
      pdf.text((t.description || '-').substring(0, 25), 50, yPos);
      pdf.text((t.category?.name || '-').substring(0, 20), 110, yPos);
      pdf.text(`${t.type === 'expense' ? '-' : '+'} ${formatCurrency(t.amount)}`, 160, yPos);
      yPos += 6;
    });
    pdf.save(`relatorio-${periodLabel}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'csv') handleExportCSV();
      else handleExportPDF();
      toast({ title: 'Exportação concluída!', description: `Arquivo ${selectedFormat.toUpperCase()} gerado com sucesso.` });
    } catch {
      toast({ title: 'Erro na exportação', description: 'Não foi possível gerar o arquivo.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const dataTypeOptions = [
    { id: 'transactions', label: 'Transações', description: 'Lista completa de receitas e despesas', icon: Table },
    { id: 'categories', label: 'Por Categoria', description: 'Totais agrupados por categoria', icon: FileSpreadsheet },
    { id: 'summary', label: 'Resumo', description: 'Visão geral do período', icon: FileText },
  ] as const;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Central de Exportações</h1>
          <p className="text-sm text-muted-foreground">Exporte seus dados em diferentes formatos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Period */}
            <Card className="border shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium">Período</CardTitle>
                <CardDescription>Selecione o período para exportação</CardDescription>
              </CardHeader>
              <CardContent>
                <FiltroDataRange
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onRefresh={refetch}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>

            {/* Data Type Selection */}
            <Card className="border shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium">Dados para Exportar</CardTitle>
                <CardDescription>Escolha quais dados incluir no arquivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataTypeOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedDataTypes.includes(option.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-secondary/50 hover:bg-secondary'
                      }`}
                      onClick={() => toggleDataType(option.id)}
                    >
                      <Checkbox checked={selectedDataTypes.includes(option.id)} onCheckedChange={() => toggleDataType(option.id)} />
                      <option.icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {selectedDataTypes.includes(option.id) && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Format Selection */}
            <Card className="border shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium">Formato do Arquivo</CardTitle>
                <CardDescription>Escolha o formato de exportação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedFormat === 'csv' ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/50 hover:bg-secondary'
                    }`}
                    onClick={() => setSelectedFormat('csv')}
                  >
                    <Table className="w-10 h-10 text-primary" />
                    <div className="text-center">
                      <p className="font-medium">CSV</p>
                      <p className="text-sm text-muted-foreground">Para planilhas</p>
                    </div>
                  </div>
                  <div
                    className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-colors ${
                      selectedFormat === 'pdf' ? 'border-primary bg-primary/5' : 'border-transparent bg-secondary/50 hover:bg-secondary'
                    }`}
                    onClick={() => setSelectedFormat('pdf')}
                  >
                    <FileText className="w-10 h-10 text-primary" />
                    <div className="text-center">
                      <p className="font-medium">PDF</p>
                      <p className="text-sm text-muted-foreground">Para impressão</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium">Resumo da Exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Período</p>
                      <p className="font-medium">
                        {startDate && endDate
                          ? `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
                          : '-'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Formato</p>
                      <p className="font-medium">{selectedFormat.toUpperCase()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/50">
                      <p className="text-sm text-muted-foreground">Transações</p>
                      <p className="font-medium">{transactions?.length || 0} registros</p>
                    </div>
                  </>
                )}

                <Button className="w-full" size="lg" onClick={handleExport} disabled={isExporting || selectedDataTypes.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exportando...' : 'Exportar Dados'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-base font-medium">Dicas de Exportação</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Use <strong>CSV</strong> para abrir no Excel ou Google Sheets</p>
                <p>• Use <strong>PDF</strong> para relatórios impressos</p>
                <p>• Os dados são filtrados pelo período selecionado</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
