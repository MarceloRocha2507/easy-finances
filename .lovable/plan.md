
# Plano: Adicionar Hora da Última Alteração na Tabela de Despesas

## Objetivo

Exibir a hora da última alteração de cada compra/parcela diretamente na tabela de Despesas do Cartão, conforme solicitado.

## Análise Técnica

### Situação Atual
- A tabela `parcelas_cartao` possui apenas `created_at` (data de criação)
- Não existe um campo `updated_at` para rastrear alterações
- As alterações são registradas na tabela `auditoria_cartao` separadamente

### Abordagens Possíveis

| Abordagem | Prós | Contras |
|-----------|------|---------|
| **A: Adicionar `updated_at`** | Simples, eficiente, uma única query | Requer migração do banco |
| **B: Buscar da auditoria** | Usa dados existentes | Query adicional, mais lenta |

**Recomendação**: Opção A (adicionar `updated_at`) é mais robusta e performática.

---

## Solução Proposta

### 1. Migração do Banco de Dados

Adicionar coluna `updated_at` nas tabelas `parcelas_cartao` e `compras_cartao`, com trigger para atualização automática:

```sql
-- Adicionar coluna updated_at
ALTER TABLE public.parcelas_cartao 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.compras_cartao 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Criar função de trigger para atualizar automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers
CREATE TRIGGER update_parcelas_cartao_updated_at
  BEFORE UPDATE ON public.parcelas_cartao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compras_cartao_updated_at
  BEFORE UPDATE ON public.compras_cartao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inicializar com created_at para registros existentes
UPDATE public.parcelas_cartao SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.compras_cartao SET updated_at = created_at WHERE updated_at IS NULL;
```

### 2. Atualizar o Tipo `ParcelaFatura`

Arquivo: `src/services/compras-cartao.ts`

```typescript
export type ParcelaFatura = {
  // ... campos existentes ...
  updated_at?: string;  // NOVO: hora da última alteração
};
```

### 3. Atualizar a Query `listarParcelasDaFatura`

Adicionar o campo `updated_at` na query e no mapeamento:

```typescript
.select(`
  id,
  compra_id,
  numero_parcela,
  valor,
  mes_referencia,
  paga,
  created_at,
  updated_at,  // NOVO
  compra:compras_cartao(...)
`)

// No mapeamento:
return {
  // ... campos existentes ...
  updated_at: p.updated_at || p.created_at,
};
```

### 4. Exibir na Tabela de Despesas

Arquivo: `src/pages/DespesasCartao.tsx`

Adicionar um indicador sutil mostrando a hora da última alteração. Duas opções de UI:

**Opção A**: Tooltip no ícone de edição
```text
[Ícone Editar] → Tooltip: "Última alteração: 14:32"
```

**Opção B**: Coluna adicional (mais visível)
```text
| Descrição | Data | Categoria | ... | Alterado |
|-----------|------|-----------|-----|----------|
| Nortmotos | 05/01/2026 | - | ... | 14:32 |
```

**Opção C**: Badge/Texto abaixo da descrição (mais discreto, recomendado)
```text
Nortmotos - Parcela 3/4
↳ Alterado às 14:32
```

---

## Arquivos a Modificar

1. **Migração SQL** (nova)
   - Adicionar colunas `updated_at`
   - Criar triggers de atualização automática

2. `src/services/compras-cartao.ts`
   - Adicionar `updated_at` ao tipo `ParcelaFatura`
   - Incluir na query e mapeamento

3. `src/pages/DespesasCartao.tsx`
   - Exibir hora da última alteração na UI
   - Formatação: "HH:mm" ou tempo relativo ("há 5 min")

---

## Resultado Esperado

| Item | Exibição |
|------|----------|
| Parcela recém-criada | Hora de criação |
| Parcela editada | Hora da última edição |
| Formato | "14:32" ou "há 5 min" |

## Tempo Estimado

5-8 minutos para implementar.
