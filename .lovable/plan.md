

# Adicionar botao de voltar global no Layout

## Abordagem

Adicionar o botao diretamente no componente `Layout.tsx`, que ja envolve todas as paginas. Usar `useLocation` e `useNavigate` do React Router para detectar se estamos no dashboard e para navegar de volta.

## Regras de exibicao

- Ocultar quando a rota for `/dashboard` (pagina principal)
- Exibir em todas as outras rotas

## Implementacao

### Arquivo: `src/components/Layout.tsx`

1. Importar `useLocation` e `useNavigate` do `react-router-dom`, e `ChevronLeft` do `lucide-react`
2. Dentro do componente, obter `location` e `navigate`
3. Definir `isDashboard = location.pathname === "/dashboard"`
4. Adicionar o botao de voltar dentro da `<main>`, logo antes do `{children}`, dentro do `div.p-6`:

```text
Layout da main:
+------------------------------------------+
| [< Voltar]  (so aparece fora do dashboard)|
| {children}                                |
+------------------------------------------+
```

5. Estilo do botao:
   - `inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors`
   - `min-h-[44px] min-w-[44px]` para area de toque mobile
   - `text-sm` com `ChevronLeft` de 16px
   - `mb-3` para separar do conteudo abaixo
   - `cursor-pointer`
   - Sem background, sem borda

6. Acao: `onClick={() => navigate(-1)}` para voltar no historico do navegador

### Resultado esperado
- Botao discreto "Voltar" no canto superior esquerdo, antes do conteudo da pagina
- Nao aparece no dashboard
- Area de toque adequada no mobile (44x44px)
- Hover sutil em desktop
