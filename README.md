# Atlas Arcade

Onze minijogos de geografia e o desafio Atlas Jackpot, numa recreativa com estética retro.

[Jogar Atlas Arcade](https://atlasarcade.app)

O Atlas Arcade está publicado. Os convidados podem jogar sem conta. A Supabase suporta autenticação, perfis, recordes e convites. Os desafios diários usam uma sequência determinada pela data UTC; o modo recreativa usa fichas que se regeneram. As fichas diárias e premium não têm valor monetário e não existe um percurso de compra.

## Produto e engenharia

Os jogos abrangem países, capitais, bandeiras, altitude, fronteiras, cidades e estatísticas geográficas. Um registo partilhado alimenta a grelha de jogos, a seleção de modos e o conjunto do Jackpot. O Zustand gere o estado da sessão e as preferências do navegador; funções puras mantêm as regras de pontuação e regeneração separadas da interface.

O sistema visual usa tipografia pixelizada, controlos quadrados e uma cor por jogo. Cores explícitas de texto e fundo mantêm a legibilidade dos cartões nos estados de passagem do rato, foco e pressão, nos dois temas. Os diálogos suportam teclado; os testes Playwright e axe abrangem a estrutura partilhada. A preferência por movimento reduzido desativa animações decorativas.

Os componentes dos jogos carregam quando são necessários. O globo usa react-globe.gl e three.js. Peaks & Valleys pré-carrega a fotografia da comparação seguinte durante a ronda atual; a revelação usa os dados disponíveis. As imagens e os mapas externos continuam dependentes dos fornecedores e da ligação.

## Tecnologias

Next.js App Router, React, TypeScript, Zustand, Supabase, Tailwind, react-globe.gl, three.js, Press Start 2P e VT323. A Vercel aloja a aplicação, que disponibiliza textos dos jogos em inglês, português e espanhol.

## Executar localmente

Usar Node.js 24 e npm:

```bash
npm ci
npm run dev
```

Definir `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`. O cliente inicializa a Supabase também nas sessões de convidados; jogar sem conta não exige registo. A pasta de migrações não constitui uma instalação completa de um projeto novo. A estrutura de teste reproduz o catálogo das tabelas e funções da aplicação, mas não todo o sistema Supabase Auth.

Os dados dos países são regenerados com `node scripts/fetchCountries.mjs`.

## Verificações

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:e2e:live
npm audit
npm audit --omit=dev
```

Os testes de navegador usam um serviço de teste isolado. A verificação pública lê o site numa sessão limpa e não envia dados de contas ou pontuações. Os testes de contraste usam as cores calculadas pelo navegador; as capturas complementam as asserções.

`npm run test:db` exige `ATLAS_TEST_DB_PORT` de uma instância PostgreSQL local e, se necessário, `ATLAS_TEST_DB_PASSWORD`. Aceita apenas a interface de rede local e cria e remove a sua própria base temporária. Testa permissões, migração, criação e remoção de contas, além de transações concorrentes. A CI executa esta verificação com PostgreSQL 17. O percurso `npm run test:auth:local` exige a aplicação e serviços reais Auth/PostgREST locais já configurados; os requisitos estão na [validação Supabase](docs/audit/remote-supabase-validation.md). A matriz dos clientes antigo e novo usa `npm run test:rollout:local`, com a base isolada em cada fase do [procedimento](docs/audit/supabase-rollout.md).

## Dados, conteúdos e limites

O rodapé dá acesso à privacidade, às condições, à informação de armazenamento e aos créditos. A [proveniência](docs/asset-provenance.md) regista licenças e obrigações por imagem. As estatísticas e coordenadas são dados selecionados para os jogos; alguns valores são arredondados ou podem ficar desatualizados.

A proteção de saldos, pontuações e convites usa uma publicação em três passos: expansão compatível da base, publicação do cliente e bloqueio das escritas antigas. Os ficheiros e critérios de aborto estão no [procedimento Supabase](docs/audit/supabase-rollout.md). A produção aguarda aprovação separada para cada passo; este ramo desativa a publicação automática Vercel. As pontuações continuam declaradas pelo navegador e os prémios do Jackpot calculados no cliente não autorizam fichas numa conta.

A identidade pública do responsável, o contacto de privacidade, os fundamentos jurídicos e os prazos de retenção continuam por definir. A remoção da conta elimina os dados associados pelas relações verificadas na base; não estabelece os prazos dos registos técnicos ou das cópias de segurança. Os testes selecionados não certificam a acessibilidade integral nem todos os direitos sobre conteúdos externos.

As [regras de design](DESIGN.md) e a [intenção do produto](PRODUCT.md) descrevem a interface. Antes de alterar APIs do Next.js, consultar os guias da versão instalada em `node_modules/next/dist/docs/`.
