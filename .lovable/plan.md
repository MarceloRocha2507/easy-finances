
## Plano: Seletor de Mês da Fatura + Verificação de Duplicatas

### Problema Identificado
1. **Compras de meses futuros sem mês atual**: Quando você importa uma compra que começa no mês 2 de 3 (por exemplo), ela existe nos meses futuros mas não no mês atual
2. **Duplicação**: Ao reimportar, compras idênticas são criadas novamente (veja no banco: "54.824.042 LUCAS DE BRITO MARQUES - 2/3" aparece duplicado)

### Solução Proposta

#### 1. Seletor de Mês da Fatura no Preview
Adicionar um componente na tabela de preview que permita escolher/alterar o mês da fatura de cada compra importada:

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│ # │ Status │ Data │ Descrição │ Parcela │ Total │ Responsável │ Fatura │ Tipo  │
├───┼────────┼──────┼───────────┼─────────┼───────┼─────────────┼────────┼───────┤
│ 1 │   ✓    │ 05/01│ Nortmotos │ R$ 175  │R$1400 │     eu      │[Fev/26▾]│ 4/8  │
│ 2 │   ✓    │ 22/01│ IOF       │ R$ 0,16 │   -   │     eu      │[Fev/26▾]│Única │
└─────────────────────────────────────────────────────────────────────────────────┘
```

O seletor de "Fatura" será um dropdown com:
- 6 meses anteriores ao calculado
- 6 meses posteriores ao calculado
- Mês calculado automaticamente (marcado como sugerido)

#### 2. Verificação de Duplicatas no Preview
Antes de importar, verificar se já existem compras similares na fatura. A lógica:

```text
Buscar compras existentes onde:
- cartao_id = cartão selecionado
- descricao SIMILAR à descrição importada (normalizada, sem acentos)
- valor_total SIMILAR ao calculado (margem de R$ 0,10 para arredondamentos)
- parcela_inicial = parcela inicial importada
- mes_inicio = mês da fatura selecionado
```

Se encontrar duplicata:
- Marcar a linha com status "⚠️ Possível duplicata"
- Mostrar mensagem: "Já existe compra similar nesta fatura"
- Permitir que o usuário force a importação via checkbox

#### 3. Fluxo Visual

```text
┌────────────────────────────────────────────────────────────┐
│ Prévia da importação                                       │
│ Total a importar: R$ 1.575,16                              │
│ ⚠️ 2 possíveis duplicatas encontradas                      │
├────────────────────────────────────────────────────────────┤
│ # │ Status │ Descrição           │ Fatura  │ Duplicata    │
├───┼────────┼─────────────────────┼─────────┼──────────────┤
│ 1 │   ⚠️   │ LUCAS DE BRITO...   │[Fev/26▾]│ ☐ Importar   │
│ 2 │   ✓    │ Nortmotos - 4/8     │[Fev/26▾]│              │
│ 3 │   ✓    │ IOF compra inter... │[Fev/26▾]│              │
└────────────────────────────────────────────────────────────┘
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/services/importar-compras-cartao.ts` | Adicionar função `verificarDuplicatas()` |
| `src/pages/cartoes/ImportarCompras.tsx` | Adicionar seletor de mês e exibição de duplicatas |

### Detalhes da Implementação

#### Interface `PreviewCompra` - Novos Campos
```typescript
export interface PreviewCompra {
  // ... campos existentes ...
  
