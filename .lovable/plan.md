

## Plano: Importação em Lote de Compras de Cartão

### Visão Geral
Desenvolver uma funcionalidade completa de importação em lote que permita cadastrar múltiplas compras de cartão de crédito de uma só vez, a partir de texto ou arquivo CSV. O sistema irá:
- Aceitar formato CSV ou texto colado diretamente
- Detectar automaticamente o responsável ("eu", "mae", etc.)
- Identificar parcelas no formato "Parcela X/Y" 
- Calcular automaticamente o mês da fatura correto baseado na data e dia de fechamento
- Permitir selecionar o cartão de destino

### Formato de Entrada Esperado
```
Data,Descrição,Valor Responsável
2026-01-22,IOF de compra internacional,0.16 eu
2026-01-20,Comercial Peixoto - Parcela 1/2,41.21 mae
2026-01-05,54.824.042 LUCAS DE BRITO MARQUES - 2/3,102,25 eu
```

O sistema detectará:
- **Data**: Formato `YYYY-MM-DD` ou `DD/MM/YYYY`
- **Responsável**: Última palavra da linha (eu, mae, etc.)
- **Valor**: Número antes do responsável (suporta vírgula como decimal)
- **Parcela**: Padrão `X/Y` ou "Parcela X/Y" na descrição

---

### Arquivos a Criar/Modificar

#### 1. Nova Página: `src/pages/cartoes/ImportarCompras.tsx`
Página completa de importação com as seguintes funcionalidades:

```typescript
// Estados principais
- cartaoId: string               // Cartão selecionado
- textoInput: string             // Texto colado pelo usuário
- previewData: PreviewCompra[]   // Dados parseados para preview
- status: "idle" | "preview" | "importing" | "success"
```

**Interface de Preview:**
```typescript
interface PreviewCompra {
  linha: number;
  data: string;           // Data original
  dataCompra: Date;       // Data parseada
  descricao: string;
  valor: number;
  responsavelId: string;  // ID do responsável
  responsavelNome: string;// Nome para exibição
  mesFatura: string;      // Calculado automaticamente
  tipoLancamento: "unica" | "parcelada";
  parcelas: number;
  parcelaInicial: number;
  valido: boolean;
  erro?: string;
}
```

**Funcionalidades:**
1. Seleção de cartão (obrigatório)
2. Área de texto para colar dados ou upload de arquivo
3. Botão para processar/parsear
4. Tabela de preview com validação visual
5. Edição inline de campos incorretos
6. Importação em lote

#### 2. Serviço: `src/services/importar-compras-cartao.ts`
Funções para parsing e importação:

```typescript
// Função de parsing inteligente
export function parseLinhasCompra(
  texto: string,
  responsaveis: Responsavel[],
  diaFechamento: number
): PreviewCompra[]

// Detectar parcela na descrição
function detectarParcela(descricao: string): {
  tipoLancamento: "unica" | "parcelada";
  parcelaAtual: number;
  totalParcelas: number;
  descricaoLimpa: string;
}

// Mapear apelido para responsável
function mapearResponsavel(
  apelido: string,
  responsaveis: Responsavel[]
): { id: string; nome: string } | null

// Importar em lote
export async function importarComprasEmLote(
  cartaoId: string,
  compras: PreviewCompra[]
): Promise<{ sucesso: number; erros: number }>
```

**Lógica de Parsing:**
```
Linha: "2026-01-20,Comercial Peixoto - Parcela 1/2,41.21 mae"

1. Separar por vírgula: ["2026-01-20", "Comercial Peixoto - Parcela 1/2", "41.21 mae"]
2. Último item: "41.21 mae" → valor=41.21, responsável="mae"
3. Descrição: "Comercial Peixoto - Parcela 1/2"
   - Detecta "Parcela 1/2" → parcelada, parcela 1 de 2
   - Descrição limpa: "Comercial Peixoto"
4. Data: "2026-01-20" → new Date(2026, 0, 20)
5. Mês fatura: calcularMesFatura(dataCompra, diaFechamento)
```

