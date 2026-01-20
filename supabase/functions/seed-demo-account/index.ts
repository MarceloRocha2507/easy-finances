import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEMO_EMAIL = "demo@fina.app";
const DEMO_PASSWORD = "demo123";
const DEMO_FULL_NAME = "Usuário Demonstração";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('🔄 Iniciando seed da conta demo...');

    // 1. Verificar se usuário demo já existe
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingDemo = existingUsers?.users?.find(u => u.email === DEMO_EMAIL);

    let demoUserId: string;

    if (existingDemo) {
      console.log('👤 Usuário demo encontrado, limpando dados...');
      demoUserId = existingDemo.id;

      // Limpar dados existentes na ordem correta (respeitar foreign keys)
      await supabaseAdmin.from('parcelas_cartao').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabaseAdmin.from('movimentacoes_investimento').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('investimentos').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('metas').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('orcamentos').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('acertos_fatura').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('compras_cartao').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('cartoes').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('responsaveis').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('transactions').delete().eq('user_id', demoUserId);
      await supabaseAdmin.from('categories').delete().eq('user_id', demoUserId);
      
      console.log('✅ Dados anteriores removidos');
    } else {
      console.log('👤 Criando novo usuário demo...');
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: DEMO_FULL_NAME,
        },
      });

      if (createError) {
        throw new Error(`Erro ao criar usuário: ${createError.message}`);
      }

      demoUserId = newUser.user.id;
      console.log('✅ Usuário demo criado:', demoUserId);
    }

    // 2. Atualizar/Criar profile
    await supabaseAdmin.from('profiles').upsert({
      user_id: demoUserId,
      full_name: DEMO_FULL_NAME,
      saldo_inicial: 5000,
      plan_type: 'ilimitado',
      is_active: true,
    }, { onConflict: 'user_id' });

    console.log('✅ Profile atualizado');

    // 3. Criar categorias (despesas)
    const categoriasData = [
      { user_id: demoUserId, name: 'Alimentação', icon: 'utensils', color: '#ef4444', type: 'expense', is_default: true },
      { user_id: demoUserId, name: 'Transporte', icon: 'car', color: '#f97316', type: 'expense', is_default: true },
      { user_id: demoUserId, name: 'Moradia', icon: 'home', color: '#eab308', type: 'expense', is_default: true },
      { user_id: demoUserId, name: 'Contas', icon: 'zap', color: '#84cc16', type: 'expense', is_default: true },
      { user_id: demoUserId, name: 'Lazer', icon: 'gamepad', color: '#22c55e', type: 'expense', is_default: true },
      { user_id: demoUserId, name: 'Compras', icon: 'shopping-cart', color: '#14b8a6', type: 'expense', is_default: true },
      { user_id: demoUserId, name: 'Saúde', icon: 'heart', color: '#06b6d4', type: 'expense', is_default: true },
      { user_id: demoUserId, name: 'Educação', icon: 'graduation-cap', color: '#0ea5e9', type: 'expense', is_default: true },
      { user_id: demoUserId, name: 'Outros', icon: 'package', color: '#6366f1', type: 'expense', is_default: true },
      // Receitas
      { user_id: demoUserId, name: 'Salário', icon: 'dollar-sign', color: '#22c55e', type: 'income', is_default: true },
      { user_id: demoUserId, name: 'Freelance', icon: 'briefcase', color: '#10b981', type: 'income', is_default: true },
      { user_id: demoUserId, name: 'Investimentos', icon: 'trending-up', color: '#14b8a6', type: 'income', is_default: true },
      { user_id: demoUserId, name: 'Vendas', icon: 'tag', color: '#06b6d4', type: 'income', is_default: true },
      { user_id: demoUserId, name: 'Outros Receita', icon: 'wallet', color: '#0ea5e9', type: 'income', is_default: true },
    ];

    const { data: categorias } = await supabaseAdmin.from('categories').insert(categoriasData).select();
    console.log('✅ Categorias criadas:', categorias?.length);

    // Mapear categorias por nome para uso posterior
    const catMap: Record<string, string> = {};
    categorias?.forEach(c => {
      catMap[c.name + '_' + c.type] = c.id;
    });

    // 4. Criar responsáveis
    const { data: responsaveis } = await supabaseAdmin.from('responsaveis').insert([
      { user_id: demoUserId, nome: 'Titular', is_titular: true },
      { user_id: demoUserId, nome: 'Cônjuge', is_titular: false },
      { user_id: demoUserId, nome: 'Filho', is_titular: false },
    ]).select();

    const respMap: Record<string, string> = {};
    responsaveis?.forEach(r => {
      respMap[r.nome] = r.id;
    });
    console.log('✅ Responsáveis criados');

    // 5. Criar cartões de crédito
    const { data: cartoes } = await supabaseAdmin.from('cartoes').insert([
      {
        user_id: demoUserId,
        nome: 'Nubank',
        bandeira: 'mastercard',
        limite: 8000,
        dia_vencimento: 15,
        dia_fechamento: 8,
        cor: '#8B5CF6',
      },
      {
        user_id: demoUserId,
        nome: 'Inter',
        bandeira: 'mastercard',
        limite: 5000,
        dia_vencimento: 10,
        dia_fechamento: 3,
        cor: '#F97316',
      },
    ]).select();

    const cartaoMap: Record<string, string> = {};
    cartoes?.forEach(c => {
      cartaoMap[c.nome] = c.id;
    });
    console.log('✅ Cartões criados');

    // 6. Criar transações (últimos 3 meses)
    const hoje = new Date();
    const transacoes = [];

    // Últimos 3 meses de transações
    for (let mesOffset = 0; mesOffset < 3; mesOffset++) {
      const mesData = new Date(hoje.getFullYear(), hoje.getMonth() - mesOffset, 1);
      const mesStr = mesData.toISOString().slice(0, 7);

      // Receitas
      transacoes.push({
        user_id: demoUserId,
        type: 'income',
        amount: 5500,
        description: 'Salário',
        date: `${mesStr}-05`,
        category_id: catMap['Salário_income'],
        status: 'completed',
      });

      if (mesOffset === 0) {
        transacoes.push({
          user_id: demoUserId,
          type: 'income',
          amount: 1200,
          description: 'Projeto freelance',
          date: `${mesStr}-15`,
          category_id: catMap['Freelance_income'],
          status: 'completed',
        });
      }

      // Despesas variadas
      const despesasDoMes = [
        { desc: 'Aluguel', valor: 1800, cat: 'Moradia', dia: '01' },
        { desc: 'Supermercado', valor: 650, cat: 'Alimentação', dia: '08' },
        { desc: 'Combustível', valor: 320, cat: 'Transporte', dia: '10' },
        { desc: 'Internet', valor: 120, cat: 'Contas', dia: '12' },
        { desc: 'Energia', valor: 180, cat: 'Contas', dia: '15' },
        { desc: 'Academia', valor: 100, cat: 'Saúde', dia: '05' },
        { desc: 'Netflix', valor: 45, cat: 'Lazer', dia: '20' },
        { desc: 'Farmácia', valor: 85, cat: 'Saúde', dia: '18' },
        { desc: 'Restaurante', valor: 150, cat: 'Alimentação', dia: '22' },
        { desc: 'Uber', valor: 60, cat: 'Transporte', dia: '25' },
      ];

      despesasDoMes.forEach(d => {
        transacoes.push({
          user_id: demoUserId,
          type: 'expense',
          amount: d.valor,
          description: d.desc,
          date: `${mesStr}-${d.dia}`,
          category_id: catMap[d.cat + '_expense'],
          status: mesOffset === 0 && parseInt(d.dia) > hoje.getDate() ? 'pending' : 'completed',
        });
      });
    }

    await supabaseAdmin.from('transactions').insert(transacoes);
    console.log('✅ Transações criadas:', transacoes.length);

    // 7. Criar compras no cartão (estrutura correta)
    const mesAtual = hoje.toISOString().slice(0, 7);
    
    // Celular parcelado em 12x no Nubank
    const dataCompraCelular = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 15);
    const { data: compraCelular } = await supabaseAdmin.from('compras_cartao').insert({
      user_id: demoUserId,
      cartao_id: cartaoMap['Nubank'],
      responsavel_id: respMap['Titular'],
      descricao: 'iPhone 15 Pro',
      valor_total: 2400,
      data_compra: dataCompraCelular.toISOString().slice(0, 10),
      mes_inicio: new Date(dataCompraCelular.getFullYear(), dataCompraCelular.getMonth() + 1, 1).toISOString().slice(0, 7),
      parcelas: 12,
      parcela_inicial: 1,
      tipo_lancamento: 'parcelado',
      categoria_id: catMap['Compras_expense'],
    }).select().single();

    // Criar parcelas do celular
    if (compraCelular) {
      const parcelasCelular = [];
      for (let i = 0; i < 12; i++) {
        const dataParcela = new Date(dataCompraCelular.getFullYear(), dataCompraCelular.getMonth() + 1 + i, 1);
        parcelasCelular.push({
          compra_id: compraCelular.id,
          mes_referencia: dataParcela.toISOString().slice(0, 7),
          numero_parcela: i + 1,
          total_parcelas: 12,
          valor: 200,
          paga: i < 2, // Primeiras 2 parcelas pagas
          tipo_recorrencia: 'parcelado',
        });
      }
      await supabaseAdmin.from('parcelas_cartao').insert(parcelasCelular);
    }

    // Passagem parcelada em 6x no Inter
    const dataCompraPassagem = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 20);
    const { data: compraPassagem } = await supabaseAdmin.from('compras_cartao').insert({
      user_id: demoUserId,
      cartao_id: cartaoMap['Inter'],
      responsavel_id: respMap['Titular'],
      descricao: 'Passagem aérea São Paulo',
      valor_total: 1800,
      data_compra: dataCompraPassagem.toISOString().slice(0, 10),
      mes_inicio: new Date(dataCompraPassagem.getFullYear(), dataCompraPassagem.getMonth() + 1, 1).toISOString().slice(0, 7),
      parcelas: 6,
      parcela_inicial: 1,
      tipo_lancamento: 'parcelado',
      categoria_id: catMap['Lazer_expense'],
    }).select().single();

    // Criar parcelas da passagem
    if (compraPassagem) {
      const parcelasPassagem = [];
      for (let i = 0; i < 6; i++) {
        const dataParcela = new Date(dataCompraPassagem.getFullYear(), dataCompraPassagem.getMonth() + 1 + i, 1);
        parcelasPassagem.push({
          compra_id: compraPassagem.id,
          mes_referencia: dataParcela.toISOString().slice(0, 7),
          numero_parcela: i + 1,
          total_parcelas: 6,
          valor: 300,
          paga: i < 1, // Primeira parcela paga
          tipo_recorrencia: 'parcelado',
        });
      }
      await supabaseAdmin.from('parcelas_cartao').insert(parcelasPassagem);
    }

    // Compras avulsas recentes (à vista)
    const comprasAvulsas = [
      { desc: 'Mercado Pão de Açúcar', valor: 280, cartao: 'Nubank', resp: 'Titular', dias: -5 },
      { desc: 'Farmácia Drogasil', valor: 95, cartao: 'Nubank', resp: 'Cônjuge', dias: -3 },
      { desc: 'Spotify Family', valor: 35, cartao: 'Inter', resp: 'Titular', dias: -10 },
      { desc: 'iFood', valor: 65, cartao: 'Nubank', resp: 'Filho', dias: -2 },
      { desc: 'Amazon Prime', valor: 15, cartao: 'Inter', resp: 'Titular', dias: -15 },
      { desc: 'Posto Shell', valor: 200, cartao: 'Nubank', resp: 'Titular', dias: -7 },
    ];

    for (const c of comprasAvulsas) {
      const dataCompra = new Date(hoje);
      dataCompra.setDate(dataCompra.getDate() + c.dias);
      
      const { data: compraAvulsa } = await supabaseAdmin.from('compras_cartao').insert({
        user_id: demoUserId,
        cartao_id: cartaoMap[c.cartao],
        responsavel_id: respMap[c.resp],
        descricao: c.desc,
        valor_total: c.valor,
        data_compra: dataCompra.toISOString().slice(0, 10),
        mes_inicio: mesAtual,
        parcelas: 1,
        parcela_inicial: 1,
        tipo_lancamento: 'avista',
        categoria_id: catMap['Compras_expense'],
      }).select().single();

      // Criar parcela única
      if (compraAvulsa) {
        await supabaseAdmin.from('parcelas_cartao').insert({
          compra_id: compraAvulsa.id,
          mes_referencia: mesAtual,
          numero_parcela: 1,
          total_parcelas: 1,
          valor: c.valor,
          paga: false,
          tipo_recorrencia: 'avista',
        });
      }
    }

    console.log('✅ Compras no cartão criadas');

    // 8. Criar metas de economia (estrutura correta: titulo, data_limite)
    await supabaseAdmin.from('metas').insert([
      {
        user_id: demoUserId,
        titulo: 'Reserva de Emergência',
        valor_alvo: 15000,
        valor_atual: 8500,
        data_limite: new Date(hoje.getFullYear() + 1, 5, 30).toISOString().slice(0, 10),
        cor: '#22c55e',
        icone: 'shield',
        concluida: false,
      },
      {
        user_id: demoUserId,
        titulo: 'Viagem de Férias',
        valor_alvo: 6000,
        valor_atual: 2100,
        data_limite: new Date(hoje.getFullYear(), 11, 15).toISOString().slice(0, 10),
        cor: '#0ea5e9',
        icone: 'plane',
        concluida: false,
      },
      {
        user_id: demoUserId,
        titulo: 'Trocar de Carro',
        valor_alvo: 40000,
        valor_atual: 12000,
        data_limite: new Date(hoje.getFullYear() + 2, 0, 1).toISOString().slice(0, 10),
        cor: '#f97316',
        icone: 'car',
        concluida: false,
      },
    ]);
    console.log('✅ Metas criadas');

    // 9. Criar investimentos (estrutura correta com icone e cor)
    await supabaseAdmin.from('investimentos').insert([
      {
        user_id: demoUserId,
        nome: 'Poupança Caixa',
        tipo: 'Poupança',
        instituicao: 'Caixa Econômica',
        valor_inicial: 3000,
        valor_atual: 3500,
        data_inicio: new Date(hoje.getFullYear() - 1, 0, 15).toISOString().slice(0, 10),
        rentabilidade_anual: 6.17,
        icone: 'piggy-bank',
        cor: '#22c55e',
      },
      {
        user_id: demoUserId,
        nome: 'CDB Inter 100%',
        tipo: 'CDB',
        instituicao: 'Banco Inter',
        valor_inicial: 5000,
        valor_atual: 5400,
        data_inicio: new Date(hoje.getFullYear(), 0, 10).toISOString().slice(0, 10),
        rentabilidade_anual: 12.5,
        data_vencimento: new Date(hoje.getFullYear() + 1, 0, 10).toISOString().slice(0, 10),
        icone: 'landmark',
        cor: '#f97316',
      },
      {
        user_id: demoUserId,
        nome: 'Tesouro Selic',
        tipo: 'Tesouro Direto',
        instituicao: 'Tesouro Nacional',
        valor_inicial: 7500,
        valor_atual: 8200,
        data_inicio: new Date(hoje.getFullYear() - 1, 5, 1).toISOString().slice(0, 10),
        rentabilidade_anual: 13.25,
        icone: 'building-2',
        cor: '#0ea5e9',
      },
      {
        user_id: demoUserId,
        nome: 'Fundo de Ações BTG',
        tipo: 'Fundo de Investimento',
        instituicao: 'BTG Pactual',
        valor_inicial: 3000,
        valor_atual: 2800,
        data_inicio: new Date(hoje.getFullYear(), 2, 15).toISOString().slice(0, 10),
        rentabilidade_anual: -8.5,
        icone: 'trending-up',
        cor: '#8b5cf6',
      },
    ]);
    console.log('✅ Investimentos criados');

    // 10. Criar orçamentos por categoria (estrutura correta: category_id, mes_referencia)
    await supabaseAdmin.from('orcamentos').insert([
      { user_id: demoUserId, category_id: catMap['Alimentação_expense'], mes_referencia: mesAtual, valor_limite: 1200 },
      { user_id: demoUserId, category_id: catMap['Transporte_expense'], mes_referencia: mesAtual, valor_limite: 600 },
      { user_id: demoUserId, category_id: catMap['Lazer_expense'], mes_referencia: mesAtual, valor_limite: 400 },
      { user_id: demoUserId, category_id: catMap['Compras_expense'], mes_referencia: mesAtual, valor_limite: 500 },
      { user_id: demoUserId, category_id: catMap['Saúde_expense'], mes_referencia: mesAtual, valor_limite: 300 },
    ]);
    console.log('✅ Orçamentos criados');

    console.log('🎉 Seed da conta demo concluído com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta demo resetada com sucesso',
        user_id: demoUserId,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro no seed:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
