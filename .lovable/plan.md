
# Regras de Categorização Automática

## Visao Geral

Sistema inteligente que categoriza transacoes automaticamente com base em palavras-chave definidas pelo usuario. Quando uma nova transacao e criada (ou importada), o sistema verifica se a descricao corresponde a alguma regra e aplica a categoria automaticamente.

## Funcionamento

```text
Usuario cria transacao
        |
        v
+-------------------+
| Buscar regras do  |
| usuario           |
+-------------------+
        |
        v
+-------------------+
| Descricao contem  |-----> NAO ----> Deixar sem categoria
| palavra-chave?    |                 ou categoria padrao
+-------------------+
        |
       SIM
        |
        v
+-------------------+
| Aplicar categoria |
| da regra          |
+-------------------+
        |
        v
   Transacao salva
   com categoria
```

## Exemplos de Uso

| Palavra-chave | Categoria | Tipo |
|---------------|-----------|------|
| `uber` | Transporte | Despesa |
| `ifood`, `rappi` | Alimentacao | Despesa |
| `netflix`, `spotify` | Lazer | Despesa |
| `salario`, `pagamento` | Salario | Receita |
| `pix recebido` | Outros | Receita |
| `farmacia`, `drogaria` | Saude | Despesa |

## Interface do Usuario

A funcionalidade sera acessada atraves da pagina de Categorias existente, adicionando uma nova aba "Regras":

```text
+--------------------------------------------------+
|  Categorias                                       |
+--------------------------------------------------+
|  [Categorias]  [Regras de Categorizacao]         |
+--------------------------------------------------+

Aba "Regras de Categorizacao":

+--------------------------------------------------+
|  Regras de Categorizacao              [+ Nova]   |
|  Categorize transacoes automaticamente           |
+--------------------------------------------------+
|                                                  |
|  +--------------------------------------------+  |
|  | Alimentacao                                |  |
|  |   Palavras: ifood, rappi, uber eats        |  |
|  |   [Editar] [Excluir]                       |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  | Transporte                                 |  |
|  |   Palavras: uber, 99, cabify               |  |
|  |   [Editar] [Excluir]                       |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

### Dialog de Nova Regra

```text
+------------------------------------------+
|  Nova Regra de Categorizacao         [X] |
+------------------------------------------+
|                                          |
|  Categoria *                             |
|  [Selecione uma categoria        v]     |
|                                          |
|  Palavras-chave *                        |
|  [ifood, rappi, uber eats          ]    |
|  Separe por virgula                      |
|                                          |
|  [] Ignorar maiusculas/minusculas        |
|                                          |
|                [Cancelar] [Salvar]        |
+------------------------------------------+
```

## Estrutura do Banco de Dados

### Nova Tabela: `category_rules`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | Identificador unico |
| user_id | uuid | Referencia ao usuario |
| category_id | uuid | Referencia a categoria |
| keywords | text[] | Array de palavras-chave |
| case_insensitive | boolean | Ignorar maiusculas (padrao: true) |
| is_active | boolean | Regra ativa (padrao: true) |
| priority | integer | Prioridade (menor = maior) |
| created_at | timestamp | Data de criacao |
| updated_at | timestamp | Data de atualizacao |

### Politicas RLS

- SELECT: Usuarios veem apenas suas regras
- INSERT: Usuarios criam regras com seu user_id
- UPDATE: Usuarios atualizam apenas suas regras
- DELETE: Usuarios excluem apenas suas regras

## Alteracoes Tecnicas

### 1. Banco de Dados

Criar migracao SQL para:
- Tabela `category_rules`
- Indice em `user_id`
- Indice em `category_id`
- Politicas RLS

### 2. Novos Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useCategoryRules.ts` | Hook com CRUD para regras |
| `src/services/category-rules.ts` | Funcao de matching de regras |
| `src/components/categories/RulesList.tsx` | Lista de regras |
| `src/components/categories/RuleDialog.tsx` | Dialog criar/editar |

### 3. Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Categories.tsx` | Adicionar sistema de abas (Categorias / Regras) |
| `src/hooks/useTransactions.ts` | Integrar auto-categorizacao no `useCreateTransaction` |

### 4. Hook useCategoryRules

```typescript
// Operacoes:
// - useCategoryRules() - listar regras do usuario
// - useCreateCategoryRule() - criar nova regra
// - useUpdateCategoryRule() - atualizar regra
// - useDeleteCategoryRule() - excluir regra
```

### 5. Funcao de Matching

```typescript
// services/category-rules.ts
export async function findMatchingCategory(
  userId: string, 
  description: string
): Promise<string | null> {
  // 1. Buscar todas as regras ativas do usuario
  // 2. Para cada regra, verificar se alguma keyword esta na descricao
  // 3. Retornar category_id da primeira regra que der match
  // 4. Se nenhuma der match, retornar null
}
```

### 6. Integracao na Criacao de Transacao

O `useCreateTransaction` sera modificado para:
1. Antes de inserir, chamar `findMatchingCategory` se `category_id` nao foi informado
2. Se encontrar match, usar a categoria da regra
3. Caso contrario, deixar sem categoria

## Fluxo de Dados

```text
1. Usuario acessa /categories
2. Clica na aba "Regras"
3. Ve lista de regras existentes
4. Clica em "+ Nova Regra"
5. Seleciona categoria e adiciona palavras-chave
6. Salva a regra

Ao criar transacao:
1. Usuario digita "Pagamento Uber"
2. Sistema busca regras
3. Encontra regra com keyword "uber" -> Transporte
4. Aplica categoria automaticamente
```

## Limites do Plano

A funcionalidade respeitara os limites do plano do usuario:
- Plano gratuito: 5 regras
- Plano premium: ilimitado

Sera adicionado `regras_categorizacao` no hook `usePlanLimits`.

## Resultado Esperado

- Usuario pode criar regras de categorizacao baseadas em palavras-chave
- Novas transacoes sao categorizadas automaticamente
- Economia de tempo ao registrar gastos recorrentes
- Menos transacoes "sem categoria"
- Interface integrada na pagina de Categorias existente
