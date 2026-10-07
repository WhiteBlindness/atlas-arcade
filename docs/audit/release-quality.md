# Auditoria de qualidade da versão: Atlas Arcade

Data: 08/10/2026. Ramo: `fix/release-quality-audit`.

## Estado da versão

As correções de interface, os testes de regressão e a documentação reforçam o produto público. A versão continua condicionada pela base de dados remota, pelos dados do responsável e pelas permissões de alguns conteúdos. As migrações de expansão e bloqueio de saldos foram testadas numa base isolada; nenhuma foi aplicada em produção. O site publicado mantém a versão de `master` indicada abaixo.

## Repositório e produção

A referência de `master` e a versão de produção confirmada pela Vercel são `ead184e81a64b812208dc2088add4dcc96a0b09e`. A implantação está pronta e usa a região `iad1`. Não havia pedidos de revisão abertos no início desta auditoria.

As páginas de privacidade, cookies, condições e créditos não existiam em `master` nem foram encontradas no histórico Git consultado. Existiam na cópia local, em alterações não registadas. Este ramo acrescenta `/privacy`, `/cookies`, `/terms` e `/credits` com ligações no rodapé e informação junto da autenticação.

## Erro confirmado nos cartões

O componente `src/components/ui/GameCard.tsx` associava a cor de fundo da ação à sua própria cor de texto através de `group-hover:bg-current`. No tema escuro, o fundo passava a ter a cor do texto. No tema claro, `light:text-white` podia tornar ambos brancos. O erro afetava o padrão partilhado, incluindo Urban Legends.

A ação usa agora um fundo explícito definido pelo tema do jogo e uma cor de texto contrastante. Título, descrição e pontuação mantêm cores estáveis. Os mesmos estados visuais estão disponíveis através do foco de teclado. O estado pressionado não aplica um filtro de brilho que altere os rácios de contraste.

As medições de antes/depois, os estados abrangidos e os valores mínimos estão em [verificação no navegador](browser-regression.md). O teste usa cores calculadas pelo navegador, composição de transparências e filtros; as capturas de ecrã complementam as asserções.

## Interface e acessibilidade

A interface mantém a identidade de recreativa, os tipos de letra e as cores de cada jogo. As correções abrangem cartões, faixa Atlas Jackpot, cabeçalho, diálogos e ações partilhadas de resultado. Os controlos recebem nomes acessíveis, foco visível e áreas de toque maiores onde necessário.

Os diálogos partilham uma gestão de foco que fecha apenas o diálogo superior com Escape e restitui o foco ao elemento anterior. O formulário de autenticação permite deslocação vertical em ecrãs baixos. Tectonic Snap dispõe de colocação de peças com teclado; Skyline Silhouette permite indicar coordenadas sem usar o rato. A declaração do idioma acompanha a seleção do utilizador.

Os efeitos de intermitência mantêm as etiquetas visíveis. A preferência por movimento reduzido suprime animações decorativas e a interpolação do zoom do globo. As barras funcionais de contagem decrescente mantêm a duração real; a alteração da câmara do globo foi confirmada no código, sem uma asserção do seu estado interno no navegador. Estes controlos não certificam conformidade WCAG de toda a aplicação nem garantem ausência de risco fotossensível em todas as combinações de efeitos.

Os testes abrangem os temas escuro e claro, computador de 1 440 × 900, telemóvel de 390 × 844, largura de 320 e ecrã de 700 × 480. [Auditoria de acessibilidade](visual-accessibility.md) e [testes no navegador](browser-regression.md) delimitam os percursos verificados, os resultados axe e as limitações.

## Lista de verificação de confiança