#### 3. Atualizar Rota: `src/App.tsx`
Adicionar rota para a página de importação:

```tsx
const ImportarComprasPage = lazy(() => import("./pages/cartoes/ImportarCompras"));

<Route
  path="/cartoes/:id/importar"
  element={
    <ProtectedRoute>
      <Suspense fallback={<LoadingScreen />}>
        <ImportarComprasPage />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

#### 4. Atualizar DetalhesCartaoDialog
Adicionar botão "Importar" no menu de ações do cartão:

```tsx
<DropdownMenuItem onClick={() => {
  onOpenChange(false);
  navigate(`/cartoes/${cartao.id}/importar`);
}}>
  <Upload className="h-4 w-4 mr-2" />
  Importar compras
</DropdownMenuItem>
```

---

### Interface do Usuário

```
┌─────────────────────────────────────────────────────────────┐
│  ← Voltar    Importar Compras do Cartão                     │
│              Nubank                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Cole os dados das compras abaixo:                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 2026-01-22,IOF de compra internacional,0.16 eu      │    │
│  │ 2026-01-20,Comercial Peixoto - Parcela 1/2,41.21 mae│    │
│  │ ...                                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Processar Dados]  [Limpar]   ou  [📁 Carregar CSV]        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  PRÉVIA DA IMPORTAÇÃO                                       │
│  ✅ 38 válidas  ⚠️ 2 inválidas                              │
├─────────────────────────────────────────────────────────────┤
│  Data       │ Descrição           │ Valor   │ Resp │ Fatura │
│  ──────────────────────────────────────────────────────────│
│  22/01/2026 │ IOF de compra int...│ R$ 0,16 │ Eu   │ Jan/26 │
│  20/01/2026 │ Comercial Peixoto   │ R$41,21 │ Mãe  │ Jan/26 │
│             │  └ Parcela 1/2      │         │      │        │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│                                   [Cancelar] [Importar 38]  │
└─────────────────────────────────────────────────────────────┘
```

---

### Mapeamento de Responsáveis
O sistema tentará mapear automaticamente os apelidos para responsáveis cadastrados:

| Apelido no CSV | Busca por | Match |
|----------------|-----------|-------|
| `eu` | apelido="Eu" OU is_titular=true | Responsável titular |
| `mae` | apelido ILIKE "mae" ou "mãe" | Responsável "Mãe" |
| `pai` | apelido ILIKE "pai" | Responsável "Pai" |

Se não encontrar match, a linha será marcada como inválida e o usuário poderá corrigir manualmente.

---

### Detecção de Parcelas
Padrões reconhecidos na descrição:

| Padrão | Exemplo | Resultado |
|--------|---------|-----------|
| `Parcela X/Y` | "Comercial - Parcela 1/2" | parcelada, 1 de 2 |
| ` - X/Y` | "Lucas - 2/3" | parcelada, 2 de 3 |
| `(X/Y)` | "Aliexpress (5/12)" | parcelada, 5 de 12 |

---

### Fluxo de Importação

```
1. Usuário seleciona cartão
2. Usuário cola texto ou carrega CSV
3. Sistema parseia cada linha:
   a. Extrai data, descrição, valor, responsável
   b. Detecta parcelas na descrição
   c. Calcula mês da fatura baseado na data e dia_fechamento
   d. Valida todos os campos
4. Exibe prévia com status de validação
5. Usuário pode corrigir erros inline
6. Ao confirmar, sistema cria compras usando criarCompraCartao()
7. Exibe resumo de sucesso
```

---

### Tratamento de Valores
O sistema suporta diferentes formatos de valor:

| Entrada | Interpretação |
|---------|---------------|
| `0.16` | 0.16 |
| `0,16` | 0.16 |
| `41.21` | 41.21 |
| `102,25` | 102.25 |
| `1.234,56` | 1234.56 |

---

### Estrutura de Arquivos

```
src/
├── pages/
│   └── cartoes/
│       └── ImportarCompras.tsx     # Nova página (criar)
├── services/
│   └── importar-compras-cartao.ts  # Novo serviço (criar)
└── App.tsx                         # Adicionar rota
```

