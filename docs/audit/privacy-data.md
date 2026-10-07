# Auditoria de privacidade e dados

Data do inventário: 07/10/2026. A informação pública completa exige decisões do responsável e revisão jurídica.

O relatório abrange o código, os metadados da versão Vercel publicada em `iad1` e a consulta sem alterações do catálogo Supabase em `eu-west-1`. A [validação Supabase](remote-supabase-validation.md) descreve as funções, relações e permissões remotas e os testes autenticados numa base isolada. Os contratos, os cookies de sessões autenticadas em produção, os registos técnicos e as cópias de segurança não foram inspecionados.

## Inventário de dados

| Dados ou armazenamento | Utilização e destinatário | Retenção e decisão pendente |
|---|---|---|
| Email, credencial, identificador e sessão | Supabase Auth; Google apenas quando se escolhe essa autenticação. Registo, entrada e recuperação de palavra-passe. | Configuração e retenção não fornecidas. Confirmar nomes, âmbito, atributos e duração dos cookies de produção. Avaliar separadamente o fundamento RGPD. |
| Nome e perfil | `profiles`: identificador, nome, data de criação, código e associação de convite e indicador de administrador. A migração acrescenta a marca de resgate já realizado. | Retenção por definir. A classificação pública devolve apenas nome e pontuação; explicar essa visibilidade antes do registo. |
| Recordes | `high_scores`: conta, jogo, pontuação e data. O cliente do PR envia-os pela função protegida `arcade_submit_high_score`. | Retenção e finalidade por definir. A escrita na base não constitui armazenamento no dispositivo. |
| Fichas diárias e premium | `user_coins`: saldo e datas de regeneração associados à conta. O saldo de convidados é local. | Retenção e fundamento por definir. Não foi encontrado um percurso de compra. |
| Idioma, tema e som | `atlas-arcade-settings` em `localStorage`, após alterar uma preferência. | Sem prazo de expiração na aplicação. Não existe uma escolha separada de consentimento para armazenamento. |
| Resultados diários e sequência | `atlas-arcade-daily` em `localStorage`: dia, pontuação, desempenho, partilha e sequência. | O código ignora resultados antigos, mas não garante a sua remoção. Sem prazo fixo. |
| Saldo de convidado | `atlas-arcade-guest-tokens` em `localStorage`: saldo e datas de regeneração. | Sem prazo fixo; depende do navegador. |
| Convite pendente | `atlas-arcade-ref` guarda o código de `?ref=`; o parâmetro sai depois do URL. A Supabase recebe o código no resgate. | Remove-se após resposta definitiva e conserva-se após erro de transporte. Sem expiração nem escolha separada de consentimento. |
| Imagem de perfil | Ícone local no diálogo de perfil. | Não há pedido externo com o identificador da conta. |
| Mapas e bandeiras | Geometria world-atlas na jsDelivr e imagens na FlagCDN. | Retenção dos fornecedores por confirmar. Os URLs não contêm dados de conta, mas os fornecedores recebem metadados de rede. |
| Perguntas | Border Blitz consulta OpenTDB; pode incluir um token de sessão do próprio serviço. | Confirmar termos e retenção. O código envia parâmetros do jogo, não o identificador da conta. |
| Fotografias | Wikimedia Commons e outros alojamentos do manifesto. Fotografias e pré-carregamento usam CORS anónimo. | Não enviam o identificador da conta nem cookies entre origens; os metadados de rede continuam a chegar aos fornecedores. |
| Registos técnicos | As rotas de autenticação registam mensagens genéricas para exceções inesperadas. A classificação e a tarefa periódica devolvem erros genéricos. | Confirmar os campos, o acesso, a retenção e a eliminação nos registos Vercel e Supabase. |
| Partilha por área de transferência | Texto do resultado copiado após ação explícita. | Controlado pelo dispositivo; nenhum endpoint da aplicação recebe o texto no código consultado. |

