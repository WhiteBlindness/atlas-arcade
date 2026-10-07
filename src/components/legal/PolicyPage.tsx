"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useSettingsStore } from "@/store/settingsStore";

type DocumentKey = "privacy" | "terms" | "cookies" | "credits";
type Locale = "en" | "pt";
type Section = { heading: string; paragraphs: string[] };
type StorageRow = { name: string; location: string; purpose: string; status: string; control: string };
type PageData = {
  title: string;
  summary: string;
  sections: Section[];
  sources: { label: string; href: string }[];
  storage?: StorageRow[];
};

const LazyCredits = dynamic(
  () => import("@/components/legal/Credits").then((module) => module.Credits),
  { loading: () => <p className="font-mono text-lg text-gray-400 light:text-gray-700" aria-busy="true">Loading credits…</p> },
);

const routes: { key: DocumentKey; href: string; en: string; pt: string }[] = [
  { key: "privacy", href: "/privacy", en: "Privacy", pt: "Privacidade" },
  { key: "terms", href: "/terms", en: "Terms", pt: "Condições" },
  { key: "cookies", href: "/cookies", en: "Cookies and storage", pt: "Cookies e armazenamento" },
  { key: "credits", href: "/credits", en: "Credits", pt: "Créditos" },
];

const content: Record<Locale, Record<DocumentKey, PageData>> = {
  en: {
    privacy: {
      title: "Privacy policy",
      summary: "What Atlas Arcade handles when you play, create an account or visit a profile.",
      sections: [
        { heading: "Who is responsible", paragraphs: [
          "Operator: [legal name, postal address and country of establishment to provide]. Privacy contact: [contact to provide]. Data protection officer, if appointed: [contact to provide].",
          "This notice describes how Atlas Arcade uses personal data when you play its games or use account features.",
        ] },
        { heading: "Information handled by the service", paragraphs: [
          "If you create an account with email, Supabase receives your email address, password and chosen username. Google sign-in is optional. Supabase supplies the account identifier and sign-in session used by Atlas Arcade.",
          "For signed-in accounts, Atlas Arcade stores your username, game scores, coin balances and related dates. An invite code may link your account to the account that invited you. The public leaderboard is designed to show usernames and scores; its complete live output has not been confirmed.",
          "Without an account, the browser stores game preferences, daily progress and the guest coin balance. Guesses and the current round stay in application memory. Daily results are also saved in the browser, and some completed games send a high score to a signed-in account.",
        ] },
        { heading: "Why the app uses the information", paragraphs: [
          "Atlas Arcade uses account details to sign you in, maintain your profile and balances, save scores, show the leaderboard and apply invite rewards. Browser storage keeps your selected settings and guest or daily game state between visits.",
          "The lawful basis for each purpose has not been supplied: [operator to complete]. Consent is not automatically the correct basis for every account function.",
        ] },
        { heading: "Other services that receive requests", paragraphs: [
          "Supabase handles account sign-in and account data. If you choose Google sign-in, your browser also communicates with Google.",
          "During play, your browser may request map data from jsDelivr, flags from FlagCDN, images from Wikimedia Commons and trivia questions from OpenTDB. These services receive ordinary network request information. Provider-specific data locations and retention periods have not been supplied: [operator to complete].",
          "Game photographs are requested without sending or storing the image provider’s cookies. The image host still receives network information such as your IP address.",
          "Vercel hosts the service. Its deployment is configured for region iad1. The Supabase data region, request-log settings and retention periods have not been supplied: [operator to complete].",
        ] },
        { heading: "Public scores and referrals", paragraphs: [
          "The leaderboard is public and is intended to show a username with a score. Choose a username that does not reveal information you want to keep private. Invite codes can connect a new account to the account that invited it and may grant game tokens.",
        ] },
        { heading: "Storage, retention and account removal", paragraphs: [
          "You can clear local browser storage and cookies in your browser settings. This may remove local progress or sign you out; it does not remove information held in your account.",
          "Retention periods for account data, scores, service logs and backups have not been supplied: [operator to provide]. Account removal has not been confirmed. To request access, correction, restriction or erasure, contact: [privacy contact to provide].",
        ] },
        { heading: "Your rights and complaints", paragraphs: [
          "Depending on the circumstances and legal basis, data protection law may give you rights to access your data, correct it, request erasure or restriction, object to processing, receive certain data in a portable format, and withdraw consent where processing relies on consent. You may also complain to the competent data protection authority. In Portugal, that authority is the CNPD.",
          "The operator's country of establishment and applicable supervisory authority have not been confirmed: [operator to provide].",
        ] },
        { heading: "Children and age rules", paragraphs: [
          "The service's age policy and any safeguards for children have not been supplied: [operator to confirm].",
        ] },
      ],
      sources: [
        { label: "GDPR, Regulation (EU) 2016/679", href: "https://eur-lex.europa.eu/eli/reg/2016/679/oj" },
        { label: "EDPB: data subject rights", href: "https://www.edpb.europa.eu/topics/key-gdpr-concepts/data-subject-rights_en" },
        { label: "CNPD: consent", href: "https://www.cnpd.pt/organizacoes/areas-tematicas/consentimento/" },
      ],
    },
    terms: {
      title: "Terms of use",
      summary: "Rules for playing Atlas Arcade and using an account.",
      sections: [
        { heading: "Operator details and status", paragraphs: [
          "Operator: [legal name, postal address and country of establishment to provide]. Contact: [support contact to provide]. Applicable law and complaint route: [operator to confirm].",
          "These terms are incomplete until the operator supplies those details and confirms the applicable consumer information.",
        ] },
        { heading: "The service and accounts", paragraphs: [
          "Atlas Arcade is a browser-based geography game with daily and arcade modes. You can play without an account. An account can be created with an email address and password or through the optional Google sign-in flow.",
          "Age policy: [operator to confirm]. Do not use a username that contains personal details you do not want shown on the public leaderboard.",
        ] },
        { heading: "Scores, names and referrals", paragraphs: [
          "Signed-in game scores are saved to your account. The public leaderboard is intended to display a username and score; its complete live output has not been confirmed.",
          "An invite link can associate a new account with the inviting account and award game tokens.",
        ] },
        { heading: "Game coins and payments", paragraphs: [
          "Atlas Arcade is free to play. It has no paid purchases or subscriptions. Game coins and tokens have no cash value and cannot be withdrawn.",
        ] },
        { heading: "Acceptable use and availability", paragraphs: [
          "Use the service lawfully. Do not try to access another account, disrupt the service, manipulate scores or abuse invite rewards. The service depends on network access and external providers, so interruptions may occur. These terms do not limit rights that cannot lawfully be limited.",
        ] },
        { heading: "Content and intellectual property", paragraphs: [
          "Atlas Arcade includes third-party images, geography data and other materials. Their sources and licence conditions appear on the credits page. A credit entry does not grant a licence; do not reuse an asset unless its listed licence permits that use.",
          "User contributions are limited to a username and game scores.",
        ] },
        { heading: "Account removal and complaints", paragraphs: [
          "The account-removal process and complaint route have not been confirmed. To request removal or make a complaint, contact: [support contact to provide]. Nothing in these terms removes mandatory consumer protections.",
        ] },
      ],
      sources: [
        { label: "Decree-Law 84/2021, digital content and services", href: "https://diariodarepublica.pt/dr/detalhe/decreto-lei/84-2021-172938301" },
        { label: "Directive (EU) 2019/770", href: "https://eur-lex.europa.eu/eli/dir/2019/770/oj" },
        { label: "Consumer Protection Act, Law 24/96", href: "https://diariodarepublica.pt/dr/legislacao-consolidada/lei/1996-34491075-43834175" },
      ],
    },
    cookies: {
      title: "Cookies and local storage",
      summary: "Cookies and browser storage used to keep your sign-in and game settings.",
      sections: [
        { heading: "What the browser stores", paragraphs: [
          "Atlas Arcade uses authentication cookies for Supabase sign-in and browser storage for your settings, daily progress, guest coin balance and pending invite code. Browser storage is not a cookie, but it still saves information on your device.",
          "Game photographs are requested without sending or storing the image provider’s cookies. The image host still receives network information such as your IP address.",
          "The reviewed application source contains no analytics or advertising integration. Hosting or production configuration may add scripts that have not been checked: [operator to confirm].",
        ] },
        { heading: "Consent assessment", paragraphs: [
          "Supabase authentication cookies support the sign-in session you request. Prior consent is the general rule for terminal storage or access; rely on a technical exception only after confirming that the cookie is necessary for the service you expressly requested.",
          "Daily progress and the guest coin balance support those game features. The source saves them as game state without a separate storage-consent choice. Prior consent applies unless storage is strictly necessary for the information-society service you expressly requested. Whether an exception applies, or a game interaction supplies valid prior consent, needs legal review.",
          "Remembering your language, theme and sound is optional. The app saves a preference after you change it, without a separate storage-consent choice. Prior consent applies unless a specific statutory exception is confirmed; whether a preference interaction supplies valid consent has not been assessed.",
          "An invite code is stored when you open an invitation link so the app can apply the referral after sign-in. The code is not required for ordinary play, and no separate storage-consent choice currently gates the write. Prior consent applies unless legal review confirms that opening the link expressly requested the referral service and that storage is strictly necessary to provide it.",
          "In Portugal, Article 5 of Law 41/2004, as amended by Law 46/2012, requires prior consent based on clear and complete information, including the purposes, before terminal information is stored or accessed. It excepts technical storage or access whose sole purpose is to transmit a communication, and storage or access strictly necessary for a provider to supply an information-society service expressly requested by the user. Each item requires case-specific review under Portuguese law and CNPD guidance; this review does not confirm that any item qualifies for an exception.",
        ] },
        { heading: "How to clear browser storage", paragraphs: [
          "Use your browser's site-data controls to remove cookies and local storage for Atlas Arcade. This may sign you out and reset preferences, daily progress or guest coins. It does not remove information held in your account.",
        ] },
      ],
      sources: [
        { label: "CNPD information note on cookies (25/06/2021)", href: "https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf" },
        { label: "Law 46/2012, amending and republishing Law 41/2004, Article 5", href: "https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793" },
        { label: "EDPB Guidelines 2/2023, final version 2.0 on Article 5(3) technical scope", href: "https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacydirective_en" },
        { label: "Directive 2002/58/EC", href: "https://eur-lex.europa.eu/eli/dir/2002/58/oj" },
      ],
      storage: [
        { name: "Supabase authentication session", location: "Authentication cookies; exact names depend on the setup.", purpose: "Maintain your requested sign-in session.", status: "Prior consent is the default. Rely on an exception only after confirming that the cookie meets the statutory conditions; legal review and live configuration checks are required.", control: "Sign out or clear this site's cookies in your browser." },
        { name: "atlas-arcade-settings", location: "Browser storage", purpose: "Remember the selected language, theme and sound setting.", status: "Optional storage. Prior consent applies unless legal review confirms a statutory exception. The key is saved after a preference change; no separate storage-consent choice gates the write. Whether that interaction supplies valid consent has not been assessed.", control: "Clear this site's storage; preferences return to defaults." },
        { name: "atlas-arcade-daily", location: "Browser storage", purpose: "Remember daily results, completed games and streak progress.", status: "Prior consent is the default. The app saves this as game state without a separate storage-consent choice. An exception may apply only if this storage is strictly necessary for the daily service expressly requested; legal review is required.", control: "Clear this site's storage; local daily progress is removed." },
        { name: "atlas-arcade-guest-tokens", location: "Browser storage", purpose: "Keep a guest coin balance and regeneration times.", status: "Prior consent is the default. The app saves this as game state without a separate storage-consent choice. An exception may apply only if this storage is strictly necessary for the service expressly requested; legal review is required.", control: "Clear this site's storage; the guest balance resets." },
        { name: "atlas-arcade-ref", location: "Browser storage", purpose: "Remember an invite code from a link until referral redemption after sign-in.", status: "Prior consent is the default. Whether opening the invitation expressly requests this feature and whether storage is strictly necessary need case-specific legal review. No separate storage-consent choice currently gates the write.", control: "Clear this site's storage before signing up or signing in to remove a pending invite code." },
      ],
    },
    credits: { title: "Credits and licences", summary: "Sources and licensing status for third-party material used in Atlas Arcade.", sections: [], sources: [] },
  },
  pt: {
    privacy: {
      title: "Política de privacidade",
      summary: "Dados tratados pelo Atlas Arcade quando joga, cria uma conta ou consulta um perfil.",
      sections: [
        { heading: "Quem é responsável", paragraphs: [
          "Operador: [denominação legal, endereço postal e país de estabelecimento a indicar]. Contacto de privacidade: [contacto a indicar]. Encarregado de proteção de dados, se nomeado: [contacto a indicar].",
          "Este aviso descreve a utilização de dados pessoais quando joga ou utiliza as funções de conta do Atlas Arcade.",
        ] },
        { heading: "Dados tratados pelo serviço", paragraphs: [
          "Se criar uma conta com endereço de correio eletrónico, o Supabase recebe esse endereço, a palavra-passe que escolher e o nome de utilizador. Pode optar por iniciar sessão através da sua conta Google. O Supabase fornece o identificador da conta e a sessão de autenticação utilizados pelo Atlas Arcade.",
          "Quando tem sessão iniciada, o Atlas Arcade guarda o nome de utilizador, as pontuações por jogo, os saldos de fichas e datas associadas. Um código de convite pode associar a sua conta à conta que o partilhou. O quadro público de classificações destina-se a apresentar nomes de utilizador e pontuações; a apresentação completa no serviço ainda não foi confirmada.",
          "Sem conta, o navegador guarda as preferências, o progresso diário e o saldo de fichas de convidado. As tentativas e o estado da partida atual ficam na memória da aplicação. Os resultados diários também ficam guardados no navegador e alguns jogos enviam a pontuação mais alta para uma conta com sessão iniciada.",
        ] },
        { heading: "Finalidades", paragraphs: [
          "O Atlas Arcade utiliza os dados da conta para iniciar a sessão, manter o perfil e os saldos, guardar recordes, apresentar o quadro de classificações e atribuir bónus de convite. O armazenamento no navegador conserva as preferências escolhidas e o estado dos jogos diários ou de convidado entre visitas.",
          "O fundamento de licitude para cada finalidade não foi indicado: [operador a completar]. O consentimento não é automaticamente o fundamento adequado para todas as funções da conta.",
        ] },
        { heading: "Outros serviços que recebem pedidos", paragraphs: [
          "O Supabase trata o início de sessão e os dados da conta. Se optar por iniciar sessão com a sua conta Google, o navegador também comunica com os serviços Google.",
          "Durante o jogo, o navegador pode pedir dados cartográficos ao jsDelivr, bandeiras à FlagCDN, imagens à Wikimedia Commons e perguntas de cultura geral à OpenTDB. Estes serviços recebem dados normais dos pedidos de rede. A localização dos dados e os prazos de conservação de cada fornecedor não foram indicados: [operador a completar].",
          "Os pedidos das fotografias dos jogos não enviam nem guardam cookies do fornecedor da imagem. O alojamento da imagem continua a receber dados de rede, como o endereço IP.",
          "A Vercel aloja o serviço na região de implementação iad1. A região dos dados do Supabase, as definições dos registos de pedidos e os prazos de conservação não foram indicados: [operador a informar].",
        ] },
        { heading: "Pontuações públicas e convites", paragraphs: [
          "O quadro de classificações é público e destina-se a mostrar um nome de utilizador e uma pontuação. Escolha um nome que não revele informação que pretenda manter privada. Um código de convite pode associar uma nova conta à conta que o partilhou e atribuir fichas de jogo.",
        ] },
        { heading: "Armazenamento, conservação e remoção da conta", paragraphs: [
          "Pode apagar os cookies e o armazenamento local nas definições do navegador. Essa operação pode remover o progresso local ou terminar a sessão; não apaga os dados associados à conta.",
          "Os prazos de conservação dos dados da conta, pontuações, registos do serviço e cópias de segurança não foram indicados: [operador a informar]. A remoção da conta não está confirmada. Para pedir acesso, retificação, limitação ou apagamento, contacte: [contacto de privacidade a indicar].",
        ] },
        { heading: "Direitos e reclamações", paragraphs: [
          "Consoante as circunstâncias e o fundamento de licitude, a legislação de proteção de dados pode dar-lhe o direito de consultar os dados, retificá-los, pedir o apagamento ou a limitação do tratamento, opor-se a determinados tratamentos, receber certos dados num formato que permita a portabilidade e retirar o consentimento quando o tratamento se baseie nesse fundamento. Também pode apresentar uma reclamação à autoridade de controlo competente. Em Portugal, essa autoridade é a CNPD.",
          "O país de estabelecimento do operador e a autoridade de controlo competente não foram confirmados: [operador a indicar].",
        ] },
        { heading: "Crianças e idade mínima", paragraphs: [
          "A política de idade e as medidas aplicáveis a crianças não foram indicadas: [operador a confirmar].",
        ] },
      ],
      sources: [
        { label: "RGPD, Regulamento (UE) 2016/679", href: "https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32016R0679" },
        { label: "CEPD: direitos dos titulares dos dados", href: "https://www.edpb.europa.eu/topics/key-gdpr-concepts/data-subject-rights_en" },
        { label: "CNPD: consentimento", href: "https://www.cnpd.pt/organizacoes/areas-tematicas/consentimento/" },
      ],
    },
    terms: {
      title: "Condições de utilização",
      summary: "Regras para jogar Atlas Arcade e utilizar uma conta.",
      sections: [
        { heading: "Operador e contacto", paragraphs: [
          "Operador: [denominação legal, endereço postal e país de estabelecimento a indicar]. Contacto: [contacto de apoio a indicar]. Lei aplicável e via de reclamação: [operador a confirmar].",
        ] },
        { heading: "Serviço e contas", paragraphs: [
          "O Atlas Arcade é um jogo de geografia para navegador, com modos diário e arcade. Pode jogar sem criar conta. A conta pode ser criada com endereço de correio eletrónico e palavra-passe ou através da opção de início de sessão com a sua conta Google.",
          "Idade mínima: [operador a confirmar]. Não inclua dados pessoais no nome de utilizador se não os quiser mostrar no quadro público de classificações.",
        ] },
        { heading: "Pontuações, nomes e convites", paragraphs: [
          "As pontuações dos jogos iniciados ficam associadas à sua conta. O quadro público destina-se a mostrar o nome de utilizador e a pontuação; a apresentação completa no serviço ainda não foi confirmada.",
          "Uma ligação de convite pode associar uma nova conta à conta que a partilhou e atribuir fichas de jogo.",
        ] },
        { heading: "Fichas de jogo e pagamentos", paragraphs: [
          "O Atlas Arcade é gratuito. Não tem compras nem subscrições pagas. As fichas e os tokens de jogo não têm valor monetário e não podem ser levantados.",
        ] },
        { heading: "Utilização permitida e disponibilidade", paragraphs: [
          "Utilize o serviço de forma lícita. Não tente aceder à conta de outra pessoa, interromper o serviço, manipular pontuações ou abusar dos bónus de convite. O serviço depende da ligação à Internet e de fornecedores externos, pelo que podem ocorrer interrupções. Estas condições não limitam direitos que não possam ser afastados por lei.",
        ] },
        { heading: "Conteúdos e propriedade intelectual", paragraphs: [
          "O Atlas Arcade inclui imagens, dados geográficos e outros materiais de terceiros. As respetivas fontes e condições de licença constam da página de créditos. Uma referência de crédito não concede uma licença. Não reutilize um recurso sem confirmar que a licença indicada o permite.",
          "As contribuições dos utilizadores limitam-se ao nome de utilizador e aos resultados de jogo.",
        ] },
        { heading: "Remoção da conta e reclamações", paragraphs: [
          "O processo de remoção da conta e a via de reclamação não estão confirmados. Para pedir a remoção ou apresentar uma reclamação, contacte: [contacto de apoio a indicar]. Nada nestas condições afasta a proteção imperativa do consumidor.",
        ] },
      ],
      sources: [
        { label: "Decreto-Lei n.º 84/2021, conteúdos e serviços digitais", href: "https://diariodarepublica.pt/dr/detalhe/decreto-lei/84-2021-172938301" },
        { label: "Diretiva (UE) 2019/770", href: "https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32019L0770" },
        { label: "Lei de Defesa do Consumidor, Lei n.º 24/96", href: "https://diariodarepublica.pt/dr/legislacao-consolidada/lei/1996-34491075-43834175" },
      ],
    },
    cookies: {
      title: "Cookies e armazenamento local",
      summary: "Cookies e armazenamento no navegador usados para manter a sessão e as preferências de jogo.",
      sections: [
        { heading: "O que o navegador guarda", paragraphs: [
          "O Atlas Arcade utiliza cookies de autenticação do Supabase e armazenamento no navegador para as preferências, o progresso diário, as fichas de convidado e os convites. O armazenamento no navegador não é um cookie, mas também conserva informação no dispositivo.",
          "Os pedidos das fotografias dos jogos não enviam nem guardam cookies do fornecedor da imagem. O alojamento da imagem continua a receber dados de rede, como o endereço IP.",
          "A aplicação não inclui ferramentas de análise de utilização nem publicidade. Não estão confirmados outros cookies ou scripts acrescentados na configuração de alojamento: [operador a verificar].",
        ] },
        { heading: "Avaliação do consentimento", paragraphs: [
          "Os cookies de autenticação do Supabase apoiam a sessão que pediu. A regra é o consentimento prévio. Só se deve invocar uma exceção depois de confirmar que estes cookies cumprem as condições legais; a finalidade e o âmbito carecem de revisão jurídica.",
          "O progresso diário e o saldo de fichas de convidado apoiam essas funções de jogo. A aplicação guarda estes valores como estado do jogo sem uma escolha separada sobre o armazenamento. O consentimento prévio aplica-se, salvo se o armazenamento for estritamente necessário para o serviço da sociedade da informação expressamente pedido. A aplicação desta exceção a cada item, ou a validade de consentimento obtido numa interação de jogo, carece de avaliação jurídica.",
          "Guardar o idioma, o tema e o som é opcional. A aplicação guarda a preferência quando a altera, sem uma escolha separada sobre o armazenamento. O consentimento prévio aplica-se, salvo se uma exceção legal específica for confirmada; a validade de consentimento obtido nessa interação ainda não foi avaliada.",
          "Quando abre uma ligação de convite, a aplicação guarda o código para atribuir a recompensa depois de iniciar sessão. O código não é necessário para jogar, e não existe uma escolha separada sobre o armazenamento que preceda ou condicione esta escrita. O consentimento prévio aplica-se, salvo se a análise jurídica confirmar que a ligação pediu expressamente esta função e que o armazenamento é estritamente necessário para a prestar.",
          "Em Portugal, o artigo 5.º da Lei n.º 41/2004, na redação da Lei n.º 46/2012, exige consentimento prévio, com base em informação clara e completa, nomeadamente quanto às finalidades, antes de guardar informações no equipamento terminal ou aceder às que aí estão armazenadas. A lei excetua o armazenamento técnico ou o acesso cuja única finalidade seja transmitir uma comunicação, e o armazenamento ou acesso estritamente necessário para o fornecedor prestar um serviço da sociedade da informação expressamente pedido pelo utilizador. A aplicação de cada exceção deve ser avaliada caso a caso; esta revisão não confirma que qualquer item beneficia dela.",
        ] },
        { heading: "Como apagar o armazenamento do navegador", paragraphs: [
          "Utilize as definições do navegador para apagar os cookies e o armazenamento local do Atlas Arcade. Essa operação pode terminar a sessão e repor as preferências, o progresso diário, as fichas de convidado ou um código de convite pendente. Não apaga os dados associados à conta.",
        ] },
      ],
      sources: [
        { label: "Nota informativa da CNPD sobre cookies (25/06/2021)", href: "https://www.cnpd.pt/media/x2zdus50/nota-informativa-cnpd_cookies_20210625.pdf" },
        { label: "Lei n.º 46/2012, que altera e republica a Lei n.º 41/2004, artigo 5.º", href: "https://diariodarepublica.pt/dr/detalhe/lei/46-2012-174793" },
        { label: "Orientações 2/2023 do CEPD, versão final 2.0, sobre o âmbito técnico do artigo 5.º, n.º 3", href: "https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacydirective_en" },
        { label: "Diretiva 2002/58/CE", href: "https://eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32002L0058" },
      ],
      storage: [
        { name: "Sessão de autenticação Supabase", location: "Cookies de autenticação; os nomes dependem da configuração.", purpose: "Manter a sessão que pediu ao iniciar sessão.", status: "O consentimento prévio é a regra. Só invoque uma exceção depois de confirmar que os cookies cumprem as condições legais; confirme também as definições em produção.", control: "Termine a sessão ou apague os cookies deste site nas definições do navegador." },
        { name: "atlas-arcade-settings", location: "Armazenamento no navegador", purpose: "Guardar o idioma, o tema e a preferência de som.", status: "Armazenamento opcional. O consentimento prévio aplica-se, salvo se a revisão jurídica confirmar uma exceção legal. A aplicação guarda a preferência depois de esta ser alterada; não existe uma escolha separada sobre o armazenamento.", control: "Apague o armazenamento deste site; as preferências regressam aos valores iniciais." },
        { name: "atlas-arcade-daily", location: "Armazenamento no navegador", purpose: "Guardar resultados diários, jogos concluídos e sequências de dias.", status: "O consentimento prévio é a regra. A aplicação guarda este estado durante o jogo, sem uma escolha separada sobre o armazenamento. Uma exceção só pode aplicar-se se este armazenamento for estritamente necessário para o serviço diário expressamente pedido; requer revisão jurídica.", control: "Apague o armazenamento deste site; o progresso diário é removido." },
        { name: "atlas-arcade-guest-tokens", location: "Armazenamento no navegador", purpose: "Guardar o saldo de fichas de convidado e os instantes de reposição.", status: "O consentimento prévio é a regra. A aplicação guarda este estado durante o jogo, sem uma escolha separada sobre o armazenamento. Uma exceção só pode aplicar-se se este armazenamento for estritamente necessário para o serviço expressamente pedido; requer revisão jurídica.", control: "Apague o armazenamento deste site; o saldo de convidado é reposto." },
        { name: "atlas-arcade-ref", location: "Armazenamento no navegador", purpose: "Guardar um código de convite recebido numa ligação até o atribuir depois de iniciar sessão.", status: "O consentimento prévio é a regra. A classificação depende de a ligação pedir expressamente esta função e de o armazenamento ser estritamente necessário para a prestar; requer revisão jurídica caso a caso. Não existe uma escolha separada sobre o armazenamento que preceda ou condicione esta escrita.", control: "Apague o armazenamento deste site antes de iniciar sessão ou criar uma conta para remover um código pendente." },
      ],
    },
    credits: { title: "Créditos e licenças", summary: "Fontes e estado das licenças dos materiais de terceiros usados no Atlas Arcade.", sections: [], sources: [] },
  },
};

