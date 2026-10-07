# Verificação no navegador

Data: 07/10/2026. Navegador: Chromium através de Playwright 1.63. Não foi usado o Chrome nativo. O código local e o site publicado foram verificados separadamente.

## Cartões: erro e correção

Em produção, a ação de Urban Legends apresenta contraste de 1,000:1 ao passar o rato nos dois temas: magenta sobre magenta no escuro e branco sobre branco no claro. A causa é `group-hover:bg-current` em `GameCard.tsx`, combinada com a cor de texto herdada. A correção define o fundo pela variável do jogo e o texto por um valor contrastante.

A execução local recolheu 259 amostras por tema nos onze cartões e na faixa Atlas Jackpot, nos estados normal, passagem do rato, foco, foco com passagem do rato e pressionado. Mínimos: 4,645:1 no escuro e 4,588:1 no claro; zero falhas. Os estados bloqueado e em breve são renderizados a partir do componente real e inseridos no navegador com os estilos da aplicação. Foram medidas mais 192 amostras de texto por tema, nos doze conjuntos de cores, em repouso e com passagem do rato. Mínimos de 4,645:1 e 4,588:1, sem falhas; os ícones atingem pelo menos 3:1. As asserções verificam também o estado desativado e a presença ou ausência da pontuação pessoal. Não são estados publicados dos onze jogos atuais.

O contorno de foco do cabeçalho apresentou rácios entre 7,667:1 e 15,744:1. O texto de autenticação pendente mantém 15,380:1 no escuro e 5,893:1 no claro ao passar o rato. O botão Google carrega Google Sans 500 local, com tamanho 14 px, linha 20 px, intervalo 10 px e altura mínima 44 px.

## Percursos locais

Passaram 39/39 testes: 23 de percursos e 16 visuais/de acessibilidade. Incluem uma ronda diária Urban Legends com seis respostas, resultado e regresso à grelha; início como convidado e consumo de uma ficha; respostas de consumo atrasadas, duplicação de cliques, erros e regresso ao seletor; idioma do documento; classificação; tutorial e diálogo de fichas aninhados; foco e Escape; colocação de peças Tectonic Snap com teclado; coordenadas Skyline e resultado; políticas e créditos.

Os dados de autenticação e saldo são controlados nos testes locais. Isto não verifica as funções remotas Supabase nem a sessão real de uma conta. A migração é verificada separadamente numa base PostgreSQL isolada.

O axe-core não encontrou violações WCAG 2.2 A/AA nos percursos abrangidos: página inicial nos dois temas, autenticação, tutorial aninhado, classificação e quatro páginas de serviço. As medições esperam pelo fim das transições de entrada. Não houve teste manual com leitor de ecrã nem cobertura de todos os estados de todos os jogos.

Ecrãs: 1 440 × 900, 390 × 844, 320 × 700 e 700 × 480; formulário de autenticação também em 320 × 480. As quatro capturas finais foram revistas: página inicial escura, clara, Urban Legends com passagem do rato e página móvel. Não foi observada sobreposição ou deslocação horizontal nos percursos testados.

Movimento reduzido elimina animação decorativa e preserva a barra funcional de 7 segundos de Capital Strike. O zoom sem interpolação do globo foi revisto no código; o ensaio não mede o estado interno da câmara 3D.

## Imagens e armazenamento externo

O teste de regressão começa com um cookie de fornecedor e devolve uma imagem que tenta criar outro. Com CORS anónimo, a fotografia carrega, o cookie existente não é enviado e o novo não é guardado. A implementação abrange Urban Legends, Skyline Silhouette, Peaks & Valleys e o pré-carregamento de Peaks.

Três fotografias reais do fornecedor foram carregadas numa página da origem local: todas com largura de 960 px, três pedidos sem cookies e nenhum cookie criado. Esta amostra confirma compatibilidade com o fornecedor; não verifica disponibilidade permanente dos 219 ficheiros.

## Site publicado

A sessão pública limpa em https://atlasarcade.app passou 1/1. A página hidratou, os temas e a classificação responderam, o mapa SVG tinha geometria, o globo criou um canvas visível de dimensão positiva, e as fotografias carregaram. O teste não estabelece a correção de cada píxel WebGL. Não houve erros de consola ou página nem pedidos que alterassem contas ou pontuações.

Foram observados apenas atlasarcade.app, cdn.jsdelivr.net e upload.wikimedia.org neste percurso. Dois pedidos de mapas e dois de fotografias devolveram HTTP 200. Não foram encontrados pedidos aos domínios de publicidade/análise explicitamente enumerados no teste; essa lista não cobre todos os fornecedores possíveis.

O contexto começou sem cookies e terminou com WMF-Uniq, da Wikimedia, seguro e SameSite=None. A [política da Wikimedia](https://foundation.wikimedia.org/wiki/Policy:Cookie_statement) atribui-lhe medição, testes e proteção contra ataques, com duração de 365 dias atualizada semanalmente. Este cookie continua observável na versão publicada; a correção deste ramo ainda não foi publicada. O armazenamento local observado continha preferências e fichas de convidado; sessionStorage estava vazio. Não foi feita autenticação real nem inventário dos cookies de uma conta.

## Desempenho observado

| Fase em produção | JavaScript descodificado adicional | Transferência observada |
|---|---:|---:|
| Página inicial | 887 117 bytes | 262 475 bytes |
| Tectonic Snap | 73 513 bytes | 24 711 bytes |
| Globo Skyline | 2 065 523 bytes | 586 637 bytes |

O maior ficheiro acrescentado pelo globo tem 1 665 496 bytes descodificados. O carregamento diferido evita esse custo inicial, mas o primeiro jogo com globo tem um custo relevante. Estes valores pertencem ao código de produção, ao navegador e à ligação usados; não representam Core Web Vitals nem uma promessa de desempenho.

O teste público carrega a imagem antes de sair sem responder. Não mede a latência da revelação. A ausência de consultas novas no instante de decidir a resposta e o pré-carregamento da ronda seguinte foram confirmados no código.

## Verificações complementares

Instalação limpa, análise de tipos, estilo e compilação aprovados. Testes unitários: 22/22. Auditoria das dependências de execução: zero avisos; auditoria completa: um aviso alto único em braces, propagado por cinco pacotes de desenvolvimento. O detetor Impeccable registou zero achados principais e cinco avisos de cores literais no âmbito analisado.

Os testes e critérios estão em tests/e2e/core-flows.spec.ts, tests/e2e/visual-accessibility.spec.ts e tests/e2e/live-smoke.spec.ts. As capturas e os resultados detalhados são artefactos locais ignorados pelo Git em test-results.
