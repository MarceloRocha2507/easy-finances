
## Plano: Módulo Completo de Gestão de Bancos

### Visão Geral

Este plano implementa um módulo completo de bancos que permitirá:
- Cadastrar e gerenciar bancos/instituições financeiras
- Vincular cartões de crédito a bancos específicos
- Visualizar saldo consolidado por banco no Dashboard

---

## 1. Estrutura do Banco de Dados

### Nova Tabela: `bancos`

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|--------|------|-------------|--------|-----------|
| id | uuid | Sim | gen_random_uuid() | Identificador único |
| user_id | uuid | Sim | - | Referência ao usuário |
| nome | text | Sim | - | Nome do banco |
| codigo | text | Não | NULL | Código/número do banco (ex: 001, 260) |
| cor | text | Sim | '#6366f1' | Cor para identificação visual |
| logo_url | text | Não | NULL | URL do logo (upload ou URL externa) |
| ativo | boolean | Sim | true | Status ativo/inativo |
| created_at | timestamptz | Sim | now() | Data de criação |
| updated_at | timestamptz | Sim | now() | Data de atualização |

### Alteração na Tabela: `cartoes`

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|--------|------|-------------|--------|-----------|
| banco_id | uuid | Não | NULL | Referência ao banco (FK → bancos.id) |

### Políticas RLS (Row Level Security)

```sql
-- Tabela bancos
CREATE POLICY "Users can view their own banks"
  ON bancos FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banks"
  ON bancos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banks"
  ON bancos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banks"
  ON bancos FOR DELETE USING (auth.uid() = user_id);
```

---

## 2. Arquivos a Serem Criados

### Services e Hooks

```text
src/services/bancos.ts          # Funções CRUD e hooks React Query
```

### Componentes

```text
src/components/bancos/
├── NovoBancoDialog.tsx         # Dialog para criar banco
├── EditarBancoDialog.tsx       # Dialog para editar banco
├── ExcluirBancoDialog.tsx      # Confirmação de exclusão
├── BancoCard.tsx               # Card visual do banco
└── BancoSelector.tsx           # Seletor de banco (para cartões)
```

### Páginas

```text
src/pages/Bancos.tsx            # Página principal de listagem
```

### Dashboard (Novo Componente)

```text
src/components/dashboard/SaldoPorBanco.tsx  # Visualização consolidada
```

---

## 3. Implementação Detalhada

### 3.1 Service: `src/services/bancos.ts`

**Tipos:**
```typescript
export type Banco = {
  id: string;
  user_id: string;
  nome: string;
  codigo: string | null;
  cor: string;
  logo_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type BancoComResumo = Banco & {
  quantidadeCartoes: number;
  saldoTotal: number;        // Soma dos saldos de todos os cartões
  limiteTotal: number;       // Soma dos limites
  faturaTotal: number;       // Soma das faturas pendentes
};
```

**Funções:**
- `listarBancos()` - Lista bancos ativos do usuário
- `listarTodosBancos()` - Lista todos (incluindo inativos)
- `listarBancosComResumo()` - Lista com estatísticas de cartões
- `criarBanco(dados)` - Cria novo banco
- `atualizarBanco(id, dados)` - Atualiza banco
- `excluirBanco(id)` - Exclui/desativa banco

**Hooks React Query:**
- `useBancos()` - Lista bancos
- `useBancosComResumo()` - Lista com resumo
- `useCriarBanco()` - Mutation para criar
- `useAtualizarBanco()` - Mutation para atualizar
- `useExcluirBanco()` - Mutation para excluir

### 3.2 Página: `src/pages/Bancos.tsx`

**Layout:**
- Header com título "Bancos" e botão "Novo Banco"
- Grid de cards mostrando cada banco
- Para cada banco:
  - Nome e logo/cor
  - Saldo total (soma dos cartões)
  - Quantidade de cartões vinculados
  - Limite total disponível
- Seção de bancos inativos (colapsável)
- Botões de ação: Editar, Desativar/Reativar

### 3.3 Componentes de Cartão

