

## Plano: Adicionar Opção "Desfazer Última Alteração" em Cartões

### Contexto

O sistema já possui um robusto sistema de auditoria (`auditoria_cartao`) que registra automaticamente todas as operações de INSERT, UPDATE e DELETE em `compras_cartao` e `parcelas_cartao`. Os dados anteriores e novos são armazenados em campos JSONB, o que permite restaurar o estado anterior de qualquer registro.

### Abordagem

A funcionalidade "Desfazer" será implementada seguindo o padrão já existente no `AdiantarFaturaDialog`, que exibe um botão "Desfazer" em um toast após a ação. No entanto, para uma funcionalidade mais robusta, vamos adicionar:

1. **Botão permanente** no header da página de Cartões
2. **Dialog de confirmação** mostrando o que será desfeito
3. **Serviço de undo** que usa os dados da auditoria

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────┐
│  Cartoes.tsx (Header)                                   │
│  ┌───────────────────┐                                  │
│  │ Botão "Desfazer"  │ ──────► UltimaAlteracaoDialog   │
│  └───────────────────┘                                  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  useUltimaAlteracao.ts (Hook)                           │
│  - Busca último registro de auditoria do usuário        │
│  - Retorna dados formatados para exibição               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  desfazerUltimaAlteracao() (Serviço)                    │
│  - INSERT → DELETE (remove o registro criado)           │
│  - UPDATE → Restaura dados_anteriores                   │
│  - DELETE → Re-insere os dados_anteriores               │
└─────────────────────────────────────────────────────────┘
```

### Alterações por Arquivo

#### 1. Novo arquivo: `src/hooks/useUltimaAlteracao.ts`

Hook para buscar e gerenciar a última alteração:

| Função | Descrição |
|--------|-----------|
| `useUltimaAlteracao()` | Query que busca o registro mais recente em `auditoria_cartao` |
| Retorno | `{ data, isLoading, refetch }` com o último registro |

#### 2. Novo arquivo: `src/components/cartoes/DesfazerAlteracaoDialog.tsx`

Dialog de confirmação que exibe:
- Tipo da ação (Inserção/Atualização/Exclusão)
- Tabela afetada (Compra/Parcela)
- Data/hora da alteração
- Resumo do que será desfeito
- Botões Cancelar/Confirmar

#### 3. Atualização: `src/services/compras-cartao.ts`

Nova função `desfazerUltimaAlteracao(registro: RegistroAuditoria)`:

| Ação Original | Operação de Undo |
|---------------|------------------|
| INSERT | DELETE do registro criado |
| UPDATE | UPDATE restaurando `dados_anteriores` |
| DELETE | INSERT re-criando o registro |

Considerações especiais:
- Para DELETE de `compras_cartao`: também restaurar as parcelas relacionadas
- Para INSERT de `compras_cartao`: também deletar as parcelas criadas
- Marcar o registro de auditoria como "desfeito" para evitar undo duplo

#### 4. Atualização: `src/pages/Cartoes.tsx`

Adicionar no header:
- Botão "Desfazer" com ícone `Undo2`
- Estado para controlar abertura do dialog
- Integração com o hook `useUltimaAlteracao`

### Interface do Usuário

**Botão no Header:**
```
┌──────────────────────────────────────────────────────────────────┐
│  Cartões                                                          │
│  Gerencie seus cartões e acompanhe as faturas                    │
│                                                                   │
│  [↶ Desfazer]  [🔄 Verificar Parcelas]  [+ Novo Cartão]         │
└──────────────────────────────────────────────────────────────────┘
```

**Dialog de Confirmação:**
```
┌─────────────────────────────────────────────────────┐
│  ↶ Desfazer Última Alteração                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ⚠️ Você está prestes a desfazer:                  │
│                                                     │
│  • Ação: Inserção                                   │
│  • Tipo: Compra                                     │
│  • Descrição: "Mercado XYZ - R$ 150,00"            │
│  • Realizada: há 5 minutos                          │
│                                                     │
│  Esta ação irá remover a compra e todas as          │
│  parcelas associadas.                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                        [Cancelar]  [Confirmar]      │
└─────────────────────────────────────────────────────┘
```

### Detalhes Técnicos

#### Lógica de Undo por Tipo de Ação

**1. Desfazer INSERT (compras_cartao):**
```typescript
// Deletar parcelas associadas
await supabase.from("parcelas_cartao").delete().eq("compra_id", registroId);
// Deletar a compra
await supabase.from("compras_cartao").delete().eq("id", registroId);
```

**2. Desfazer UPDATE:**
```typescript
// Restaurar dados anteriores
await supabase.from(tabela).update(dados_anteriores).eq("id", registroId);
```

**3. Desfazer DELETE (compras_cartao):**
```typescript
// Re-inserir a compra com os dados anteriores
await supabase.from("compras_cartao").insert(dados_anteriores);
// Buscar e re-inserir parcelas do mesmo período na auditoria
// (parcelas deletadas em cascata terão registros de auditoria próximos)
```

#### Limitações e Segurança

| Aspecto | Tratamento |
|---------|------------|
| Apenas 1 nível de undo | Por simplicidade, apenas a última ação pode ser desfeita |
| Timeout de 24h | Alterações com mais de 24h não podem ser desfeitas |
| Undo de undo | Evitado - o undo gera novos registros de auditoria que podem ser desfeitos |
| Cascata | DELETE de compra restaura automaticamente as parcelas |

### Sequência de Implementação

1. Criar `useUltimaAlteracao.ts` - hook para buscar última alteração
2. Criar `DesfazerAlteracaoDialog.tsx` - dialog de confirmação
3. Adicionar `desfazerUltimaAlteracao()` em `compras-cartao.ts`
4. Integrar botão e dialog em `Cartoes.tsx`

### Benefícios

- Segurança para o usuário reverter erros rapidamente
- Usa infraestrutura de auditoria já existente
- Interface clara mostrando exatamente o que será desfeito
- Padrão consistente com outros "desfazer" do sistema (como AdiantarFatura)