| Item | Classificação | Resultado ou condição |
|---|---|---|
| Contraste das cores | APPLICABLE | Cores explícitas e testes dos estados dos cartões nos dois temas. |
| Texto alternativo nas imagens | APPLICABLE | Conteúdo relevante recebe nome; fundos e ícones decorativos não recebem descrições redundantes. |
| Política de reembolso de compras | NOT APPLICABLE | Não existem compras, subscrições ou conversão monetária. |
| Política de privacidade | APPLICABLE | Página acrescentada; identidade, contacto, fundamentos e retenção dependem do responsável. |
| Correções de acessibilidade | APPLICABLE | Foco, diálogos, formulários, movimento, mapas e testes de regressão. |
| Remover avaliações falsas | NOT APPLICABLE | Não existe uma funcionalidade de avaliações ou testemunhos. |
| Condições de utilização | APPLICABLE | Página acrescentada com regras de contas, pontuações e fichas sem valor monetário. |
| Conteúdos e serviços externos | APPLICABLE | Inventário de destinatários, finalidades e implicações de pedidos no navegador. |
| Direitos sobre as imagens | LEGAL REVIEW | Créditos por ficheiro; 186 registos Wikimedia condicionais, sem autorização desconhecida. |
| Política de cookies | APPLICABLE | Página descreve autenticação e as quatro chaves de armazenamento local. |
| Verificar seguimento | APPLICABLE | O teste público identificou WMF-Uniq em imagens externas. Os pedidos de fotografias e o pré-carregamento passam a usar CORS sem credenciais. |
| Consentimento nos formulários | LEGAL REVIEW | Ligações para as políticas; sem caixas de consentimento sem finalidade. Fundamentos jurídicos por definir. |
| Regras locais | LEGAL REVIEW | Fontes portuguesas e europeias no relatório de privacidade; sem alegação de certificação. |
| Etiquetas claras dos botões | APPLICABLE | Ações nomeadas; removidas promessas de publicidade e recompensas sem suporte. |
| Consentimento para armazenamento | LEGAL REVIEW | Exceções de necessidade estrita por confirmar; preferências e convites precisam de decisão específica. |
| Dados reais do responsável | OWNER DECISION | Não foram inventados identidade, endereço, contacto ou lei aplicável. |
| Recolher apenas o necessário | APPLICABLE | Inventário das contas e pontuações; removido o envio do identificador de conta ao fornecedor de avatares. |
| Formulários com teclado | APPLICABLE | Foco, Escape, navegação entre campos e deslocação em ecrãs pequenos. |
| Remover afirmações sem suporte | APPLICABLE | Removidos percentis inventados, prémios calculados no cliente e alegações gerais de acessibilidade. |

## Privacidade e dados

O código usa quatro chaves de `localStorage`: `atlas-arcade-settings`, `atlas-arcade-daily`, `atlas-arcade-guest-tokens` e `atlas-arcade-ref`. Não foi encontrado uso próprio de `sessionStorage` ou IndexedDB. A autenticação Supabase usa cookies através do cliente SSR; o teste sem autenticação não estabelece as características dos cookies de uma sessão com conta.

As contas usam email, credenciais de autenticação, identificador, nome escolhido, pontuações, saldos e associação de convites. As respostas da ronda ficam na memória; os resultados diários ficam no navegador e as pontuações de contas são enviadas à base de dados. Não há um prazo de retenção completo documentado para contas, registos técnicos ou cópias de segurança.

Os pedidos podem chegar à Supabase, à Google quando se escolhe essa autenticação, à jsDelivr, à FlagCDN, à Wikimedia e à OpenTDB. A Vercel aloja a aplicação. Os fornecedores recebem os metadados normais dos pedidos; os URLs de mapas e imagens não incluem o identificador da conta. A imagem de perfil usa agora um ícone local.

O teste público identificou o cookie externo `WMF-Uniq` após carregar uma fotografia. A Wikimedia associa-o a medição, testes e segurança. As fotografias e o pré-carregamento deste ramo usam `crossOrigin="anonymous"`: o teste de regressão confirma que não enviam cookies existentes nem guardam novos cookies do fornecedor. Os metadados de rede continuam a chegar ao alojamento da imagem.