  // Novos campos para duplicata
  possivelDuplicata: boolean;
  duplicataInfo?: {
    compraId: string;
    descricao: string;
  };
  forcarImportacao: boolean;  // Checkbox para ignorar duplicata
}
```

#### Função `verificarDuplicatas()`
```typescript
export async function verificarDuplicatas(
  cartaoId: string,
  compras: PreviewCompra[]
): Promise<PreviewCompra[]> {
  // Buscar todas as compras ativas do cartão
  const { data: existentes } = await supabase
    .from("compras_cartao")
    .select("id, descricao, valor_total, parcela_inicial, mes_inicio")
    .eq("cartao_id", cartaoId)
    .eq("ativo", true);

  // Para cada compra do preview, verificar se existe similar
  return compras.map(compra => {
    const similar = existentes?.find(e => {
      const descNorm = normalizar(e.descricao);
      const compraDescNorm = normalizar(compra.descricao);
      const valorSimilar = Math.abs(e.valor_total - compra.valorTotal) < 0.10;
      const mesmoMes = e.mes_inicio === compra.mesFatura + "-01";
      const mesmaParcela = e.parcela_inicial === compra.parcelaInicial;
      
      return descNorm === compraDescNorm && valorSimilar && mesmoMes && mesmaParcela;
    });

    return {
      ...compra,
      possivelDuplicata: !!similar,
      duplicataInfo: similar ? { compraId: similar.id, descricao: similar.descricao } : undefined,
      forcarImportacao: false,
    };
  });
}
```

#### Seletor de Mês da Fatura (Componente)
```tsx
<Select
  value={p.mesFatura}
  onValueChange={(value) => handleAtualizarMesFatura(p.linha, value)}
>
  <SelectTrigger className="h-8 w-[100px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {gerarOpcoesAnoMes(p.mesFatura).map((opcao) => (
      <SelectItem key={opcao.valor} value={opcao.valor}>
        {opcao.label}
        {opcao.sugerido && " ✓"}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Fluxo de Importação Atualizado

```text
1. Usuário cola texto
2. Clica "Processar dados"
3. Sistema faz parsing → preview inicial
4. Sistema verifica duplicatas → marca linhas suspeitas
5. Usuário pode:
   - Alterar mês da fatura de qualquer linha
   - Marcar "Importar mesmo assim" para duplicatas
6. Clica "Importar"
7. Sistema importa apenas:
   - Linhas válidas E
   - (Não duplicata OU forcarImportacao = true)
```

---

### Seção Técnica

#### Normalização de Descrição
```typescript
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Remove acentos
    .replace(/\s+/g, " ")              // Múltiplos espaços → um
    .trim();
}
```

#### Gerar Opções de Ano/Mês
```typescript
function gerarOpcoesAnoMes(mesSugerido: string): { valor: string; label: string; sugerido: boolean }[] {
  const [ano, mes] = mesSugerido.split("-").map(Number);
  const base = new Date(ano, mes - 1, 1);
  const opcoes = [];

  for (let i = -6; i <= 6; i++) {
    const data = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const valor = format(data, "yyyy-MM");
    const label = format(data, "MMM/yy", { locale: ptBR });
    opcoes.push({ valor, label, sugerido: i === 0 });
  }

  return opcoes;
}
```

#### Atualização do Stats
```typescript
const stats = useMemo(() => {
  const validas = previewData.filter((p) => p.valido);
  const invalidas = previewData.filter((p) => !p.valido);
  const duplicatas = previewData.filter((p) => p.possivelDuplicata && !p.forcarImportacao);
  const aImportar = validas.filter((p) => !p.possivelDuplicata || p.forcarImportacao);
  
  return { 
    validas: validas.length, 
    invalidas: invalidas.length, 
    duplicatas: duplicatas.length,
    aImportar: aImportar.length,
    totalCompras: aImportar.reduce((sum, p) => sum + p.valorTotal, 0),
  };
}, [previewData]);
```

### Resumo das Mudanças

1. **Interface PreviewCompra**: +3 campos (possivelDuplicata, duplicataInfo, forcarImportacao)
2. **Função verificarDuplicatas()**: Nova função que consulta o banco
3. **Tabela de Preview**: 
   - Coluna "Fatura" vira seletor editável
   - Nova coluna/indicador de duplicata com checkbox
4. **Fluxo handleProcessar**: Após parsing, chamar verificarDuplicatas()
5. **Fluxo handleImportar**: Filtrar duplicatas não forçadas
