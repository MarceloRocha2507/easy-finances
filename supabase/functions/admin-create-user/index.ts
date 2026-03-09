import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { action } = body

    const jsonResponse = (data: unknown, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // ============ STATS ============
    if (action === 'stats') {
      const [
        { count: transCount },
        { count: cartoesCount },
        { count: bancosCount },
        { data: profiles }
      ] = await Promise.all([
        supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('cartoes').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('bancos').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('profiles').select('tipo_plano')
      ])

      const distribuicaoPlanos: Record<string, number> = {}
      for (const p of profiles || []) {
        const plano = p.tipo_plano || 'mensal'
        distribuicaoPlanos[plano] = (distribuicaoPlanos[plano] || 0) + 1
      }

      return jsonResponse({
        total_transacoes: transCount || 0,
        total_cartoes: cartoesCount || 0,
        total_bancos: bancosCount || 0,
        distribuicao_planos: distribuicaoPlanos
      })
    }

    // ============ USER DETAILS ============
    if (action === 'user-details') {
      const { user_id: target_id } = body
      if (!target_id) return jsonResponse({ error: 'user_id obrigatório' }, 400)

      const [
        { count: transCount },
        { count: cartoesCount },
        { count: bancosCount },
        { data: authUser }
      ] = await Promise.all([
        supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('user_id', target_id),
        supabaseAdmin.from('cartoes').select('*', { count: 'exact', head: true }).eq('user_id', target_id),
        supabaseAdmin.from('bancos').select('*', { count: 'exact', head: true }).eq('user_id', target_id),
        supabaseAdmin.auth.admin.getUserById(target_id)
      ])

      return jsonResponse({
        total_transacoes: transCount || 0,
        total_cartoes: cartoesCount || 0,
        total_bancos: bancosCount || 0,
        last_sign_in_at: authUser?.user?.last_sign_in_at || null
      })
    }

    // ============ ACTIVITY ============
    if (action === 'activity') {
      const { data: logs } = await supabaseAdmin
        .from('auditoria_cartao')
        .select('id, user_id, tabela, acao, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      // Get user emails for the logs
      const userIds = [...new Set((logs || []).map(l => l.user_id))]
      const userMap: Record<string, string> = {}
      for (const uid of userIds) {
        const { data } = await supabaseAdmin.auth.admin.getUserById(uid)
        if (data?.user) userMap[uid] = data.user.email || uid
      }

      return jsonResponse({
        logs: (logs || []).map(l => ({ ...l, email: userMap[l.user_id] || l.user_id }))
      })
    }

    // ============ DELETE USER ============
    if (action === 'delete') {
      const { user_id: target_id } = body
      if (!target_id) return jsonResponse({ error: 'user_id obrigatório' }, 400)
      if (target_id === user.id) return jsonResponse({ error: 'Você não pode excluir a si mesmo' }, 400)

      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(target_id)
      if (delError) return jsonResponse({ error: delError.message }, 400)

      return jsonResponse({ success: true })
    }

    // ============ BULK RENEW ============
    if (action === 'bulk-renew') {
      const { user_ids, tipo_plano } = body
      if (!user_ids?.length || !tipo_plano) return jsonResponse({ error: 'user_ids e tipo_plano obrigatórios' }, 400)

      const data_expiracao = calcularExpiracao(tipo_plano)
      for (const uid of user_ids) {
        await supabaseAdmin.from('profiles').update({ tipo_plano, data_expiracao }).eq('user_id', uid)
      }

      return jsonResponse({ success: true, updated: user_ids.length })
    }

    // ============ BULK TOGGLE ============
    if (action === 'bulk-toggle') {
      const { user_ids, ativo, motivo_desativacao } = body
      if (!user_ids?.length || ativo === undefined) return jsonResponse({ error: 'user_ids e ativo obrigatórios' }, 400)

      for (const uid of user_ids) {
        await supabaseAdmin.from('profiles').update({
          ativo,
          motivo_desativacao: ativo ? null : (motivo_desativacao || 'Desativação em lote')
        }).eq('user_id', uid)

        if (!ativo) {
          await supabaseAdmin.auth.admin.updateUserById(uid, { ban_duration: '876000h' })
        } else {
          await supabaseAdmin.auth.admin.updateUserById(uid, { ban_duration: 'none' })
        }
      }

      return jsonResponse({ success: true, updated: user_ids.length })
    }

    // ============ LIST USERS ============
    if (action === 'list') {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) return jsonResponse({ error: listError.message }, 400)

      const [{ data: roles }, { data: profiles }] = await Promise.all([
        supabaseAdmin.from('user_roles').select('user_id, role'),
        supabaseAdmin.from('profiles').select('user_id, ativo, data_expiracao, motivo_desativacao, tipo_plano')
      ])

      const usersWithRoles = users.users.map(u => {
        const profile = profiles?.find(p => p.user_id === u.id)
        return {
          id: u.id,
          email: u.email,
          full_name: u.user_metadata?.full_name || null,
          created_at: u.created_at,
          role: roles?.find(r => r.user_id === u.id)?.role || 'user',
          ativo: profile?.ativo ?? true,
          data_expiracao: profile?.data_expiracao || null,
          tipo_plano: profile?.tipo_plano || 'mensal',
          motivo_desativacao: profile?.motivo_desativacao || null,
          banned_until: u.banned_until || null,
          last_sign_in_at: u.last_sign_in_at || null
        }
      })

      return jsonResponse({ users: usersWithRoles })
    }

    // ============ CREATE USER ============
    if (action === 'create') {
      const { email, password, full_name, tipo_plano = 'mensal' } = body
      if (!email || !password) return jsonResponse({ error: 'Email e senha são obrigatórios' }, 400)

      const data_expiracao = calcularExpiracao(tipo_plano)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name }
      })
      if (createError) return jsonResponse({ error: createError.message }, 400)

      await supabaseAdmin.from('profiles').insert({ user_id: newUser.user.id, full_name, ativo: true, tipo_plano, data_expiracao })
      await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role: 'user' })

      return jsonResponse({
        success: true,
        user: { id: newUser.user.id, email: newUser.user.email, full_name, created_at: newUser.user.created_at, role: 'user', ativo: true, tipo_plano, data_expiracao }
      })
    }

    // ============ UPDATE USER ============
    if (action === 'update') {
      const { user_id: target_id, email, full_name, tipo_plano } = body
      if (!target_id) return jsonResponse({ error: 'ID do usuário é obrigatório' }, 400)

      if (email) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(target_id, {
          email, user_metadata: { full_name }
        })
        if (updateAuthError) return jsonResponse({ error: updateAuthError.message }, 400)
      }

      const data_expiracao = tipo_plano ? calcularExpiracao(tipo_plano) : undefined
      const updateData: Record<string, unknown> = { full_name }
      if (tipo_plano) { updateData.tipo_plano = tipo_plano; updateData.data_expiracao = data_expiracao }

      const { error: updateProfileError } = await supabaseAdmin.from('profiles').update(updateData).eq('user_id', target_id)
      if (updateProfileError) return jsonResponse({ error: updateProfileError.message }, 400)

      return jsonResponse({ success: true })
    }

    // ============ TOGGLE STATUS ============
    if (action === 'toggle-status') {
      const { user_id: target_id, ativo, motivo_desativacao } = body
      if (!target_id || ativo === undefined) return jsonResponse({ error: 'ID do usuário e status são obrigatórios' }, 400)

      const { error: updateProfileError } = await supabaseAdmin.from('profiles').update({
        ativo, motivo_desativacao: ativo ? null : motivo_desativacao
      }).eq('user_id', target_id)
      if (updateProfileError) return jsonResponse({ error: updateProfileError.message }, 400)

      if (!ativo) {
        await supabaseAdmin.auth.admin.updateUserById(target_id, { ban_duration: '876000h' })
      } else {
        await supabaseAdmin.auth.admin.updateUserById(target_id, { ban_duration: 'none' })
      }

      return jsonResponse({ success: true })
    }

    // ============ RESET PASSWORD ============
    if (action === 'reset-password') {
      const { user_id: target_id } = body
      if (!target_id) return jsonResponse({ error: 'ID do usuário é obrigatório' }, 400)

      const newPassword = crypto.randomUUID().slice(0, 12)
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(target_id, { password: newPassword })
      if (updateError) return jsonResponse({ error: updateError.message }, 400)

      return jsonResponse({ success: true, new_password: newPassword })
    }

    return jsonResponse({ error: 'Ação inválida' }, 400)

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function calcularExpiracao(tipoPlano: string): string | null {
  const hoje = new Date()
  switch (tipoPlano) {
    case 'teste': hoje.setDate(hoje.getDate() + 7); return hoje.toISOString().split('T')[0]
    case 'mensal': hoje.setDate(hoje.getDate() + 30); return hoje.toISOString().split('T')[0]
    case 'anual': hoje.setDate(hoje.getDate() + 365); return hoje.toISOString().split('T')[0]
    case 'ilimitado': default: return null
  }
}