**`NovoBancoDialog.tsx`:**
```text
Campos do formulário:
├── Nome do banco (obrigatório)
├── Código do banco (opcional)
├── Seletor de cor (paleta predefinida)
├── Upload de logo (opcional)
│   └── Integração com Supabase Storage (bucket: bank-logos)
└── Preview visual do banco
```

**`EditarBancoDialog.tsx`:**
- Similar ao NovoBancoDialog
- Carrega dados existentes
- Permite alterar status ativo/inativo

**`BancoSelector.tsx`:**
```text
Componente Select para usar em:
├── NovoCartaoDialog.tsx
└── EditarCartaoDialog.tsx

Features:
├── Lista bancos disponíveis
├── Mostra cor/logo ao lado do nome
├── Opção "Nenhum banco" (NULL)
└── Botão para criar novo banco inline
```

### 3.4 Alterações em Cartões

**`NovoCartaoDialog.tsx`:**
- Adicionar campo `BancoSelector` após seleção do cartão
- Armazenar `banco_id` no formulário

**`EditarCartaoDialog.tsx`:**
- Adicionar campo `BancoSelector`
- Permitir alterar o banco vinculado

**`CartaoCard.tsx` (na página Cartões):**
- Exibir badge/indicador do banco (cor ou nome)

### 3.5 Dashboard: Saldo Consolidado

**`SaldoPorBanco.tsx`:**
```text
Card no Dashboard mostrando:
├── Título: "Saldo por Banco"
├── Lista de bancos (agrupados)
│   ├── Banco 1
│   │   ├── Ícone/cor
│   │   ├── Nome
│   │   ├── Saldo total: R$ X.XXX
│   │   └── Cartões: N cartões
│   └── Banco 2
│       └── ...
├── Separador
├── Total Geral
│   ├── Limite total: R$ X.XXX
│   └── Disponível: R$ X.XXX
└── Link "Ver todos os bancos"
```

---

## 4. Navegação

### Atualização do Menu Lateral (`Layout.tsx`)

Adicionar "Bancos" no menu de cartões:

```typescript
const cartoesMenu = {
  icon: CreditCard,
  label: "Cartões",
  href: "/cartoes",
  subItems: [
    { icon: CreditCard, label: "Visão Geral", href: "/cartoes" },
    { icon: Building2, label: "Bancos", href: "/cartoes/bancos" },  // NOVO
    { icon: Layers, label: "Parcelamentos", href: "/cartoes/parcelamentos" },
    { icon: Users, label: "Responsáveis", href: "/cartoes/responsaveis" },
    // ...
  ],
};
```

### Rotas (`App.tsx`)