function DocumentNavigation({ locale, current }: { locale: Locale; current: DocumentKey }) {
  const back = locale === "pt" ? "Voltar ao jogo" : "Back to the game";
  const label = locale === "pt" ? "Documentos do serviço" : "Service documents";
  return (
    <>
      <Link href="/" className="inline-flex min-h-11 items-center border border-arcade-border px-3 font-pixel text-[8px] text-arcade-neon-cyan hover:border-arcade-neon-cyan hover:bg-arcade-neon-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arcade-neon-cyan">
        ← {back}
      </Link>
      <nav aria-label={label} className="mt-5 flex flex-wrap gap-2 border-y border-arcade-border py-3">
        {routes.map((route) => {
          const active = current === route.key;
          const classes = "min-h-11 border px-3 py-3 font-pixel text-[7px] leading-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-arcade-neon-cyan ";
          return (
            <Link
              key={route.key}
              href={route.href}
              aria-current={active ? "page" : undefined}
              className={classes + (active ? "border-arcade-neon-cyan text-arcade-neon-cyan" : "border-arcade-border text-gray-400 light:text-gray-700 hover:border-arcade-neon-cyan hover:text-arcade-neon-cyan")}
            >
              {locale === "pt" ? route.pt : route.en}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function ReviewNotice({ locale }: { locale: Locale }) {
  const pt = locale === "pt";
  return (
    <aside className="my-6 border border-arcade-neon-yellow/70 bg-arcade-surface p-4" aria-label={pt ? "Informação incompleta" : "Incomplete information"}>
      <p className="font-pixel text-[8px] leading-5 text-arcade-neon-yellow">{pt ? "INFORMAÇÃO INCOMPLETA" : "INFORMATION INCOMPLETE"}</p>
      <p className="mt-2 font-mono text-lg leading-6 text-gray-200 light:text-gray-700">
        {pt
          ? "Faltam a identificação e os dados de contacto do operador, bem como a confirmação de alguns aspetos do serviço. Esta informação está incompleta e ainda não foi objeto de revisão jurídica."
          : "The operator's identity and contact details, along with some service information, are missing. This information is incomplete and has not received legal review."}
      </p>
    </aside>
  );
}

export function PolicyPage({ documentKey }: { documentKey: DocumentKey }) {
  const appLanguage = useSettingsStore((state) => state.lang);
  const locale: Locale = appLanguage === "pt" ? "pt" : "en";
  const page = content[locale][documentKey];
  const pt = locale === "pt";
  return (
    <main className="min-h-dvh bg-arcade-bg px-4 py-8 text-gray-100 light:text-gray-700">
      <article lang={locale} className="mx-auto w-full max-w-4xl">
        <DocumentNavigation locale={locale} current={documentKey} />
        <header className="border-b border-arcade-border py-8">
          <p className="font-pixel text-[8px] text-arcade-neon-green">ATLAS ARCADE / {documentKey.toUpperCase()}</p>
          <h1 className="mt-4 font-pixel text-sm leading-8 text-arcade-neon-cyan md:text-lg">{page.title}</h1>
          <p className="mt-4 font-mono text-xl leading-7 text-gray-300 light:text-gray-700">{page.summary}</p>
          {appLanguage === "es" && <p className="mt-2 font-mono text-sm text-gray-400 light:text-gray-700">This document is available in English and Portuguese. English is shown for the current language setting.</p>}
        </header>
        <ReviewNotice locale={locale} />
        {documentKey === "credits" ? <LazyCredits locale={locale} /> : (
          <div className="space-y-8 py-2">
            {page.sections.map((section) => (
              <section key={section.heading} className="border-l border-arcade-border pl-4 sm:pl-6">
                <h2 className="font-pixel text-[9px] leading-6 text-arcade-neon-green">{section.heading}</h2>
                <div className="mt-3 space-y-3 font-mono text-lg leading-7 text-gray-300 light:text-gray-700">
                  {section.paragraphs.map((paragraph, index) => <p key={section.heading + String(index)}>{paragraph}</p>)}
                </div>
              </section>
            ))}
            {page.storage && (
              <section aria-labelledby="storage-inventory" className="space-y-4">
                <h2 id="storage-inventory" className="font-pixel text-[9px] leading-6 text-arcade-neon-green">{pt ? "Inventário" : "Storage inventory"}</h2>
                {page.storage.map((row) => (
                  <article key={row.name} className="border border-arcade-border bg-arcade-surface p-4">
                    <h3 className="font-mono text-xl text-arcade-neon-cyan">{row.name}</h3>
                    <dl className="mt-3 grid gap-3 font-mono text-base leading-6 sm:grid-cols-[140px_1fr]">
                      <dt className="font-bold text-gray-200 light:text-gray-700">{pt ? "Localização" : "Location"}</dt><dd className="text-gray-400 light:text-gray-700">{row.location}</dd>
                      <dt className="font-bold text-gray-200 light:text-gray-700">{pt ? "Finalidade" : "Purpose"}</dt><dd className="text-gray-400 light:text-gray-700">{row.purpose}</dd>
                      <dt className="font-bold text-gray-200 light:text-gray-700">{pt ? "Consentimento" : "Consent status"}</dt><dd className="text-gray-400 light:text-gray-700">{row.status}</dd>
                      <dt className="font-bold text-gray-200 light:text-gray-700">{pt ? "Como remover" : "How to remove"}</dt><dd className="text-gray-400 light:text-gray-700">{row.control}</dd>
                    </dl>
                  </article>
                ))}
              </section>
            )}
            <section aria-labelledby="legal-sources" className="border-t border-arcade-border pt-6">
              <h2 id="legal-sources" className="font-pixel text-[8px] leading-5 text-gray-400 light:text-gray-700">{pt ? "Fontes oficiais" : "Official references"}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6 font-mono text-base text-arcade-neon-cyan">
                {page.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-arcade-neon-cyan">{source.label}</a></li>)}
              </ul>
            </section>
          </div>
        )}
        <footer className="mt-10 border-t border-arcade-border py-5 font-mono text-sm text-gray-400 light:text-gray-700">
          {pt ? "Contacto para questões: [operador a indicar]." : "Contact for questions: [operator to provide]."}
        </footer>
      </article>
    </main>
  );
}
