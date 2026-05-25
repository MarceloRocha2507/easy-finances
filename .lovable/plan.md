# Leitura automática de comprovantes do cartão

Adicionar um fluxo opcional dentro do dialog "Nova Compra no Cartão" onde o usuário envia uma imagem do comprovante e a IA extrai automaticamente valor, estabelecimento e data, preenchendo os campos antes de salvar.

## Fluxo do usuário

1. Em `NovaCompraCartaoDialog`, no topo do formulário, adicionar um botão/área "📸 Ler comprovante (IA)".
2. O usuário:
   - Seleciona o **cartão** (já pré-selecionado pelo contexto do dialog).
   - Seleciona o **responsável** (campo existente).
   - Faz upload da imagem (JPG/PNG, até ~5 MB) — via input file ou drag-and-drop.
3. Ao enviar, mostramos um estado "Analisando comprovante..." (spinner).
4. A IA retorna: `valor_total`, `descricao` (estabelecimento) e `data_compra`.
5. Os campos do formulário são preenchidos automaticamente; o usuário revisa, ajusta categoria/parcelas se quiser e clica **Salvar** normalmente. Nenhum dado é persistido até o submit manual.
6. Se a IA falhar ou não identificar campos, mostramos toast amigável e mantemos o formulário em branco para preenchimento manual.

## Implementação técnica

### 1. Edge Function `analisar-comprovante-cartao`
- Nova função em `supabase/functions/analisar-comprovante-cartao/index.ts`.
- Recebe `{ imageBase64: string, mimeType: string }`.
- Valida JWT, CORS, tamanho da imagem.
- Chama Lovable AI Gateway com `google/gemini-2.5-flash` (multimodal, suporta imagem + texto, custo baixo).
- Usa structured output (JSON schema) para garantir resposta no formato:
  ```json
  { "valor": number, "estabelecimento": string, "data": "YYYY-MM-DD", "confianca": "alta"|"media"|"baixa" }
  ```
- System prompt em PT-BR instruindo a extrair dados de comprovantes/recibos/notas de cartão de crédito brasileiros (formato R$, datas DD/MM/AAAA).
- Trata erros 429 (rate limit) e 402 (créditos) com mensagens claras.

### 2. Frontend — `NovaCompraCartaoDialog.tsx`
- Novo bloco no topo do form: card discreto com ícone de câmera, texto "Ler comprovante automaticamente" e input `type="file" accept="image/*"`.
- Estado local: `analisando`, `imagemPreview`.
- Ao selecionar arquivo:
  - Converte para base64 (FileReader).
  - Chama `supabase.functions.invoke('analisar-comprovante-cartao', { body: { imageBase64, mimeType } })`.
  - Preenche `valor`, `descricao` e `dataCompra` com os dados retornados.
  - Mostra toast de sucesso ("Dados preenchidos — revise antes de salvar") ou erro.
- Mostra miniatura da imagem enviada com botão X para remover.
- Não bloqueia o fluxo manual: usuário pode ignorar a área de upload.

### 3. Configuração
- `supabase/config.toml` já gerencia `verify_jwt`. Função será deploy automático.
- Sem necessidade de novos secrets (LOVABLE_API_KEY já existe).
- Sem migrations de banco — não persistimos a imagem nem o histórico de análises.

## Fora de escopo

- Persistir a imagem do comprovante (apenas leitura efêmera em memória).
- Categorização automática via IA (será preenchida manualmente; auto-categorização por keywords existente continua funcionando ao digitar descrição).
- Bulk upload de várias imagens.
- OCR de faturas inteiras (já existe fluxo separado em `ImportarCompras`).

## Arquivos afetados

- **Criado**: `supabase/functions/analisar-comprovante-cartao/index.ts`
- **Editado**: `src/components/cartoes/NovaCompraCartaoDialog.tsx`
