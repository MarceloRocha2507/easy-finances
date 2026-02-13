

# Adicionar Seletor de Mes no Modal "Mensagens em Lote"

## O que sera feito

Adicionar um seletor de mes/ano na etapa de selecao do modal `GerarMensagensLoteDialog`, permitindo ao usuario escolher para qual mes deseja gerar as mensagens. Atualmente o mes vem fixo da prop `mesReferencia`; com a mudanca, o usuario podera alterar o mes diretamente no modal.

## Mudancas em `src/components/cartoes/GerarMensagensLoteDialog.tsx`

1. Adicionar um estado local `mesSelecionado` inicializado com o valor de `mesReferencia`
2. Inserir um seletor de mes (usando navegacao com setas esquerda/direita e label do mes/ano, similar ao padrao ja usado na pagina de cartoes) entre o header e o seletor de responsavel
3. Usar `mesSelecionado` em vez de `mesReferencia` ao chamar `gerarMensagemLote` e ao exibir o nome do mes na descricao
4. Resetar `mesSelecionado` para `mesReferencia` ao fechar o modal

### Layout do seletor de mes

Sera um componente inline com:
- Botao seta esquerda (mes anterior)
- Texto centralizado com o mes/ano (ex: "fevereiro de 2026")
- Botao seta direita (proximo mes)

Posicionado logo acima do seletor de "Responsavel", com label "Mes de referencia" e icone de calendario.

## Secao tecnica

```text
Estado novo:
  const [mesSelecionado, setMesSelecionado] = useState(mesReferencia);

Navegacao de mes:
  const mesAnterior = () => setMesSelecionado(prev => subMonths(prev, 1));
  const mesProximo = () => setMesSelecionado(prev => addMonths(prev, 1));

Importar de date-fns:
  import { addMonths, subMonths } from "date-fns";
```

Na chamada de `handleGerar`, substituir `mesReferencia` por `mesSelecionado`.
Na variavel `nomeMes`, usar `mesSelecionado` em vez de `mesReferencia`.
No `resetState`, adicionar `setMesSelecionado(mesReferencia)`.

## Arquivos modificados

- `src/components/cartoes/GerarMensagensLoteDialog.tsx` - Adicionar estado e seletor de mes