Não foi acrescentada uma faixa genérica de consentimento. O artigo 5.º da Lei n.º 41/2004, na redação da Lei n.º 46/2012, exige consentimento prévio informado, salvo as exceções previstas para transmissão de comunicações ou necessidade estrita de um serviço solicitado. A aplicabilidade dessas exceções a cada chave continua por decidir. As preferências e a persistência de convites exigem uma avaliação específica. Ver [inventário e fontes jurídicas](privacy-data.md).

## Saldos, pontuações e confiança

Os convidados mantêm o saldo no navegador; este não tem valor numa conta. As contas passam a consumir e atualizar fichas por funções da base de dados, com relógio do servidor, bloqueio da linha e consumo das fichas diárias antes das premium. A fase B revoga escritas diretas conhecidas, depois da publicação e adoção do cliente novo, e protege as funções com a identidade da sessão.

O resgate de convites ignora o prémio indicado pelo cliente, aceita códigos antigos em minúsculas e impede duplicações sem distinguir maiúsculas. A migração deteta colisões antes de alterar permissões. As pontuações aceitam apenas jogos conhecidos e valores inteiros limitados, mas continuam a ser declaradas pelo navegador. Não existe validação de todas as respostas no servidor.

Os resultados do Atlas Jackpot não autorizam prémios premium numa conta. As devoluções de fichas após falhas de carregamento só são anunciadas quando uma ficha local foi reposta. Uma devolução segura a contas exige prova do consumo e da tentativa. Os pedidos de consumo simultâneos são bloqueados para impedir cobranças repetidas de uma só partida. A perda da resposta após um débito continua ambígua, porque não há identificador persistente de tentativa nem devolução verificável para contas.

A versão do cliente exige as novas funções. A expansão deve preceder a publicação do cliente; o bloqueio só sucede à sua adoção verificada. Até B, master conserva as escritas antigas. A remoção da própria conta usa a identidade da sessão e relações em cascata; falhas impedem remoção parcial. Nenhuma fase foi aplicada em produção. Ver [procedimento e recuperação](supabase-rollout.md), [validação Supabase](remote-supabase-validation.md) e [segurança](security-trust.md).

## Conteúdos e direitos

O inventário contém 229 referências de fotografias nos conjuntos de dados, correspondentes a 219 ficheiros Wikimedia únicos. As 73 fotografias de cidades servem dois jogos; por isso, o total de utilizações nos três jogos é 302. Foram identificados 33 ficheiros verificados, 186 condicionais e nenhum desconhecido. Foi substituída uma única fotografia.

A fotografia `Lake Baikal.jpg` foi substituída por `Lake Baikal, Russia.jpg`, de Vyacheslav Argenberg, com licença CC BY 4.0. A indicação de ausência de restrições conhecidas do ficheiro anterior não estabelecia uma licença afirmativa. Os registos condicionais incluem atribuição, ligações às licenças, partilha nos mesmos termos e possíveis direitos adicionais sobre emblemas, património, marcas ou pessoas.

A página de créditos apresenta autores, fontes, licenças e condições por ficheiro. O conjunto de dados dos países tem um exemplar público e avisos ODbL/MIT. Fontes, ícones, mapas e identidade Google têm os avisos ou regras próprios. Ver [proveniência](../asset-provenance.md) e [auditoria de licenças](asset-licensing.md).

## Afirmações do produto

O texto de partilha e os resultados mostram a pontuação real, sem uma percentagem de jogadores supostamente ultrapassados. A interface não promete anúncios inexistentes nem prémios de conta baseados em resultados calculados no navegador. A documentação descreve os 11 jogos, o modo diário, a recreativa e o desafio Atlas Jackpot, sem inventar dimensão da audiência, exatidão dos dados ou conformidade jurídica.

## Segurança

A atualização compatível usa Next.js 16.3.6 e React/React DOM 19.2.8. Foram removidas as dependências MapLibre e react-map-gl sem implementação ativa correspondente. A auditoria das dependências de execução deste ramo não apresenta avisos; a auditoria completa identifica um aviso único de gravidade alta em `braces`, propagado por cinco pacotes de desenvolvimento, sem correção compatível disponível na análise.

