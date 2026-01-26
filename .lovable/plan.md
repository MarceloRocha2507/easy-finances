
# Plano: Restaurar Compras Deletadas e Corrigir Situação

## Diagnóstico

Às **10:58:23** de hoje houve uma deleção em massa de 42 compras do cartão Nubank, seguida de uma reimportação às **10:58:57**. O problema é que:

| Original (Deletado) | Reimportado |
|---------------------|-------------|
| 42 compras em janeiro (2026-01-01) | 41 compras em fevereiro (2026-02-01) |
| Valor total: R$ 4.002,83 | + 1 compra em março |

A reimportação atribuiu as compras ao mês errado (fevereiro ao invés de janeiro).

## Solução: Duas Opções

### Opção A: Restaurar do Backup (Auditoria)

Criar uma funcionalidade para restaurar as compras deletadas a partir da tabela `auditoria_cartao`:

1. **Criar função de restauração em massa**
   - Arquivo: `src/services/compras-cartao.ts`
   - Nova função: `restaurarComprasDeletadas(cartaoId, dataDelecao)`

2. **Lógica:**
   ```typescript
   async function restaurarComprasDeletadas(cartaoId: string, dataDelecao: string) {
     // 1. Buscar registros de auditoria com deleções naquele momento
     const { data: auditoriaCompras } = await supabase
       .from("auditoria_cartao")
       .select("dados_anteriores")
       .eq("acao", "DELETE")
       .eq("tabela", "compras_cartao")
       .filter("dados_anteriores->cartao_id", "eq", cartaoId)
       .gte("created_at", dataDelecao);
     
     // 2. Deletar as compras reimportadas incorretamente
     await supabase
       .from("compras_cartao")
       .delete()
       .eq("cartao_id", cartaoId)
       .gte("created_at", dataDelecao);
     
     // 3. Re-inserir as compras originais
     for (const registro of auditoriaCompras) {
       await supabase.from("compras_cartao").insert(registro.dados_anteriores);
     }
     
     // 4. Regenerar parcelas
   }
   ```

### Opção B: Reimportar Corretamente (Mais Simples)

Se você ainda tem o arquivo CSV ou os dados originais:

1. **Excluir as compras atuais do cartão** (fevereiro/março)
2. **Reimportar usando o mês correto** (automático ou janeiro fixo)

---

## Implementação Recomendada: Restauração via Auditoria

### Arquivos a criar/modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/services/compras-cartao.ts` | Adicionar `restaurarComprasDeletadas()` |
| `src/components/cartoes/RestaurarComprasDialog.tsx` | **Novo** - Dialog de confirmação |
| `src/pages/cartoes/Despesas.tsx` | Adicionar botão "Restaurar Backup" |

### Novo componente: RestaurarComprasDialog

```text
┌─────────────────────────────────────────────────────┐
│  🔄 Restaurar Compras do Backup                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Foram encontradas 42 compras deletadas:            │
│                                                     │
│  • Deletadas em: 26/01/2026 às 10:58               │
│  • Período: Janeiro/2026                            │
│  • Valor total: R$ 4.002,83                        │
│                                                     │
│  ⚠️ Esta ação irá:                                 │
│  1. Remover as 42 compras atuais (fev/mar)         │
│  2. Restaurar as 42 compras originais (jan)         │
│  3. Regenerar todas as parcelas                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│                        [Cancelar]  [Restaurar]      │
└─────────────────────────────────────────────────────┘
```

### Função de restauração

```typescript
// src/services/compras-cartao.ts

export async function restaurarComprasDeletadas(
  cartaoId: string,
  timestampDelecao: string
): Promise<{ restauradas: number; parcelas: number }> {
  // 1. Buscar compras deletadas da auditoria
  const { data: auditoriaCompras, error: erroBusca } = await supabase
    .from("auditoria_cartao")
    .select("dados_anteriores, registro_id")
    .eq("acao", "DELETE")
    .eq("tabela", "compras_cartao")
    .gte("created_at", timestampDelecao)
    .lte("created_at", new Date(new Date(timestampDelecao).getTime() + 60000).toISOString());

  if (erroBusca) throw erroBusca;
  if (!auditoriaCompras?.length) throw new Error("Nenhuma compra encontrada para restaurar");

  // Filtrar apenas do cartão específico
  const comprasDoCartao = auditoriaCompras.filter(
    a => (a.dados_anteriores as any)?.cartao_id === cartaoId
  );

  // 2. Deletar compras reimportadas (criadas após a deleção)
  const { error: erroDelete } = await supabase
    .from("compras_cartao")
    .delete()
    .eq("cartao_id", cartaoId)
    .gte("created_at", timestampDelecao);

  if (erroDelete) throw erroDelete;

  // 3. Restaurar compras originais
  let restauradas = 0;
  for (const registro of comprasDoCartao) {
    const dados = registro.dados_anteriores as Record<string, unknown>;
    
    // Inserir a compra original
    const { error: erroInsert } = await supabase
      .from("compras_cartao")
      .insert(dados);
    
    if (!erroInsert) restauradas++;
  }

  // 4. Regenerar parcelas (o sistema já tem essa funcionalidade)
  // As parcelas serão regeneradas automaticamente pelo hook existente

  return { 
    restauradas, 
    parcelas: 0 // Será regenerado automaticamente
  };
}
```

### Etapas de implementação

1. **Adicionar função `restaurarComprasDeletadas` em `compras-cartao.ts`**
2. **Criar `RestaurarComprasDialog.tsx`** com interface clara
3. **Adicionar botão na página de Despesas** quando detectar situação de backup disponível
4. **Testar restauração** garantindo integridade dos dados

---

## Solução Imediata (Sem Código)

Se você precisar resolver **agora**, posso executar um SQL para restaurar os dados diretamente:

```sql
-- 1. Deletar compras reimportadas incorretamente
DELETE FROM compras_cartao 
WHERE cartao_id = '8607c9f1-ccdc-42df-ad2a-d2669c7b347c'
  AND created_at >= '2026-01-26 10:58:00';

-- 2. Restaurar compras originais da auditoria
INSERT INTO compras_cartao 
SELECT (dados_anteriores)::jsonb 
FROM auditoria_cartao 
WHERE acao = 'DELETE' 
  AND tabela = 'compras_cartao'
  AND dados_anteriores->>'cartao_id' = '8607c9f1-ccdc-42df-ad2a-d2669c7b347c'
  AND created_at >= '2026-01-26 10:58:00';
```

---

## Benefícios da Implementação

| Aspecto | Benefício |
|---------|-----------|
| **Segurança** | Usuário pode recuperar dados deletados acidentalmente |
| **Auditoria** | Usa infraestrutura já existente |
| **UX** | Interface clara mostrando o que será restaurado |
| **Prevenção** | Funcionalidade de backup integrada ao sistema |
