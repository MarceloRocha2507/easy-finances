

## Plano: Melhorar Diagnóstico de Duplicatas na Importação

### Problema Relatado

Ao tentar importar compras para o cartão Nubank (que está vazio), o sistema mostra "duplicatas detectadas", mas não há compras visíveis no cartão.

### Diagnóstico

Após análise do banco de dados:
- O cartão Nubank (8607c9f1...) tem **0 compras** (ativas ou inativas)
- A verificação de duplicatas filtra corretamente por `cartao_id`
- Portanto, as duplicatas são provavelmente do tipo **"lote"** (dentro do próprio texto importado)

### Causas Prováveis

1. **Duplicatas no Lote**: Se o texto de importação contém múltiplas parcelas da mesma compra (ex: "Loja X - Parcela 1/3" e "Loja X - Parcela 2/3"), o sistema detecta como duplicata pois ao importar a primeira parcela, as demais são geradas automaticamente.

2. **Fingerprint Muito Agressivo**: A normalização da descrição pode estar gerando o mesmo hash para compras diferentes.

### Solução Proposta

Adicionar informações de diagnóstico mais claras na interface para ajudar a entender por que uma compra foi marcada como duplicata.

#### Alterações

**Arquivo:** `src/pages/cartoes/ImportarCompras.tsx`

| Local | Alteração |
|-------|-----------|
| Coluna "Duplicata" | Exibir tooltip com fingerprint calculado |
| Mensagem de duplicata | Adicionar motivo detalhado (descrição base, parcelas, mês base) |

**Arquivo:** `src/services/importar-compras-cartao.ts`

| Local | Alteração |
|-------|-----------|
| Função `detectarDuplicatasNoLote` | Incluir campos de debug no `duplicataInfo` |
| Função `verificarDuplicatas` | Incluir fingerprint no retorno para debug |

#### Nova Estrutura de Debug

```typescript
interface DuplicataInfo {
  compraId: string;
  descricao: string;
  origemDuplicata: "banco" | "lote";
  parcelaEncontrada?: number;
  mesInicio?: string;
  // Novos campos para diagnóstico
  motivoDetalhado?: string;
  fingerprintCalculado?: string;
}
```

#### Nova Mensagem na Interface

Em vez de apenas:
```
Duplicata no lote (linha 1)
```

Exibir:
```
Duplicata no lote: mesma compra que linha 1
(Descrição: "mercado xyz", Parcelas: 2, Mês base: jan/26)
```

### Benefícios

- O usuário entende exatamente por que a duplicata foi detectada
- Facilita identificar falsos positivos
- Permite corrigir o texto de entrada se necessário

### Alternativa Rápida

Se preferir uma solução mais simples, posso apenas **adicionar um console.log** no processamento para você verificar no DevTools qual fingerprint está sendo gerado para cada linha.

