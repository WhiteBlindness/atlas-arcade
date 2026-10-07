# Auditoria visual e de acessibilidade

Data: 07/10/2026.

## Âmbito e método

A verificação automatizada abrange a página inicial, os onze cartões de jogo, a faixa Atlas Jackpot, o cabeçalho, as caixas de diálogo de autenticação, seleção de modo, tutorial e classificação, as páginas de privacidade, condições, cookies e créditos, e estados representativos de jogo. Os ensaios no navegador usam Playwright e axe-core. Não incluem uma avaliação manual com leitores de ecrã.

## Contraste e estados visuais

O ensaio recolheu 259 amostras de contraste por tema nos onze cartões de jogo e na faixa Atlas Jackpot. Cada superfície passou pelos estados normal, passagem do rato, foco, foco com passagem do rato e pressionado. Não houve falhas. O rácio mínimo medido foi 4,645:1 no tema escuro e 4,588:1 no tema claro. O teste exige 4,5:1 para texto e 3:1 para ícones e contornos de foco; não registou falhas em nenhum dos elementos medidos.

A correção mantém as cores de identidade dos jogos, mas evita tingir o fundo da ação com a mesma cor do texto. Os estados de foco e pressão preservam o contraste. O CTA muda de fundo de forma explícita e usa texto contrastante. O relatório de foco mede os contornos após converter a cor Lab corretamente. Os rácios registados variaram entre 7,667:1 e 15,744:1 nos controlos do cabeçalho, acima do limiar de 3:1 do ensaio.

## Teclado, diálogos e tamanhos de ecrã

Os onze cartões e Atlas Jackpot têm nomes acessíveis estáveis. Os controlos do cabeçalho têm nomes, foco visível e áreas de interação com pelo menos 24 × 24 px no ensaio. Os controlos de toque acrescentados ou revistos usam uma altura mínima de 44 px.

As caixas de diálogo mantêm o foco dentro da caixa ativa. Escape fecha apenas a caixa superior. O foco regressa ao acionador anterior quando este continua focável; em diálogos aninhados, caso contrário, regressa a um controlo ativo da caixa anterior. A autenticação permite deslocação vertical e mantém os campos e o botão de envio acessíveis num ecrã de 320 × 480 px. Os ensaios de largura verificam 1 440 × 900, 390 × 844, 320 × 700 e 700 × 480 px.

Tectonic Snap permite selecionar e colocar peças com as teclas Enter, Espaço, setas e Escape. Skyline Silhouette permite introduzir coordenadas e colocar um marcador sem usar o rato. Os ensaios verificam a alteração da posição no mapa e o percurso até ao resultado normal.

Durante um pedido de autenticação, o formulário expõe `aria-busy` e anuncia a mensagem localizada de espera através de `role=status`. Os campos e o botão mantêm opacidade integral. Um ensaio reteve a resposta do servidor e mediu o contraste do estado de carregamento ao passar o rato: 15,380:1 no tema escuro e 5,893:1 no tema claro. Depois confirmou a recuperação do formulário e o fecho com Escape.

O botão de autenticação Google carrega localmente Google Sans 500, com texto de 14 px, linha de 20 px, intervalo de 10 px e altura mínima de 44 px. O ensaio confirma a fonte carregada e estes valores calculados pelo navegador.

## Movimento reduzido

Com `prefers-reduced-motion`, a interface remove o piscar decorativo, as transições de entrada, o efeito de cintilação do fundo e as animações decorativas de brilho, rotação, desvanecimento e deslocação. As transições ficam praticamente imediatas. O indicador temporal de Capital Strike mantém a duração funcional de 7 segundos; encurtá-la faria o tempo terminar visualmente antes do fim real.

O globo 3D ativo define a duração do movimento de câmara como zero quando o sistema pede movimento reduzido. Este comportamento foi confirmado no código, mas não foi exercitado num ensaio visual de navegador com WebGL. O componente SVG antigo `WorldMap.tsx` não participa no percurso ativo e não foi contado como cobertura.

## Resultados e limites

A execução final terminou com 37 testes locais aprovados em 37, incluindo 14 testes visuais e de acessibilidade. Incluiu medições de contraste nos dois temas, verificações axe-core da página inicial escura e clara, autenticação, tutorial aninhado, classificação e páginas de serviço, foco de teclado, ecrã curto, tipografia Google e capturas de ecrã. O ensaio de movimento reduzido, repetido após incluir as animações utilitárias de Peaks and Valleys, passou 1 em 1. O ensaio adicional do estado de autenticação pendente passou 1 em 1 e cobriu os dois temas.

A execução axe-core usa os critérios WCAG 2.2 A/AA selecionados no teste. Estes resultados não demonstram conformidade WCAG de toda a aplicação. Não cobrem todos os estados de jogo, todas as combinações de contraste, nem substituem testes manuais com leitores de ecrã. O movimento funcional da barra temporal e o comportamento 3D no navegador mantêm as limitações descritas acima.

O detetor estático Impeccable 4.5 registou zero achados principais e cinco avisos sobre cores literais. Esses avisos não equivalem a falhas de contraste; as medições diretas do navegador são a referência para os estados abrangidos.

Os ensaios e respetivos critérios estão em `tests/e2e/visual-accessibility.spec.ts` e `tests/e2e/core-flows.spec.ts`.
