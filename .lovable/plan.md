

# Refatorar sistema de categorias de despesas

## Visao geral

Duas frentes de trabalho: (1) criar um mapeamento built-in de palavras-chave por categoria para sugestao automatica em tempo real no formulario, e (2) reduzir as categorias padrao ao minimo essencial.

---

## 1. Mapeamento built-in de palavras-chave

Criar um arquivo `src/lib/category-keywords.ts` com um mapa de palavras-chave associadas ao nome de cada categoria essencial:

```text
Alimentacao: ifood, restaurante, mercado, padaria, lanche, pizza, burger, cafe, almoço, jantar, supermercado, hortifruti, açougue, feira
Transporte: uber, 99, gasolina, estacionamento, onibus, metro, pedagio, combustivel, posto, taxi, corrida
Moradia: aluguel, condominio, iptu, agua, luz, energia, gas, internet, telefone
Saude: farmacia, medico, consulta, exame, hospital, clinica, dentista, plano de saude, remedio, drogaria
Lazer: cinema, netflix, spotify, show, teatro, bar, festa, jogo, viagem, hotel, parque
Compras: roupa, tenis, sapato, loja, amazon, mercado livre, shopee, shein, magazine, eletronico
Educacao: faculdade, curso, escola, livro, apostila, mensalidade, matricula, material escolar
Outros: (fallback, sem keywords)
```

A funcao `findCategoryByKeywords(description: string, categories: Category[]): string | null` fara o match local (sem ir ao banco) comparando a descricao com as keywords e retornando o `category_id` da categoria cujo `name` corresponde.

---

## 2. Hook `useAutoCategory`

Criar `src/hooks/useAutoCategory.ts`:

- Recebe `description` (string) e `categories` (Category[])
- Usa `useEffect` com debounce de 300ms
- Primeiro tenta o mapeamento built-in (rapido, local)
- Se nao encontrar, tenta `findMatchingCategory` (regras personalizadas do usuario no banco)
- Retorna `{ suggestedCategoryId: string | null, isSuggestion: boolean }`

---

## 3. Integrar no formulario de transacoes (`src/pages/Transactions.tsx`)

### Campo de descricao: mover antes da categoria
- Trocar a ordem dos campos para que "Descricao" apareca antes de "Categoria"
- Tornar o campo de descricao obrigatorio visualmente (remover "opcional" do label)

### Logica de auto-sugestao
- Adicionar estado `isSuggested` (boolean) para indicar se a categoria foi sugerida automaticamente
- Quando `useAutoCategory` retorna uma sugestao e o usuario nao escolheu categoria manualmente, preencher `formData.category_id` e marcar `isSuggested = true`
- Se o usuario trocar manualmente, marcar `isSuggested = false`

### Indicador visual de sugestao
- Quando `isSuggested === true`, exibir um badge discreto "Sugestao automatica" ao lado do campo de categoria, com um icone de varinha magica (Sparkles do Lucide)
- Cor suave (ex: `text-blue-500 bg-blue-50`) para nao poluir a interface

---

## 4. Categorias padrao essenciais

Nao sera feita migracao destrutiva (nao vamos excluir categorias existentes dos usuarios). A mudanca sera:

- Atualizar o seed/criacao de categorias padrao para novos usuarios, limitando a 8 categorias de despesa:
  1. Alimentacao (utensils, #f59e0b)
  2. Transporte (car, #3b82f6)
  3. Moradia (home, #8b5cf6)
  4. Saude (heart, #ef4444)
  5. Lazer (gamepad, #ec4899)
  6. Compras (shopping-cart, #14b8a6)
  7. Educacao (graduation-cap, #0ea5e9)
  8. Outros (package, #64748b)

- Manter as categorias de receita existentes inalteradas

Usuarios existentes continuam com suas categorias atuais. A funcao de auto-sugestao funciona por nome, entao funciona com categorias existentes desde que tenham os nomes corretos.

---

## Resumo dos arquivos

| Arquivo | Acao |
|---|---|
| `src/lib/category-keywords.ts` | Novo - mapa de keywords por categoria |
| `src/hooks/useAutoCategory.ts` | Novo - hook de sugestao com debounce |
| `src/pages/Transactions.tsx` | Editar - reordenar campos, integrar auto-sugestao, badge visual |

Nenhuma alteracao de banco de dados necessaria. O mapeamento built-in funciona localmente sem queries adicionais.