O lockfile de `master`, que corresponde ao código publicado, mantém sete pacotes afetados nas dependências de execução: dois críticos, quatro altos e um moderado. Não foi demonstrada a exploração desses avisos nesta implantação. As correções de dependências deste ramo ainda não estão publicadas.

Os redirecionamentos de autenticação aceitam apenas percursos da mesma origem. A confirmação valida o tipo e a dimensão do token. A tarefa periódica exige um segredo Bearer configurado, falha de forma fechada e devolve erros genéricos.

Os cabeçalhos acrescentam `nosniff`, proibição de enquadramento e política de referência. A CSP é apenas de relatório, sem destino central de relatórios configurado; não bloqueia scripts. Não existe um limitador global explícito de pedidos nas rotas analisadas. A cache da classificação reduz chamadas, mas não equivale a esse limite. Ver [segurança e condições de implantação](security-trust.md).

## Site publicado e desempenho

A verificação pública usa uma sessão limpa e percursos sem escrita de dados de contas. O relatório do navegador regista hidratação, temas, classificação, mapa, imagem externa, erros, cookies e armazenamento observados. O resultado pertence à versão de produção indicada; não prova que as correções deste ramo estejam publicadas.

Os componentes dos jogos carregam de forma diferida; o renderizador do globo está separado do seletor inicial. O manifesto completo dos créditos também carrega apenas na página correspondente. Peaks & Valleys pré-carrega a fotografia da comparação seguinte durante a ronda atual. As respostas usam os dados já disponíveis; não foi introduzida uma consulta para decidir o resultado no instante da revelação. A latência de imagens e mapas continua dependente da ligação e dos fornecedores. Não há medições de utilização real que sustentem uma promessa geral de desempenho.

## Validação e revisão

A instalação limpa (`npm ci`), a análise de tipos, a verificação de estilo e a compilação passaram. Os testes unitários passaram 28/28; os testes reais PostgreSQL passaram 16/16, incluindo concorrência e falha atómica de remoção; o percurso autenticado numa base isolada passou; os testes locais de navegador passaram 39/39; a sessão pública passou 1/1. O axe não encontrou violações nos percursos abrangidos. Foram revistas as quatro capturas de ecrã dos temas, da passagem do rato e do telemóvel. Três fotografias reais carregaram sem cookies do fornecedor.

A auditoria de execução apresenta zero avisos; a auditoria completa mantém cinco pacotes de desenvolvimento afetados por um único aviso alto em `braces`. A cobertura medida das funções puras selecionadas não representa cobertura global da aplicação.


A matriz executou master e PR na mesma base anterior, após A e após A+B. Master passou antes e após A; o PR passou após A e A+B. As duas combinações não suportadas falharam como esperado: função ausente para o PR anterior e escritas diretas 403 para master após B. Métodos, saldos e condições estão no [procedimento faseado](supabase-rollout.md).

## Decisões necessárias

1. Aprovar A separadamente, repetir as verificações prévias e confirmar master depois da expansão. Publicar o cliente apenas após esse ensaio; aprovar B só depois da adoção verificada e da preparação de recuperação por funções remotas. O ramo mantém a publicação automática Vercel desativada. Ver [procedimento faseado](supabase-rollout.md).
2. Fornecer identidade e contacto público do responsável e definir fundamentos jurídicos, retenção, regras de idade e exercício de direitos. Definir a retenção de registos e cópias de segurança, que não é resolvida pela remoção das linhas da conta.
3. Obter a decisão jurídica sobre preferências e persistência de convites; implementar a escolha necessária ou remover a persistência se não existir exceção aplicável.
4. Cumprir as condições de atribuição, adaptações e direitos adicionais nos registos condicionais. A imagem de Baikal sem licença afirmativa já foi substituída.

Estas condições impedem declarar a versão integralmente preparada para publicação.