## Armazenamento e consentimento

Não foram encontrados SDKs de análise, etiquetas publicitárias, píxeis de marketing, uso próprio de `sessionStorage` ou IndexedDB. A análise do código não exclui scripts acrescentados pela configuração do alojamento.

O artigo 5.º da Lei n.º 41/2004, na redação da Lei n.º 46/2012, estabelece como regra o consentimento prévio baseado em informação clara e completa, incluindo as finalidades, para armazenamento ou acesso no equipamento. Prevê exceções para a transmissão de uma comunicação e para o que seja estritamente necessário a um serviço expressamente solicitado. Esta auditoria técnica não confirma uma exceção para qualquer funcionalidade. As orientações finais 2/2023 do Comité Europeu para a Proteção de Dados tratam o âmbito técnico; a avaliação das exceções depende do caso e do direito nacional.

| Item | Decisão necessária |
|---|---|
| Cookies de autenticação | Confirmar a finalidade, as propriedades e a duração em produção. Avaliar a necessidade estrita do serviço solicitado. |
| Resultados diários e fichas de convidados | Avaliar cada armazenamento face ao artigo 5.º, n.º 2. Se não houver exceção nem consentimento válido, obter consentimento prévio ou alterar a persistência. |
| Preferências | Confirmar se a informação e a interação de escolha fornecem consentimento válido ou se existe uma exceção específica. |
| Convites | Abrir uma ligação não demonstra, por si só, necessidade estrita de persistência. Avaliar a finalidade e a interação; alterar a persistência se não existir uma base adequada. |
| Análise e publicidade | Nenhuma integração encontrada. Reavaliar se forem introduzidas etiquetas ou serviços deste tipo. |

Não foi acrescentada uma faixa genérica de consentimento sem uma finalidade de armazenamento definida.

## Decisões do responsável e revisão jurídica

| Item | Estado e ação necessária |
|---|---|
| Identidade, contacto e estabelecimento | Identificar a pessoa ou entidade responsável, o endereço, o país de estabelecimento e o contacto de privacidade. Não inventar dados. |
| Exercício de direitos | Publicar um canal funcional para acesso, correção, limitação, oposição, portabilidade e apagamento, conforme aplicável. |
| Encarregado de proteção de dados | Avaliar se é exigido; não existe contacto no código. |
| Informação no registo | Implementada: o formulário liga às páginas de privacidade e condições. As categorias estão inventariadas; as finalidades e fundamentos exigem decisão. |
| Fundamentos RGPD | Documentar um fundamento por finalidade e os registos necessários. O código não estabelece a decisão jurídica. |
| Destinatários e contratos | Rever os papéis e contratos Supabase, Vercel e fornecedores externos; Google é opcional. |
| Localização e transferências | Supabase confirmada em `eu-west-1`; Vercel em `iad1`. Estas regiões não estabelecem a localização de todos os serviços, cópias ou registos, nem as garantias de transferência. |
| Retenção e cópias de segurança | Definir períodos e confirmar a eliminação junto dos fornecedores. |
| Remoção na aplicação | A função remota `delete_own_user()` aceita apenas a identidade da sessão, sem argumento de outra conta. As relações verificadas eliminam perfis, saldos, pontuações e dados Auth associados em cascata; a relação SCIM usa SET NULL. A migração restringe EXECUTE a contas autenticadas. O percurso local autenticado e a falha atómica passaram; não foram apagadas contas de produção. |
| Classificação pública | `get_leaderboard(text,integer)` devolve apenas nome e pontuação, com limite máximo de 100. Não devolve email, identificadores ou campos privados. A API tem cache de 60 segundos e tolerância de desatualização de 120 segundos, pelo que uma resposta em cache pode conservar um nome temporariamente após remoção. |
| Informação de armazenamento | Página implementada com os cookies Supabase e as quatro chaves locais. A classificação jurídica e a configuração de produção continuam pendentes. |
| Idade e proteção de menores | Não há data de nascimento nem limite etário no código. Definir público e medidas aplicáveis. |
| Segurança e incidentes | Confirmar configuração de produção, controlo de acessos, resposta a incidentes e segurança dos fornecedores. O relatório técnico não substitui esses processos. |
| Análise e publicidade | Nenhuma integração identificada no código. O diálogo de falta de fichas mostra saldo e tempo de regeneração, sem promessa de anúncios. |
| Compras e reembolsos | Não existem pagamentos, subscrições, renovação automática ou conversão monetária no código consultado. Reavaliar se o modelo mudar; isto não afasta direitos obrigatórios. |
| Informação e direitos do consumidor | Rever o Decreto-Lei n.º 84/2021, a Diretiva (UE) 2019/770 e a Lei n.º 24/96 face à oferta. A gratuitidade, por si só, não resolve a aplicação destas regras quando há dados de contas. |
| Avaliações e testemunhos | Funcionalidade inexistente. Os resultados da classificação não são avaliações de utilizadores. |
| Conteúdo de utilizadores | Limitado a nomes e pontuações. Avaliar denúncia e moderação dos nomes públicos. |
| Convites | Associação de contas e prémios em fichas. Confirmar informação e decisão de armazenamento, sem classificar como seguimento publicitário sem prova. |
| Créditos e direitos | A página `/credits` apresenta autoria, fonte, licença e notas de modificação do manifesto. Não há imagens com licença desconhecida; permanecem obrigações condicionais de atribuição, partilha nos mesmos termos e direitos adicionais. Ver [auditoria de licenças](asset-licensing.md). |
| Alterações às políticas | Definir publicação e data de entrada em vigor. A data do inventário não é uma aprovação nem uma data de vigência. |