```typescript
<Route
  path="/cartoes/bancos"
  element={
    <ProtectedRoute>
      <Suspense fallback={<LoadingScreen />}>
        <BancosPage />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

---

## 5. Upload de Logo (Opcional)

### Storage Bucket

```sql
-- Criar bucket para logos de bancos (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bank-logos', 'bank-logos', true);

-- Política para usuários fazerem upload
CREATE POLICY "Users can upload bank logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bank-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Componente de Upload

Reutilizar padrão do `AvatarUpload.tsx` adaptado para logos de banco.

---

## 6. Ordem de Implementação

```text
Fase 1: Infraestrutura
├── 1.1 Migração SQL (tabela bancos + alteração cartoes)
├── 1.2 Service bancos.ts
└── 1.3 Tipos TypeScript

Fase 2: CRUD de Bancos
├── 2.1 Página Bancos.tsx
├── 2.2 NovoBancoDialog.tsx
├── 2.3 EditarBancoDialog.tsx
├── 2.4 ExcluirBancoDialog.tsx
└── 2.5 BancoCard.tsx

Fase 3: Vinculação com Cartões
├── 3.1 BancoSelector.tsx
├── 3.2 Atualizar NovoCartaoDialog.tsx
├── 3.3 Atualizar EditarCartaoDialog.tsx
└── 3.4 Atualizar CartaoCard.tsx (exibir banco)

Fase 4: Dashboard
├── 4.1 SaldoPorBanco.tsx
├── 4.2 Hook useBancosComResumo()
└── 4.3 Integrar no Dashboard.tsx

Fase 5: Navegação e Ajustes
├── 5.1 Atualizar Layout.tsx (menu)
├── 5.2 Atualizar App.tsx (rotas)
└── 5.3 Testes e refinamentos
```

---

## 7. Bancos Predefinidos (Sugestão)

Lista de bancos brasileiros populares para seleção rápida:

| Nome | Código | Cor |
|------|--------|-----|
| Nubank | 260 | #820AD1 |
| Inter | 077 | #FF7A00 |
| Itaú | 341 | #003399 |
| Bradesco | 237 | #CC092F |
| Banco do Brasil | 001 | #FFCD00 |
| Santander | 033 | #CC0000 |
| Caixa | 104 | #0070C0 |
| C6 Bank | 336 | #242424 |
| BTG | 208 | #1A1A2E |
| XP | 102 | #000000 |

---

## 8. Detalhes Técnicos

### SQL de Migração

```sql
-- Criar tabela bancos
CREATE TABLE public.bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  logo_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_bancos_user_id ON public.bancos(user_id);

-- RLS
ALTER TABLE public.bancos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own banks"
  ON public.bancos FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banks"
  ON public.bancos FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banks"
  ON public.bancos FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banks"
  ON public.bancos FOR DELETE USING (auth.uid() = user_id);

-- Adicionar coluna banco_id em cartoes
ALTER TABLE public.cartoes ADD COLUMN banco_id UUID REFERENCES public.bancos(id) ON DELETE SET NULL;

-- Índice para performance
CREATE INDEX idx_cartoes_banco_id ON public.cartoes(banco_id);

-- Trigger para updated_at
CREATE TRIGGER set_bancos_updated_at
  BEFORE UPDATE ON public.bancos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### Cálculo de Saldo por Banco

```typescript
// No hook useBancosComResumo
async function listarBancosComResumo(): Promise<BancoComResumo[]> {
  // 1. Buscar bancos
  const { data: bancos } = await supabase
    .from('bancos')
    .select('*')
    .eq('ativo', true);

  // 2. Buscar cartões com seus resumos
  const { data: cartoes } = await supabase
    .from('cartoes')
    .select('id, nome, limite, banco_id');

  // 3. Buscar parcelas não pagas para calcular faturas
  const { data: parcelas } = await supabase
    .from('parcelas_cartao')
    .select('compra_id, valor, paga')
    .eq('paga', false);

  // 4. Mapear compras para cartões
  const { data: compras } = await supabase
    .from('compras_cartao')
    .select('id, cartao_id');

  // 5. Calcular totais por banco
  // ... lógica de agregação
}
```

---

## 9. Resultado Esperado

### Página de Bancos

```text
┌─────────────────────────────────────────────────────────┐
│  Bancos                                    [+ Novo Banco]│
│  Gerencie suas instituições financeiras                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ 🟣 Nubank   │  │ 🟠 Inter    │  │ 🔵 Itaú     │      │
│  │ 3 cartões   │  │ 2 cartões   │  │ 1 cartão    │      │
│  │ R$ 5.000    │  │ R$ 3.200    │  │ R$ 8.000    │      │
│  │ [Editar]    │  │ [Editar]    │  │ [Editar]    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│  Resumo Geral                                            │
│  6 cartões | Limite: R$ 16.200 | Disponível: R$ 12.500  │
└─────────────────────────────────────────────────────────┘
```

### Card de Cartão (com banco)

```text
┌─────────────────────────────────────┐
│ 🔵 Nubank Ultravioleta              │
│ Mastercard             [Badge: Nubank]│
│ ─────────────────────────────────── │
│ Limite: R$ 5.000   Usado: 40%       │
│ Fatura: R$ 1.200   Venc: 15/02      │
└─────────────────────────────────────┘
```

### Dashboard - Saldo por Banco

```text
┌─────────────────────────────────────┐
│ 🏦 Saldo por Banco                  │
├─────────────────────────────────────┤
│ 🟣 Nubank        R$ 3.800 (3 cards) │
│ 🟠 Inter         R$ 2.500 (2 cards) │
│ 🔵 Itaú          R$ 6.200 (1 card)  │
├─────────────────────────────────────┤
│ Total Disponível      R$ 12.500     │
│ [Ver todos os bancos →]             │
└─────────────────────────────────────┘
```
