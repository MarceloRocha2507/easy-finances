import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, FileText, Table, FileSpreadsheet, Calendar, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

type ExportFormat = 'csv' | 'pdf';
type DataType = 'transactions' | 'categories' | 'summary';

export default function Exportacoes() {
  const { toast } = useToast();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [selectedDataTypes, setSelectedDataTypes] = useState<DataType[]>(['transactions']);
  const [isExporting, setIsExporting] = useState(false);

  const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
  const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

  const { data: transactions } = useTransactions({ startDate, endDate });

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

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

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes-${MONTHS[selectedMonth]}-${selectedYear}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    if (!transactions) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header
    pdf.setFontSize(18);
    pdf.text('Relatório de Transações', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(`${MONTHS[selectedMonth]} de ${selectedYear}`, pageWidth / 2, 28, { align: 'center' });

    // Summary
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    pdf.setFontSize(10);
    let yPos = 45;
    pdf.text(`Total de Receitas: ${formatCurrency(totalIncome)}`, 20, yPos);
    pdf.text(`Total de Despesas: ${formatCurrency(totalExpense)}`, 20, yPos + 6);
    pdf.text(`Saldo: ${formatCurrency(balance)}`, 20, yPos + 12);

    // Transactions
    yPos = 70;
    pdf.setFontSize(11);
    pdf.text('Data', 20, yPos);
    pdf.text('Descrição', 50, yPos);
    pdf.text('Categoria', 110, yPos);
    pdf.text('Valor', 160, yPos);

    pdf.setFontSize(9);
    yPos += 8;

    transactions.slice(0, 30).forEach((t) => {
      if (yPos > 280) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(formatDate(t.date), 20, yPos);
      pdf.text((t.description || '-').substring(0, 25), 50, yPos);
      pdf.text((t.category?.name || '-').substring(0, 20), 110, yPos);
      pdf.text(`${t.type === 'expense' ? '-' : '+'} ${formatCurrency(t.amount)}`, 160, yPos);
      yPos += 6;
    });

    pdf.save(`relatorio-${MONTHS[selectedMonth]}-${selectedYear}.pdf`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'csv') {
        handleExportCSV();
      } else {
        handleExportPDF();
      }
      toast({
        title: 'Exportação concluída!',
        description: `Arquivo ${selectedFormat.toUpperCase()} gerado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível gerar o arquivo.',
        variant: 'destructive',
      });
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
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Exportações</h1>
          <p className="text-muted-foreground">Exporte seus dados em diferentes formatos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Period Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Período
                </CardTitle>
                <CardDescription>Selecione o período para exportação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label className="mb-2 block">Mês</Label>
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label className="mb-2 block">Ano</Label>
                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Type Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Dados para Exportar</CardTitle>
                <CardDescription>Escolha quais dados incluir no arquivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dataTypeOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedDataTypes.includes(option.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-secondary/50 hover:bg-secondary'
                      }`}
                      onClick={() => toggleDataType(option.id)}
                    >
                      <Checkbox
                        checked={selectedDataTypes.includes(option.id)}
                        onCheckedChange={() => toggleDataType(option.id)}
                      />
                      <option.icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      {selectedDataTypes.includes(option.id) && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Format Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Formato do Arquivo</CardTitle>
                <CardDescription>Escolha o formato de exportação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedFormat === 'csv'
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-secondary/50 hover:bg-secondary'
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
                    className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedFormat === 'pdf'
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-secondary/50 hover:bg-secondary'
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

          {/* Export Summary & Action */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Resumo da Exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium">{MONTHS[selectedMonth]} de {selectedYear}</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Formato</p>
                  <p className="font-medium">{selectedFormat.toUpperCase()}</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Transações</p>
                  <p className="font-medium">{transactions?.length || 0} registros</p>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleExport}
                  disabled={isExporting || selectedDataTypes.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exportando...' : 'Exportar Dados'}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Dicas de Exportação</CardTitle>
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
