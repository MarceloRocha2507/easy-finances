

## Plano: Admin mais completo

### O que existe hoje
- CRUD de usuários (criar, editar, desativar, resetar senha)
- Renovar plano
- Estatísticas básicas (total, admins, ativos, inativos, expirando)
- Tabela de usuários com badges de status/plano

### O que será adicionado

**1. Busca e filtros na tabela de usuários**
- Campo de busca por nome/email
- Filtro por status (Todos / Ativos / Inativos / Expirados)
- Filtro por plano (Todos / Teste / Mensal / Anual / Ilimitado)

**2. Dashboard com métricas financeiras do sistema**
- Card com total de transações no sistema (contagem)
- Card com total de cartões cadastrados
- Card com distribuição de planos (mini gráfico de barras ou lista)
- Buscar via nova action `stats` na edge function

**3. Aba de logs/atividade recente**
- Tabs: "Usuários" | "Atividade"
- Na aba Atividade: últimos 50 registros de auditoria_cartao do sistema todo (via edge function com service role)
- Mostra: usuário, ação, tabela, data

**4. Ações em lote**
- Checkbox de seleção na tabela
- Botão "Renovar selecionados" para renovar plano em batch
- Botão "Desativar selecionados"

**5. Detalhes do usuário expandido**
- No dropdown de ações: "Ver detalhes"
- Dialog mostrando: quantidade de transações, cartões, bancos, último acesso (last_sign_in_at do auth)
- Buscar via nova action `user-details` na edge function

**6. Excluir usuário**
- Nova ação no dropdown com confirmação
- Nova action `delete` na edge function usando `supabaseAdmin.auth.admin.deleteUser()`

### Alterações técnicas

**Edge function `admin-create-user/index.ts`**
- Nova action `stats`: retorna contagens globais (total transações, cartões, bancos, distribuição de planos)
- Nova action `user-details`: retorna métricas específicas de um usuário (count de transações, cartões, bancos, último login)
- Nova action `delete`: exclui usuário do auth (cascade deleta profile e dados)
- Nova action `bulk-renew`: recebe array de user_ids + tipo_plano
- Nova action `bulk-toggle`: recebe array de user_ids + ativo

**`src/pages/Admin.tsx`**
- Adicionar Tabs "Usuários" | "Atividade"
- Adicionar estados de busca/filtro
- Adicionar lógica de seleção em lote (checkboxes)
- Novo dialog `DetalhesUsuarioDialog`

**`src/hooks/useAdmin.ts`**
- Novas funções: `fetchStats`, `fetchUserDetails`, `deleteUser`, `bulkRenew`, `bulkToggle`, `fetchActivity`

**Novos componentes**
- `src/components/admin/DetalhesUsuarioDialog.tsx`
- `src/components/admin/ExcluirUsuarioDialog.tsx`
- `src/components/admin/AtividadeRecente.tsx`

