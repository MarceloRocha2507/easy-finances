
<contexto>
Na tela “Importar Compras”, o fluxo atual está contraditório:

- O botão já mostra “Importar X compras” (onde X ignora duplicatas não-forçadas).
- Porém, ao clicar, a função <code>handleImportar()</code> bloqueia a importação se existir qualquer duplicata não-forçada e exige marcar manualmente as duplicatas com “Importar” (forçar).

Isso faz você “ser obrigado” a mexer nas duplicadas mesmo quando a intenção é justamente NÃO importá-las.</contexto>

<objetivo>
Permitir importar normalmente as compras “novas/seguras” e simplesmente IGNORAR as duplicadas por padrão, sem obrigar seleção manual. Mantendo a opção de “forçar” quando for falso-positivo.</objetivo>

<mudancas-planejadas>
<step>
1) Ajustar a regra de bloqueio no <code>handleImportar()</code> (não travar mais por duplicata não-forçada)
- Arquivo: <code>src/pages/cartoes/ImportarCompras.tsx</code>
- Alterar o trecho que hoje faz:
  - detecta <code>duplicatasNaoForcadas</code>
  - se &gt; 0 → mostra toast destrutivo e <b>return</b>
- Novo comportamento:
  - Continua fazendo a “verificação final” (checkpoint) com <code>verificarDuplicatas()</code> (isso é bom).
  - Calcula:
    - <code>comprasParaImportar = validas && (!duplicata || forçada)</code>
    - <code>duplicatasIgnoradas = validas && duplicata && !forçada</code>
  - Se <code>comprasParaImportar.length === 0</code>:
    - Mostrar toast: “Nada para importar (todas são duplicatas ou inválidas)”
    - Não chamar <code>importarComprasEmLote</code>
  - Se houver compras para importar:
    - Importa normalmente.
    - Mostra toast de sucesso informando também quantas duplicatas foram ignoradas (se houver).
</step>

<step>
2) Ajustar texto da mensagem de duplicatas para refletir o novo padrão (duplicatas serão ignoradas, não bloqueadas)
- Arquivo: <code>src/pages/cartoes/ImportarCompras.tsx</code>
- Atualizar o <code>Alert</code> das duplicatas (linhas ~474-485) para algo como:
  “Duplicatas detectadas. Por padrão, elas serão ignoradas na importação. Se for um falso positivo, marque ‘Forçar’ na linha.”
Isso evita a sensação de que o sistema está exigindo a seleção.
</step>

<step>
3) Renomear o checkbox da coluna “Duplicata” para deixar explícito que é um override (não uma obrigação)
- Arquivo: <code>src/pages/cartoes/ImportarCompras.tsx</code>
- Trocar o label “Importar” por “Forçar” ou “Importar mesmo assim”.
- (Opcional) Ajustar tooltip para: “Permite importar mesmo sendo detectada como duplicata”.
</step>

<step>
4) (Opcional, mas recomendado) Tornar o toast de “Duplicatas ignoradas” informativo (não destrutivo)
- Quando existirem duplicatas não-forçadas, usar toast neutro (ou warning) antes/depois da importação:
  “X duplicata(s) foram ignoradas. Marque ‘Forçar’ se quiser importar mesmo assim.”
Assim você tem feedback claro do que aconteceu sem bloquear.
</step>
</mudancas-planejadas>

<criterios-de-aceite>
1) Se houver duplicatas não-forçadas, ainda assim consigo importar as compras não-duplicadas (sem clicar em nenhuma duplicada).
2) As duplicatas não-forçadas não são importadas.
3) Se eu quiser importar uma duplicada (falso positivo), marco “Forçar” na linha e ela entra normalmente.
4) Se todas as linhas forem duplicadas, o sistema não “trava pedindo seleção”: ele apenas avisa “Nada para importar”.
</criterios-de-aceite>

<impacto-tecnico>
- Alterações apenas no frontend (sem mudanças de banco).
- Principal arquivo: <code>src/pages/cartoes/ImportarCompras.tsx</code>.
- A lógica de detecção de duplicatas em <code>src/services/importar-compras-cartao.ts</code> permanece a mesma (já está boa); o problema é o “bloqueio” no botão Importar.</impacto-tecnico>

<teste-manual-rapido>
1) Colar um lote com 10 linhas, sendo 3 duplicatas (não forçadas).
2) Processar dados → deve mostrar duplicatas.
3) Clicar “Importar X compras” → importa as não-duplicadas e avisa que 3 foram ignoradas.
4) Voltar, marcar “Forçar” em 1 duplicata e importar novamente → agora essa duplicata entra.
</teste-manual-rapido>
