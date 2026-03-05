

## Problema

O formulário de "Novo Registro" (receita e despesa) está sem o campo **Data**. O formData tem `date: Date` e o `handleSubmit` usa `formData.date`, mas nenhum date picker é renderizado no dialog. A data está sempre fixada em `new Date()` (hoje), sem possibilidade de o usuário alterar.

Comparando as duas screenshots com o código (linhas 568-895), o formulário pula direto de Categoria para "Tipo de lançamento" (despesa) ou para o toggle de recorrência (receita), sem campo de data.

## Solucao

Adicionar um **Date Picker** no formulário, posicionado entre a Categoria e o "Tipo de lançamento". O componente Calendar + Popover já estão importados no arquivo.

## Alteracao

**Arquivo: `src/pages/Transactions.tsx`**

Inserir entre o bloco de Categoria (após linha ~683) e o bloco de "Tipo de lançamento" (linha 685) um campo de data:

```tsx
{/* Data */}
<div className="space-y-2">
  <Label>Data</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="w-full justify-start font-normal">
        <Calendar className="mr-2 h-4 w-4" />
        {format(formData.date, "dd/MM/yyyy", { locale: ptBR })}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <CalendarComponent
        mode="single"
        selected={formData.date}
        onSelect={(date) => date && setFormData({ ...formData, date })}
        locale={ptBR}
      />
    </PopoverContent>
  </Popover>
</div>
```

Todos os imports necessarios (Calendar, Popover, CalendarComponent, format, ptBR) ja estao presentes no arquivo.