## Evidência técnica

Foram consultados os gestores de preferências, resultados e fichas; os clientes Supabase e as funções de perfis, saldos, pontuações e classificação; os formulários e diálogos de contas; as rotas de autenticação, classificação e tarefa periódica; os pedidos externos dos jogos, as dependências e a configuração Vercel. A [validação remota](remote-supabase-validation.md) acrescenta o catálogo das tabelas, funções, políticas, permissões e relações de remoção.

A sessão pública limpa guardou `WMF-Uniq` após carregar uma fotografia Wikimedia. A política do fornecedor indica medição, experiências e proteção contra ataques, com duração de 365 dias renovada semanalmente. O ramo usa CORS anónimo nas fotografias e no pré-carregamento. O teste coloca um cookie existente e tenta guardar outro: nenhum é enviado ou guardado. Os metadados de rede e os registos do fornecedor permanecem fora desta proteção de cookies.

## Fontes

- [RGPD, Regulamento (UE) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj).
- [Direitos dos titulares, Comité Europeu para a Proteção de Dados](https://www.edpb.europa.eu/topics/key-gdpr-concepts/data-subject-rights_en).
- [Nota informativa da CNPD sobre cookies, 25/06/2021](https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf).
- [Orientações da CNPD sobre consentimento](https://www.cnpd.pt/organizacoes/areas-tematicas/consentimento/).
- [Lei n.º 46/2012, alteração e republicação da Lei n.º 41/2004](https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793).
- [Orientações finais 2/2023, versão 2.0](https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacydirective_en).
- [Decreto-Lei n.º 84/2021](https://diariodarepublica.pt/dr/detalhe/decreto-lei/84-2021-172938301).
- [Diretiva (UE) 2019/770](https://eur-lex.europa.eu/eli/dir/2019/770/oj).
- [Lei n.º 24/96, defesa do consumidor](https://diariodarepublica.pt/dr/legislacao-consolidada/lei/1996-34491075-43834175).
- [Política de cookies Wikimedia](https://foundation.wikimedia.org/wiki/Policy:Cookie_statement).
- [Atributos CORS, norma HTML](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#cors-settings-attributes).
