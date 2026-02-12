

# Padronizar Design dos Modais de Cartao - Cor Unica

## Objetivo

Remover a necessidade de escolher cores para cada cartao e usar um design padrao unico (gradiente roxo/indigo) em todos os modais e cards de cartao.

## O que muda

### 1. Cor padrao unica para todos os headers
Substituir `cartao.cor` e `corCartao` por uma cor/gradiente padrao em todos os modais e no CartaoCard. A cor padrao sera um gradiente roxo consistente com o design system do projeto (`#8B5CF6` - primary purple).

**Header padrao:**
```tsx
// Em vez de: style={{ background: cartao.cor || "#6366f1" }}
// Usar classe Tailwind fixa:
className="... bg-gradient-to-br from-violet-600 to-indigo-600"
```

### 2. Remover seletor de cor do NovoCartaoDialog
- Remover a secao "Cor do cartao" (grid de 12 cores predefinidas)
- Remover o campo `cor` do formulario
- Remover a constante `CORES_PREDEFINIDAS`
- Simplificar o preview card para usar o gradiente padrao

### 3. Remover seletor de cor do EditarCartaoDialog
- Mesmas remocoes do NovoCartaoDialog
- Remover `CORES_PREDEFINIDAS`
- Remover campo `cor` do form state
- Nao enviar `cor` no `atualizarCartao()`

### 4. Atualizar todos os modais de cartao (13 arquivos)
Substituir `style={{ background: cartao.cor || "#6366f1" }}` por `className="bg-gradient-to-br from-violet-600 to-indigo-600"` nos headers de:

- DetalhesCartaoDialog.tsx
- NovaCompraCartaoDialog.tsx
- PagarFaturaDialog.tsx
- EditarCartaoDialog.tsx
- GerarMensagemDialog.tsx
- RegistrarAcertoDialog.tsx
- AdiantarFaturaDialog.tsx
- ExcluirCartaoDialog.tsx
- AjustarFaturaDialog.tsx
- EditarCompraDialog.tsx
- EstornarCompraDialog.tsx
- DetalhesCompraCartaoDialog.tsx
- ExcluirCompraDialog.tsx

### 5. Atualizar CartaoCard.tsx
- Substituir o uso de `corCartao` nos icones e elementos visuais por a cor padrao fixa
- Manter o card visualmente consistente com os modais

### 6. GerarMensagensLoteDialog.tsx
- Substituir o indicador colorido `cartao.cor` por a cor padrao

## Detalhes Tecnicos

### Arquivos modificados (16 total):

1. **NovoCartaoDialog.tsx** - Remover `CORES_PREDEFINIDAS`, seletor de cor, campo `cor` do form, atualizar preview
2. **EditarCartaoDialog.tsx** - Mesmo que acima + remover `cor` do estado e do `atualizarCartao()`  
3. **CartaoCard.tsx** - Trocar `corCartao` por cor fixa nos estilos
4. **DetalhesCartaoDialog.tsx** - Header: `className="bg-gradient-to-br from-violet-600 to-indigo-600"` sem `style`
5. **NovaCompraCartaoDialog.tsx** - Mesmo padrao de header
6. **PagarFaturaDialog.tsx** - Mesmo padrao
7. **GerarMensagemDialog.tsx** - Mesmo padrao
8. **RegistrarAcertoDialog.tsx** - Mesmo padrao
9. **AdiantarFaturaDialog.tsx** - Mesmo padrao
10. **ExcluirCartaoDialog.tsx** - Mesmo padrao
11. **AjustarFaturaDialog.tsx** - Mesmo padrao
12. **EditarCompraDialog.tsx** - Mesmo padrao
13. **EstornarCompraDialog.tsx** - Mesmo padrao
14. **DetalhesCompraCartaoDialog.tsx** - Mesmo padrao
15. **ExcluirCompraDialog.tsx** - Mesmo padrao
16. **GerarMensagensLoteDialog.tsx** - Indicador de cor fixo

### O que NAO muda
- O campo `cor` no banco de dados continua existindo (nao precisa de migracao)
- A funcionalidade dos modais permanece identica
- O layout e espacamento dos headers permanecem iguais

