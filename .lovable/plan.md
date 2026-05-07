# Cards de Total por Responsável na aba Cartões

## Objetivo
Adicionar uma seção de cards na página `/cartoes` mostrando o total de despesas (parcelas) por responsável no mês selecionado, usando o filtro de mês já existente na página.

## O que será feito

### 1. Novo componente: `src/components/cartoes/ResumoResponsaveisMes.tsx`
- Recebe `mesReferencia: Date` como prop.
- Busca via Supabase todas as `parcelas_cartao` (ativas) com `mes_referencia` dentro do mês selecionado, fazendo join com `compras_cartao` (para obter `responsavel_id`, `user_id`) e `responsaveis` (para nome/apelido/is_titular).
- Agrupa o total absoluto (`Math.abs(valor)`) por responsável. Compras sem `responsavel_id` são consideradas do titular (igual à lógica já existente em `ResumoPorResponsavel`).
- Renderiza um grid responsivo (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) de cards minimalistas — seguindo o estilo fintech premium do projeto (rounded-xl, border, shadow leve, ícone Crown para titular / User para demais), exibindo:
  - Nome (apelido se existir) + badge "Eu" para titular
  - Valor total em `formatCurrency`
  - Quantidade de lançamentos
  - Percentual sobre o total geral
- Estado de loading com Skeletons; estado vazio escondendo a seção.

### 2. Integração em `src/pages/Cartoes.tsx`
- Importar e renderizar `<ResumoResponsaveisMes mesReferencia={mesReferencia} />` logo após a navegação de mês (linha ~265) e antes da lista de cartões.
- O componente reage automaticamente ao mês selecionado pelos botões de navegação já existentes (`irMesAnterior` / `irProximoMes`).

### 3. Hook de dados
- Criar `useTotaisPorResponsavelMes(mesReferencia)` dentro do próprio componente (ou em `src/services/cartoes.ts` se preferível — usar `useQuery` com queryKey `["totais-responsavel-mes", userId, "yyyy-MM"]`, staleTime 2min).
- Filtrar por `user_id` do usuário autenticado e `ativo = true` nas parcelas.

## Detalhes técnicos

```text
Layout final da página:
  Header
  Previsão de Faturas (existente)
  Navegação de Mês (existente)
  → [NOVO] Resumo por Responsável (mês atual)  ← cards
  Lista de Cartões (existente)
```

Query principal (pseudo-SQL via supabase-js):
```
parcelas_cartao
  .select("valor, compra:compras_cartao!inner(user_id, responsavel_id, responsavel:responsaveis(nome, apelido, is_titular))")
  .eq("ativo", true)
  .gte("mes_referencia", "YYYY-MM-01")
  .lt("mes_referencia", "YYYY-(MM+1)-01")
  .filter user_id == auth.uid()
```

## Resultado
Usuário vê, para cada mês navegado, quanto cada pessoa (titular e demais responsáveis) consumiu somando todos os cartões — totalizando a visão de despesas por responsável já no topo da página.