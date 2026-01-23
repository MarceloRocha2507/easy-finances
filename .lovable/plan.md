

## Plano: Calcular Automaticamente o Mês da Fatura Baseado na Data da Compra

### O Problema Atual
Quando você registra uma compra no cartão, o sistema sempre sugere o mês atual como mês da fatura, sem considerar o **dia de fechamento** do cartão.

**Exemplo do problema:**
- Cartão com fechamento dia 10
- Você compra algo dia 5 de janeiro
- O sistema sugere "janeiro" como mês da fatura
- Mas na realidade, essa compra vai entrar na fatura de **dezembro** (pois ainda não fechou o mês de janeiro)

### A Solução
Implementar o cálculo automático do mês da fatura baseado em:
1. **Data da compra** (não a data atual)
2. **Dia de fechamento** do cartão

**Lógica:**
```
Se (dia da compra >= dia de fechamento):
   Mês da fatura = mês da compra
Senão:
   Mês da fatura = mês anterior à compra
```

### Alterações Técnicas

#### 1. Modificar `NovaCompraCartaoDialog.tsx`

Adicionar uma função para calcular o mês da fatura baseado na data da compra:

```typescript
// Calcular mês da fatura baseado na data da compra e dia de fechamento
function calcularMesFatura(dataCompra: Date, diaFechamento: number): string {
  const diaCompra = dataCompra.getDate();
  const mesCompra = dataCompra.getMonth();
  const anoCompra = dataCompra.getFullYear();

  if (diaCompra >= diaFechamento) {
    // Compra após o fechamento: vai para a fatura do mês atual
    return format(new Date(anoCompra, mesCompra, 1), "yyyy-MM");
  } else {
    // Compra antes do fechamento: vai para a fatura do mês anterior
    return format(new Date(anoCompra, mesCompra - 1, 1), "yyyy-MM");
  }
}
```

#### 2. Inicializar o mês correto ao abrir o diálogo

Ao abrir o diálogo, calcular o mês da fatura baseado na data atual e no `dia_fechamento` do cartão:

```typescript
useEffect(() => {
  if (open) {
    const hoje = new Date();
    const mesFaturaCalculado = calcularMesFatura(hoje, cartao.dia_fechamento);
    
    setForm({
      ...form,
      mesFatura: mesFaturaCalculado,
      dataCompra: hoje.toISOString().split("T")[0],
      // ... outros campos
    });
  }
}, [open, cartao.dia_fechamento]);
```

#### 3. Recalcular quando a data da compra mudar

Adicionar um `useEffect` que monitora mudanças na `dataCompra` e recalcula o mês da fatura automaticamente:

```typescript
// Recalcular mês da fatura quando a data da compra mudar
useEffect(() => {
  if (form.dataCompra) {
    const dataCompra = new Date(form.dataCompra + "T12:00:00"); // Evitar timezone
    const novoMesFatura = calcularMesFatura(dataCompra, cartao.dia_fechamento);
    
    // Só atualizar se for diferente (evitar loop infinito)
    if (form.mesFatura !== novoMesFatura) {
      setForm(f => ({ ...f, mesFatura: novoMesFatura }));
    }
  }
}, [form.dataCompra, cartao.dia_fechamento]);
```

### Comportamento Esperado Após a Implementação

| Data da Compra | Dia Fechamento | Mês da Fatura |
|----------------|----------------|---------------|
| 05/janeiro     | 10             | **dezembro**  |
| 15/janeiro     | 10             | **janeiro**   |
| 10/janeiro     | 10             | **janeiro**   |
| 01/fevereiro   | 25             | **janeiro**   |
| 26/fevereiro   | 25             | **fevereiro** |

### Observações
- O usuário ainda pode alterar manualmente o mês da fatura se desejar
- A atualização automática só acontece quando a data da compra é alterada
- Garante que as opções de mês disponíveis incluam o mês calculado (mesmo que seja um mês passado)

