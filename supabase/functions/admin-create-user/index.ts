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

    // Client para verificar auth do usuário
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    })

    // Verificar usuário autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verificar se é admin usando a função has_role
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' })

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Client admin para criar usuários
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const { action } = body

    // ============ LIST USERS ============
    if (action === 'list') {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        return new Response(
          JSON.stringify({ error: listError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Buscar roles dos usuários
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role')

      // Buscar profiles dos usuários
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, ativo, data_expiracao, motivo_desativacao, tipo_plano')

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
          banned_until: u.banned_until || null
        }
      })

      return new Response(
        JSON.stringify({ users: usersWithRoles }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Função para calcular data de expiração baseado no plano
    function calcularExpiracao(tipoPlano: string): string | null {
      const hoje = new Date()
      switch (tipoPlano) {
        case 'teste':
          hoje.setDate(hoje.getDate() + 7)
          return hoje.toISOString().split('T')[0]
        case 'mensal':
          hoje.setDate(hoje.getDate() + 30)
          return hoje.toISOString().split('T')[0]
        case 'anual':
          hoje.setDate(hoje.getDate() + 365)
          return hoje.toISOString().split('T')[0]
        case 'ilimitado':
        default:
          return null
      }
    }

    // ============ CREATE USER ============
    if (action === 'create') {
      const { email, password, full_name, tipo_plano = 'mensal' } = body

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email e senha são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data_expiracao = calcularExpiracao(tipo_plano)

      // Criar usuário
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name }
      })

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Criar profile para o novo usuário
      await supabaseAdmin.from('profiles').insert({
        user_id: newUser.user.id,
        full_name,
        ativo: true,
        tipo_plano,
        data_expiracao
      })

      // Atribuir role 'user' por padrão
      await supabaseAdmin.from('user_roles').insert({
        user_id: newUser.user.id,
        role: 'user'
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: {
            id: newUser.user.id,
            email: newUser.user.email,
            full_name,
            created_at: newUser.user.created_at,
            role: 'user',
            ativo: true,
            tipo_plano,
            data_expiracao
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============ UPDATE USER ============
    if (action === 'update') {
      const { user_id, email, full_name, tipo_plano } = body

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'ID do usuário é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Atualizar email via Auth se fornecido
      if (email) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          email,
          user_metadata: { full_name }
        })

        if (updateAuthError) {
          return new Response(
            JSON.stringify({ error: updateAuthError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Calcular nova data de expiração se o plano foi alterado
      const data_expiracao = tipo_plano ? calcularExpiracao(tipo_plano) : undefined

      // Atualizar profile
      const updateData: Record<string, unknown> = { full_name }
      if (tipo_plano) {
        updateData.tipo_plano = tipo_plano
        updateData.data_expiracao = data_expiracao
      }

      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('user_id', user_id)

      if (updateProfileError) {
        return new Response(
          JSON.stringify({ error: updateProfileError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============ TOGGLE STATUS ============
    if (action === 'toggle-status') {
      const { user_id, ativo, motivo_desativacao } = body

      if (!user_id || ativo === undefined) {
        return new Response(
          JSON.stringify({ error: 'ID do usuário e status são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Atualizar profile
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          ativo,
          motivo_desativacao: ativo ? null : motivo_desativacao
        })
        .eq('user_id', user_id)

      if (updateProfileError) {
        return new Response(
          JSON.stringify({ error: updateProfileError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Bloquear/desbloquear no Auth
      if (!ativo) {
        // Banir por 100 anos (efetivamente permanente)
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: '876000h' // 100 anos
        })
      } else {
        // Remover ban
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: 'none'
        })
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ============ RESET PASSWORD ============
    if (action === 'reset-password') {
      const { user_id } = body

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: 'ID do usuário é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Gerar nova senha aleatória
      const newPassword = crypto.randomUUID().slice(0, 12)

      // Atualizar senha
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password: newPassword
      })

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, new_password: newPassword }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
