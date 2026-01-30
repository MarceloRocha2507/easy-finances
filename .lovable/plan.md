
# Plano: Registrar Receita e Depositar na Meta (Automaticamente)

## Problema Identificado

Quando o usuário tenta depositar um valor na meta, mas o saldo disponível é insuficiente, o botão "Adicionar à meta" fica desabilitado e aparece a mensagem "Saldo insuficiente! Disponível: R$ 0,00".

O usuário precisa de uma opção que permita:
1. Registrar uma receita (income) no sistema
2. Automaticamente adicionar esse valor à meta

## Solução Proposta

Adicionar um botão alternativo que aparece **apenas quando o saldo é insuficiente**. Este botão vai:
1. Abrir um mini-formulário inline para registrar a receita
2. Selecionar categoria de receita
3. Ao confirmar: criar a transação de receita + depositar na meta automaticamente

```text
┌────────────────────────────────────────────────┐
│  Valor do depósito (R$)                        │
│  ┌──────────────────────────────┐              │
│  │ 30,40                     ↕  │              │
│  └──────────────────────────────┘              │
│  🔴 Saldo insuficiente! Disponível: R$ 0,00    │
│                                                │
│  ╭────────────────────────────────────────────╮│
│  │ 💡 Registrar receita e depositar na meta  ││  ← NOVO
│  ╰────────────────────────────────────────────╯│
│                                                │
│  [■■■■■■■■■■ Adicionar à meta ■■■■■■■■■■■■■]   │  ← Desabilitado
│                                                │
└────────────────────────────────────────────────┘
```

Ao clicar no botão alternativo:

```text
┌────────────────────────────────────────────────┐
│  💡 Registrar receita e depositar na meta      │
│                                                │
│  Valor: R$ 30,40                               │
│                                                │
│  Descrição (opcional)                          │
│  ┌──────────────────────────────────────────┐  │
│  │ Freelance, Pix recebido...               │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  Categoria                                     │
│  ┌──────────────────────────────────────────┐  │
│  │ Salário                              ▼   │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [Cancelar]    [✓ Registrar e depositar]       │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Fluxo de Funcionamento

1. **Detecção de Saldo Insuficiente**
   - Quando `depositoExcedeSaldo === true`, mostrar o botão alternativo

2. **Clique no Botão "Registrar receita e depositar na meta"**
   - Mostrar campos inline (ou expandir seção) com:
     - Descrição (opcional)
     - Categoria de receita (obrigatória)

3. **Ao Confirmar**
   - Criar transação de income com o valor do depósito
   - Esperar a transação ser criada
   - Adicionar o mesmo valor à meta
   - Invalidar queries para atualizar saldo

4. **Resultado**
   - Saldo aumenta (receita registrada)
   - Meta recebe o depósito
   - Patrimônio total permanece igual (receita + depósito se anulam no saldo disponível)

---

## Alterações Técnicas

### 1. Atualizar `GerenciarMetaDialog.tsx`

**Novos estados:**
```tsx
const [modoReceitaEDeposito, setModoReceitaEDeposito] = useState(false);
const [descricaoReceita, setDescricaoReceita] = useState("");
const [categoriaReceita, setCategoriaReceita] = useState("");
```

**Buscar categorias de receita:**
```tsx
const { data: categories } = useCategories();
const incomeCategories = categories?.filter(c => c.type === 'income') || [];
```

**Nova mutation combinada:**
```tsx
const registrarReceitaEDepositar = useMutation({
  mutationFn: async () => {
    // 1. Criar transação de receita
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "income",
      amount: valorDepositoNum,
      description: descricaoReceita || `Receita para meta: ${meta.titulo}`,
      category_id: categoriaReceita,
      status: "completed",
      date: new Date().toISOString().split("T")[0],
    });
    if (txError) throw txError;

    // 2. Depositar na meta (sem validar saldo, pois acabamos de criar a receita)
    await adicionarValor.mutateAsync({
      id: meta.id,
      valor: valorDepositoNum,
      valorAtualAnterior: meta.valorAtual,
      valorAlvo: meta.valorAlvo,
      metaTitulo: meta.titulo,
      // Não passar saldoDisponivel para pular validação
    });
  },
  onSuccess: () => {
    toast({
      title: "Receita registrada e depositada!",
      description: `R$ ${valorDepositoNum.toFixed(2)} foi registrado e adicionado à meta.`,
    });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
    queryClient.invalidateQueries({ queryKey: ["metas"] });
    setModoReceitaEDeposito(false);
    setValorDeposito("");
    setDescricaoReceita("");
    setCategoriaReceita("");
    onSuccess?.();
  },
});
```

**UI condicional:**
```tsx
{depositoExcedeSaldo && !modoReceitaEDeposito && (
  <Button
    variant="outline"
    className="w-full gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
    onClick={() => setModoReceitaEDeposito(true)}
  >
    <Lightbulb className="w-4 h-4" />
    Registrar receita e depositar na meta
  </Button>
)}

{modoReceitaEDeposito && (
  <div className="space-y-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
    <div className="flex items-center gap-2 text-sm font-medium text-primary">
      <Lightbulb className="w-4 h-4" />
      Registrar receita e depositar na meta
    </div>

    <p className="text-xs text-muted-foreground">
      Uma receita de {formatCurrency(valorDepositoNum)} será registrada e 
      automaticamente adicionada à meta.
    </p>

    <div className="space-y-2">
      <Label className="text-xs">Descrição (opcional)</Label>
      <Input
        placeholder="Ex: Freelance, Pix recebido..."
        value={descricaoReceita}
        onChange={(e) => setDescricaoReceita(e.target.value)}
      />
    </div>

    <div className="space-y-2">
      <Label className="text-xs">Categoria</Label>
      <Select value={categoriaReceita} onValueChange={setCategoriaReceita}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a categoria" />
        </SelectTrigger>
        <SelectContent>
          {incomeCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="flex gap-2 pt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setModoReceitaEDeposito(false)}
      >
        Cancelar
      </Button>
      <Button
        size="sm"
        className="flex-1 gradient-income"
        disabled={!categoriaReceita || registrarReceitaEDepositar.isPending}
        onClick={() => registrarReceitaEDepositar.mutate()}
      >
        {registrarReceitaEDepositar.isPending
          ? "Registrando..."
          : "Registrar e depositar"}
      </Button>
    </div>
  </div>
)}
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dashboard/GerenciarMetaDialog.tsx` | Adicionar estados para modo receita + depósito, formulário inline, mutation combinada |

---

## Resultado Esperado

1. **Saldo insuficiente** → Botão "Registrar receita e depositar" aparece
2. **Usuário clica** → Formulário inline aparece com descrição e categoria
3. **Usuário confirma** → 
   - Receita é criada (aumenta saldo disponível)
   - Depósito é feito na meta (diminui saldo disponível, aumenta meta)
   - Resultado final: meta aumenta, saldo líquido permanece igual
4. **Fluxo transparente** → Sem necessidade de ir para outra tela

---

## Considerações de UX

- O botão alternativo só aparece quando realmente há saldo insuficiente
- O valor já está preenchido (o mesmo que o usuário digitou)
- A categoria é obrigatória para manter consistência contábil
- A descrição é opcional, mas pré-preenchida com sugestão
- Feedback claro com toast após sucesso
