
# Padronizar cor do cartao em todos os modais

## Objetivo
Aplicar o mesmo padrao visual do `DetalhesCartaoDialog` (header com fundo solido usando `cartao.cor` e texto branco) em todos os modais relacionados a cartoes que recebem o objeto `cartao` como prop.

## Modais que serao atualizados

### Grupo 1: Modais que ja recebem `cartao: Cartao` (acesso direto a `cartao.cor`)
Estes modais terao o header redesenhado com fundo colorido:

1. **NovaCompraCartaoDialog** - "Nova Compra"
2. **PagarFaturaDialog** - "Pagar Fatura"
3. **EditarCartaoDialog** - "Editar cartao"
4. **GerarMensagemDialog** - "Gerar Mensagem da Fatura"
5. **RegistrarAcertoDialog** - "Registrar Acerto"
6. **AdiantarFaturaDialog** - "Adiantar Fatura"
7. **ExcluirCartaoDialog** - "Excluir cartao"
8. **NovoCartaoDialog** - Este nao tem cartao existente, entao sera mantido sem cor (padrao do sistema)

### Grupo 2: Modais que precisam receber `cartao.cor` via nova prop
Estes modais atualmente nao recebem a cor do cartao e precisarao de uma nova prop `corCartao`:

9. **AjustarFaturaDialog** - recebe apenas `cartaoId`, adicionaremos `corCartao?: string`
10. **EditarCompraDialog** - recebe apenas `parcela`, adicionaremos `corCartao?: string`
11. **EstornarCompraDialog** - recebe apenas `parcela`, adicionaremos `corCartao?: string`
12. **DetalhesCompraCartaoDialog** - recebe apenas `parcela`, adicionaremos `corCartao?: string`
13. **ExcluirCompraDialog** - AlertDialog, adicionaremos `corCartao?: string`

## Padrao visual aplicado

Para cada modal, o `DialogHeader` sera envolvido por uma div com fundo colorido:

```tsx
<DialogContent className="... p-0 overflow-hidden">
  <div
    className="px-4 sm:px-5 pt-4 pb-4 rounded-t-lg"
    style={{ background: cartao.cor || corCartao || "#6366f1" }}
  >
    <DialogHeader>
      <DialogTitle className="text-white ...">
        <Icon className="text-white/80" />
        Titulo
      </DialogTitle>
      <DialogDescription className="text-white/70">
        Subtitulo
      </DialogDescription>
    </DialogHeader>
  </div>
  <div className="px-4 sm:px-5 pb-4 pt-4">
    {/* conteudo do modal */}
  </div>
</DialogContent>
```

Para AlertDialogs (ExcluirCompraDialog, ExcluirCartaoDialog), o mesmo padrao sera adaptado usando `AlertDialogContent` com `p-0`.

## Detalhes Tecnicos

### Alteracoes por arquivo

1. **NovaCompraCartaoDialog.tsx**: Envolver header com div colorida usando `cartao.cor`, adicionar `p-0` ao DialogContent, mover padding do conteudo para div interna.

2. **PagarFaturaDialog.tsx**: Mesmo padrao. Ja usa `cartao.cor` no icone, migrar para header inteiro colorido.

3. **EditarCartaoDialog.tsx**: Envolver header com div colorida usando `form.cor` (a cor atual do formulario, que reflete a cor do cartao sendo editado).

4. **GerarMensagemDialog.tsx**: Envolver header com div colorida usando `cartao.cor`.

5. **RegistrarAcertoDialog.tsx**: Envolver header com div colorida usando `cartao.cor`.

6. **AdiantarFaturaDialog.tsx**: Envolver header com div colorida usando `cartao.cor`.

7. **ExcluirCartaoDialog.tsx**: Envolver AlertDialogHeader com div colorida usando `cartao?.cor`.

8. **AjustarFaturaDialog.tsx**: Adicionar prop `corCartao?: string` na interface. Envolver header com div colorida. Atualizar chamada no DetalhesCartaoDialog para passar `corCartao={cartao.cor}`.

9. **EditarCompraDialog.tsx**: Adicionar prop `corCartao?: string`. Envolver header com div colorida. Atualizar chamada no DetalhesCartaoDialog.

10. **EstornarCompraDialog.tsx**: Adicionar prop `corCartao?: string`. Envolver header. Atualizar chamada.

11. **DetalhesCompraCartaoDialog.tsx**: Adicionar prop `corCartao?: string`. Envolver header. Atualizar chamada.

12. **ExcluirCompraDialog.tsx**: Adicionar prop `corCartao?: string`. Envolver AlertDialogHeader. Atualizar chamada.

13. **DetalhesCartaoDialog.tsx**: Atualizar todas as chamadas dos sub-modais para passar `corCartao={cartao.cor}` ou o objeto `cartao` quando aplicavel.

### Sequencia de implementacao
1. Atualizar modais do Grupo 1 (ja tem acesso a `cartao.cor`)
2. Adicionar prop `corCartao` aos modais do Grupo 2
3. Atualizar chamadas no DetalhesCartaoDialog para passar a cor
4. Verificar chamadas em outros locais (Cartoes.tsx, Dashboard.tsx) para garantir consistencia
