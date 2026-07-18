// Urban Legends dataset — cities with progressive clues (hardest first) and a
// fun fact revealed after each round. Tiers control difficulty and scoring.
// UI text is European Portuguese (PT-PT); iconic monuments keep their original
// names, historical figures are translated.

export type CityTier = "easy" | "medium" | "hard";

export interface CityEntry {
  /** City photo (Wikipedia REST API); rendered in full colour inside a CRT frame */
  imageUrl: string;
  id: string;
  name: string;
  country: string;
  tier: CityTier;
  emoji: string;
  clues: [string, string, string]; // hardest → easiest
  funFact: string;
}

export const CITIES: CityEntry[] = [
  // ——— EASY ———
  {
    id: "paris", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/960px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg", name: "Paris", country: "França", tier: "easy", emoji: "🗼",
    clues: [
      "O seu metro concentra mais de 300 estações num centro urbano bastante pequeno.",
      "É apelidada de “Cidade da Luz” e um rio famoso divide-a em margem esquerda e margem direita.",
      "A sua torre de ferro, erguida para a Exposição Universal de 1889, era para ser temporária.",
    ],
    funFact: "A Torre Eiffel cresce cerca de 15 cm no verão, quando o ferro se dilata com o calor.",
  },
  {
    id: "london", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/960px-London_Skyline_%28125508655%29.jpeg", name: "Londres", country: "Reino Unido", tier: "easy", emoji: "🎡",
    clues: [
      "Os táxis pretos daqui têm de passar num lendário exame de memória das ruas, chamado “The Knowledge”.",
      "O seu metropolitano é o mais antigo do mundo, inaugurado em 1863.",
      "Uma enorme torre do relógio, junto ao parlamento, é um dos marcos mais filmados do planeta.",
    ],
    funFact: "Big Ben é, na verdade, o nome do sino e não da torre — a torre chama-se Elizabeth Tower.",
  },
  {
    id: "new-york", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/960px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg", name: "Nova Iorque", country: "Estados Unidos", tier: "easy", emoji: "🗽",
    clues: [
      "A sua malha de ruas foi planeada em 1811, muito antes de a cidade existir na maior parte.",
      "Um parque retangular de 341 hectares fica no meio da sua ilha mais densa.",
      "Uma estátua de cobre no seu porto foi um presente da França em 1886.",
    ],
    funFact: "A Estátua da Liberdade era originalmente de cobre castanho brilhante — demorou cerca de 30 anos a ficar verde.",
  },
  {
    id: "tokyo", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/960px-Skyscrapers_of_Shinjuku_2009_January.jpg", name: "Tóquio", country: "Japão", tier: "easy", emoji: "🏮",
    clues: [
      "A sua área metropolitana é a mais populosa do planeta, com mais de 37 milhões de pessoas.",
      "Chamava-se Edo até 1868, quando o imperador se mudou para lá e lhe mudou o nome.",
      "A sua famosa passadeira em cruz deixa milhares de pessoas atravessar em todas as direções ao mesmo tempo.",
    ],
    funFact: "Tóquio tem mais restaurantes com estrelas Michelin do que qualquer outra cidade do mundo.",
  },
  {
    id: "rome", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg/960px-Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg", name: "Roma", country: "Itália", tier: "easy", emoji: "🏛️",
    clues: [
      "A lenda diz que foi fundada por irmãos gémeos criados por uma loba.",
      "Um país soberano inteiro fica dentro das fronteiras desta cidade.",
      "O seu anfiteatro antigo levava 50 000 espetadores para os combates de gladiadores.",
    ],
    funFact: "Cerca de 1,5 milhões de euros em moedas são atirados para a Fontana di Trevi todos os anos — tudo revertido para caridade.",
  },
  {
    id: "sydney", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg/960px-Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg", name: "Sydney", country: "Austrália", tier: "easy", emoji: "🛶",
    clues: [
      "Não é a capital do seu país, embora a maioria pense que sim.",
      "A ponte do seu porto tem a alcunha de “The Coathanger” (o cabide).",
      "Os telhados em forma de vela da sua casa da ópera demoraram 14 anos a construir.",
    ],
    funFact: "O telhado da Sydney Opera House está coberto por mais de um milhão de azulejos autolimpantes.",
  },
  {
    id: "cairo", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg/960px-Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg", name: "Cairo", country: "Egito", tier: "easy", emoji: "🐪",
    clues: [
      "É a maior cidade de África e do mundo árabe.",
      "Um rio que a atravessa é o mais longo do seu continente.",
      "A última Maravilha do Mundo Antigo que sobrevive ergue-se nos seus arredores.",
    ],
    funFact: "A Grande Pirâmide de Gizé foi a estrutura mais alta feita pelo homem durante mais de 3800 anos.",
  },
  {
    id: "rio", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Cidade_Maravilhosa.jpg/960px-Cidade_Maravilhosa.jpg", name: "Rio de Janeiro", country: "Brasil", tier: "easy", emoji: "🎭",
    clues: [
      "O seu nome significa “Rio de Janeiro”, embora não haja rio — os exploradores confundiram a baía.",
      "O seu carnaval anual atrai cerca de dois milhões de pessoas por dia às ruas.",
      "Uma estátua de 30 metros, de braços abertos, vigia a cidade do alto de um monte.",
    ],
    funFact: "O Cristo Redentor é atingido por raios várias vezes por ano — já perdeu um polegar numa tempestade.",
  },

  // ——— MEDIUM ———
  {
    id: "amsterdam", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png/960px-Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png", name: "Amesterdão", country: "Países Baixos", tier: "medium", emoji: "🚲",
    clues: [
      "As suas casas inclinam-se para a frente de propósito, para que os móveis subam sem bater na fachada.",
      "Tem mais bicicletas do que habitantes e cerca de 165 canais.",
      "O anexo secreto onde Anne Frank escreveu o seu diário é hoje o seu museu mais visitado.",
    ],
    funFact: "Cerca de 12 000 a 15 000 bicicletas são retiradas dos canais de Amesterdão todos os anos.",
  },
  {
    id: "barcelona", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Evening_light_over_Barcelona.jpg/960px-Evening_light_over_Barcelona.jpg", name: "Barcelona", country: "Espanha", tier: "medium", emoji: "🦎",
    clues: [
      "O seu bairro em grelha, o Eixample, tem esquinas chanfradas características.",
      "A língua local nas suas placas de rua não é a língua principal do país.",
      "A sua basílica mais famosa está em construção desde 1882.",
    ],
    funFact: "A Sagrada Família está em construção há mais tempo do que demorou a erguer a Grande Pirâmide de Gizé.",
  },
  {
    id: "istanbul", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg/960px-Historical_peninsula_and_modern_skyline_of_Istanbul.jpg", name: "Istambul", country: "Turquia", tier: "medium", emoji: "⛵",
    clues: [
      "É a única grande cidade que se estende por dois continentes.",
      "Foi capital de três impérios: Romano, Bizantino e Otomano.",
      "O seu Grande Bazar tem mais de 4000 lojas debaixo do mesmo teto.",
    ],
    funFact: "O Grande Bazar de Istambul atrai até 400 000 visitantes por dia — mais do que a maioria dos parques temáticos.",
  },
  {
    id: "dubai", imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/Burj_Khalifa_2021.jpg/960px-Burj_Khalifa_2021.jpg", name: "Dubai", country: "Emirados Árabes Unidos", tier: "medium", emoji: "🏗️",
    clues: [
      "Em 1990 tinha um arranha-céus; hoje tem um dos horizontes mais altos do planeta.",
      "Construiu ilhas artificiais em forma de palmeira, visíveis do espaço.",
      "O edifício mais alto do mundo, com 828 metros, domina o seu horizonte.",
    ],
    funFact: "O Burj Khalifa é tão alto que se pode ver o pôr do sol duas vezes — uma no solo, outra no topo.",
  },
  {
    id: "singapore", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Flag_of_Singapore.svg/960px-Flag_of_Singapore.svg.png", name: "Singapura", country: "Singapura", tier: "medium", emoji: "🦁",
    clues: [
      "Esta cidade É o seu país — um dos poucos verdadeiros estados-cidade que restam.",
      "A venda de pastilha elástica está proibida aqui desde 1992.",
      "O seu aeroporto tem uma cascata interior de 40 metros, a mais alta do mundo.",
    ],
    funFact: "O Aeroporto de Changi, em Singapura, tem um jardim de borboletas, uma piscina no terraço e um cinema — tudo grátis para os viajantes.",
  },
  {
    id: "san-francisco", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/San_Francisco_Downtown_Aerial%2C_August_2025.jpg/960px-San_Francisco_Downtown_Aerial%2C_August_2025.jpg", name: "São Francisco", country: "Estados Unidos", tier: "medium", emoji: "🌉",
    clues: [
      "Os seus elétricos de cabo são o único Marco Histórico Nacional em movimento do país.",
      "Uma prisão numa ilha tristemente célebre fica no meio da sua baía.",
      "A sua ponte famosa está pintada de “laranja internacional”, não de dourado.",
    ],
    funFact: "A Golden Gate Bridge é repintada continuamente — quando as equipas terminam, é hora de recomeçar.",
  },
  {
    id: "venice", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Venezia_aerial_view.jpg/960px-Venezia_aerial_view.jpg", name: "Veneza", country: "Itália", tier: "medium", emoji: "🛥️",
    clues: [
      "Foi construída sobre 118 pequenas ilhas ligadas por mais de 400 pontes.",
      "Não tem estradas para carros — tudo se move de barco ou a pé.",
      "Os seus gondoleiros têm de ter licença, e há apenas cerca de 400.",
    ],
    funFact: "Os edifícios de Veneza assentam em milhões de estacas de madeira cravadas na lama há mais de 1000 anos — e ainda aguentam.",
  },
  {
    id: "prague", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prague_%286365119737%29.jpg/960px-Prague_%286365119737%29.jpg", name: "Praga", country: "Chéquia", tier: "medium", emoji: "🏰",
    clues: [
      "O seu complexo de castelo é o maior castelo antigo do mundo em área.",
      "Um relógio astronómico com 600 anos faz um espetáculo de hora a hora na praça da sua cidade velha.",
      "Tem a alcunha de “Cidade das Cem Torres”.",
    ],
    funFact: "O Relógio Astronómico de Praga, de 1410, é o mais antigo ainda em funcionamento.",
  },

  // ——— HARD ———
  {
    id: "reykjavik", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg/960px-Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg", name: "Reiquiavique", country: "Islândia", tier: "hard", emoji: "🌋",
    clues: [
      "É a capital mais a norte de um estado soberano.",
      "A maior parte dos seus edifícios é aquecida diretamente por água geotérmica.",
      "No pico do verão, o sol quase não se põe; no pico do inverno, a luz do dia dura cerca de quatro horas.",
    ],
    funFact: "Reiquiavique significa “Baía Fumegante” — os primeiros colonos confundiram o vapor geotérmico com fumo.",
  },
  {
    id: "marrakesh", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Pavillon_Menarag%C3%A4rten.jpg/960px-Pavillon_Menarag%C3%A4rten.jpg", name: "Marraquexe", country: "Marrocos", tier: "hard", emoji: "🕌",
    clues: [
      "A sua medina é Património da UNESCO, com um labirinto de souks debaixo de um vasto teto.",
      "Tem a alcunha de “Cidade Vermelha” pelas suas muralhas e edifícios de arenito.",
      "A sua praça principal, Jemaa el-Fna, enche-se todas as noites de contadores de histórias e bancas de comida.",
    ],
    funFact: "Por lei, os edifícios da cidade velha de Marraquexe têm de ser pintados em tons do vermelho-ocre típico da cidade.",
  },
  {
    id: "kyoto", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiyomizu.jpg/960px-Kiyomizu.jpg", name: "Quioto", country: "Japão", tier: "hard", emoji: "⛩️",
    clues: [
      "Foi a capital do país durante mais de 1000 anos antes de perder o título.",
      "Tem cerca de 1600 templos budistas e 400 santuários xintoístas.",
      "Um pavilhão reluzente coberto de folha de ouro fica junto a um lago-espelho, a noroeste.",
    ],
    funFact: "Quioto foi poupada aos bombardeamentos da Segunda Guerra Mundial em parte porque um responsável norte-americano lá passara a lua de mel e defendeu o seu valor cultural.",
  },
  {
    id: "cusco", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Vista_Calle_Suecia.jpg/960px-Vista_Calle_Suecia.jpg", name: "Cusco", country: "Peru", tier: "hard", emoji: "🦙",
    clues: [
      "Fica a 3400 metros de altitude — os visitantes precisam muitas vezes de dias para se aclimatarem.",
      "Foi a capital do maior império da América pré-colombiana.",
      "É a porta de entrada para uma famosa cidadela do século XV escondida nas montanhas.",
    ],
    funFact: "As paredes incas de Cusco têm pedras cortadas com tal precisão que nem um cartão de crédito passa entre elas — sem argamassa.",
  },
  {
    id: "tallinn", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Raekoja_plats_at_night.jpg/960px-Raekoja_plats_at_night.jpg", name: "Taline", country: "Estónia", tier: "hard", emoji: "🛡️",
    clues: [
      "A sua cidade velha medieval é uma das mais bem preservadas do norte da Europa.",
      "O seu país foi pioneiro na residência eletrónica e no voto online.",
      "Fica no Golfo da Finlândia, a uma curta viagem de ferry de Helsínquia.",
    ],
    funFact: "Taline ofereceu transportes públicos gratuitos a todos os residentes em 2013 — uma das primeiras capitais a fazê-lo.",
  },
  {
    id: "cartagena", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Museo_Naval_del_Caribe.JPG/960px-Museo_Naval_del_Caribe.JPG", name: "Cartagena", country: "Colômbia", tier: "hard", emoji: "🏴‍☠️",
    clues: [
      "As suas enormes muralhas de pedra foram erguidas para repelir os constantes ataques de piratas.",
      "Foi um dos principais portos para enviar o ouro do Novo Mundo para Espanha.",
      "A sua colorida cidade velha colonial dá para o mar das Caraíbas.",
    ],
    funFact: "As fortificações de Cartagena demoraram quase dois séculos a concluir — as mais extensas da América do Sul.",
  },
  {
    id: "luang-prabang", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Phou_si_Luang_Prabang_Laos_%E3%83%97%E3%83%BC%E3%82%B7%E3%83%BC%E3%81%AE%E4%B8%98_%E3%83%A9%E3%82%AA%E3%82%B9%E3%83%BB%E3%83%AB%E3%82%A2%E3%83%B3%E3%83%97%E3%83%A9%E3%83%90%E3%83%BC%E3%83%B3_DSCF6777.jpg/960px-Phou_si_Luang_Prabang_Laos_%E3%83%97%E3%83%BC%E3%82%B7%E3%83%BC%E3%81%AE%E4%B8%98_%E3%83%A9%E3%82%AA%E3%82%B9%E3%83%BB%E3%83%AB%E3%82%A2%E3%83%B3%E3%83%97%E3%83%A9%E3%83%90%E3%83%BC%E3%83%B3_DSCF6777.jpg", name: "Luang Prabang", country: "Laos", tier: "hard", emoji: "🧡",
    clues: [
      "Todas as madrugadas, centenas de monges de túnica cor de laranja percorrem as suas ruas a recolher esmolas.",
      "Fica na confluência do Mekong com um dos seus afluentes.",
      "Esta cidade real, classificada pela UNESCO, foi a capital do país até 1975.",
    ],
    funFact: "Todo o centro de Luang Prabang é Património Mundial da UNESCO — as construções novas têm de seguir regras patrimoniais rígidas.",
  },
  {
    id: "valparaiso", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Historic_Quarter_of_the_Seaport_City_of_Valpara%C3%ADso_04.jpg/330px-Historic_Quarter_of_the_Seaport_City_of_Valpara%C3%ADso_04.jpg", name: "Valparaíso", country: "Chile", tier: "hard", emoji: "🎨",
    clues: [
      "As suas colinas íngremes estão ligadas por funiculares centenários.",
      "Foi o porto mais importante do Pacífico antes da abertura do Canal do Panamá.",
      "As suas casas e escadarias de encosta estão cobertas de famosos murais de arte urbana.",
    ],
    funFact: "O poeta Pablo Neruda tinha uma peculiar casa de cinco andares em Valparaíso — hoje um dos museus mais visitados do Chile.",
  },

  // ——— EASY (expansion) ———
  {
    id: "moscow", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Saint_Basil%27s_Cathedral_and_the_Red_Square.jpg/960px-Saint_Basil%27s_Cathedral_and_the_Red_Square.jpg", name: "Moscovo", country: "Rússia", tier: "easy", emoji: "🏛️",
    clues: ["As suas estações de metro parecem palácios subterrâneos, com salões de mármore e candelabros.", "O seu núcleo histórico fortificado é conhecido como Kremlin.", "A sua Praça Vermelha é ladeada por uma catedral com cúpulas coloridas em forma de cebola."],
    funFact: "A Catedral de São Basílio tem nove capelas concebidas para parecerem chamas a subir para o céu.",
  },
  {
    id: "berlin", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg/960px-Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg", name: "Berlim", country: "Alemanha", tier: "easy", emoji: "🐻",
    clues: ["Um muro dividiu esta cidade em duas durante quase três décadas.", "Tem mais pontes do que Veneza e uma ilha no rio cheia de museus.", "O seu marco mais conhecido é o Portão de Brandemburgo."],
    funFact: "Berlim é cerca de nove vezes maior do que Paris em área, mas muito menos densamente povoada.",
  },
  {
    id: "toronto", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Toronto_Skyline_from_Olympic_Island%2C_June_20_2026_%285-3_cropped%29.jpg/960px-Toronto_Skyline_from_Olympic_Island%2C_June_20_2026_%285-3_cropped%29.jpg", name: "Toronto", country: "Canadá", tier: "easy", emoji: "🍁",
    clues: ["Uma torre em forma de agulha deteve o recorde de estrutura autónoma mais alta do mundo durante décadas.", "É a maior cidade do seu país, na margem do Lago Ontário.", "O seu país é famoso pelo xarope de ácer e pelo hóquei no gelo."],
    funFact: "Mais de metade dos residentes de Toronto nasceu fora do Canadá, o que a torna uma das cidades mais multiculturais do planeta.",
  },
  {
    id: "seoul", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg/960px-%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg", name: "Seul", country: "Coreia do Sul", tier: "easy", emoji: "🏯",
    clues: ["Um rio com o mesmo nome divide esta megacidade, atravessado por dezenas de pontes.", "Mistura palácios reais da dinastia Joseon com a casa do K-pop.", "É a capital da Coreia do Sul."],
    funFact: "Seul oferece uma das internets mais rápidas do planeta, com Wi-Fi público gratuito por toda a cidade.",
  },
  {
    id: "shanghai", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Huangpu_Park_20124-Shanghai_%2832208802494%29.jpg/960px-Huangpu_Park_20124-Shanghai_%2832208802494%29.jpg", name: "Xangai", country: "China", tier: "easy", emoji: "🌆",
    clues: ["A sua marginal, o Bund, dá para um horizonte futurista do outro lado do rio.", "É a maior cidade e o porto mais movimentado do seu país.", "A Torre Pérola do Oriente ergue-se sobre o seu bairro de Pudong."],
    funFact: "O comboio maglev de Xangai atinge 431 km/h — o serviço ferroviário comercial mais rápido do mundo.",
  },
  {
    id: "bangkok", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/4Y1A1159_Bangkok_%2833536795515%29.jpg/960px-4Y1A1159_Bangkok_%2833536795515%29.jpg", name: "Banguecoque", country: "Tailândia", tier: "easy", emoji: "🛕",
    clues: ["O seu nome cerimonial completo é o mais longo do mundo.", "Templos budistas dourados e canais valeram-lhe comparações com Veneza.", "É a capital da Tailândia."],
    funFact: "O nome cerimonial completo de Banguecoque tem 168 letras e detém um recorde do Guinness.",
  },
  {
    id: "beijing", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Skyline_of_Beijing_CBD_with_B-5906_approaching_%2820211016171955%29_%281%29.jpg/960px-Skyline_of_Beijing_CBD_with_B-5906_approaching_%2820211016171955%29_%281%29.jpg", name: "Pequim", country: "China", tier: "easy", emoji: "🏯",
    clues: ["Um vasto complexo palaciano murado no seu coração esteve vedado ao povo durante 500 anos.", "A Grande Muralha serpenteia pelas montanhas mesmo a norte.", "É a capital da China."],
    funFact: "A Cidade Proibida tem 9999 divisões — menos uma do que as 10 000 que se acreditava pertencerem só ao céu.",
  },
  {
    id: "los-angeles", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Hollywood_sign_%288485145044%29.jpg/960px-Hollywood_sign_%288485145044%29.jpg", name: "Los Angeles", country: "Estados Unidos", tier: "easy", emoji: "🎬",
    clues: ["Um letreiro branco numa encosta soletra o seu bairro do cinema.", "Estende-se pelo sul da Califórnia e é famosa pelo trânsito e pelas praias.", "É a casa de Hollywood."],
    funFact: "O letreiro de Hollywood dizia originalmente “HOLLYWOODLAND” e anunciava um empreendimento imobiliário.",
  },
  {
    id: "chicago", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Chicago_River_ferry_b.jpg/960px-Chicago_River_ferry_b.jpg", name: "Chicago", country: "Estados Unidos", tier: "easy", emoji: "🌃",
    clues: ["O primeiro arranha-céus moderno do mundo ergueu-se aqui em 1885.", "Fica num dos Grandes Lagos e tem a alcunha de “Cidade do Vento”.", "Uma gigantesca escultura espelhada em forma de feijão reflete o seu horizonte num parque central."],
    funFact: "Os engenheiros inverteram o sentido do rio Chicago em 1900, para que os resíduos da cidade corressem para longe da água potável.",
  },
  {
    id: "madrid", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg/960px-Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg", name: "Madrid", country: "Espanha", tier: "easy", emoji: "🎨",
    clues: ["O seu “triângulo de ouro” de museus de arte inclui o Prado.", "É a capital mais alta da Europa, num planalto no centro do país.", "É a capital de Espanha."],
    funFact: "O brasão de Madrid mostra um urso que se estica para um medronheiro.",
  },
  {
    id: "mexico-city", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg/960px-Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg", name: "Cidade do México", country: "México", tier: "easy", emoji: "🌮",
    clues: ["Foi construída sobre as ruínas da capital asteca de Tenochtitlan.", "Fica num vale alto e afunda lentamente no antigo leito do lago por baixo.", "É a capital do México."],
    funFact: "A Cidade do México afunda até 50 cm por ano, à medida que esgota o aquífero sob o seu antigo lago.",
  },
  {
    id: "mumbai", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Mumbai_Bandra-Worli_Sea_Link.jpg/960px-Mumbai_Bandra-Worli_Sea_Link.jpg", name: "Bombaim", country: "Índia", tier: "easy", emoji: "🌉",
    clues: ["É a casa da indústria de cinema mais prolífica do mundo, Bollywood.", "Uma ponte atirantada curva-se pela sua baía.", "É a capital financeira da Índia, no mar Arábico."],
    funFact: "Os dabbawalas de Bombaim entregam 200 000 almoços caseiros por dia, quase sem erros.",
  },
  {
    id: "delhi", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Jama_Masjid_2011.jpg/960px-Jama_Masjid_2011.jpg", name: "Deli", country: "Índia", tier: "easy", emoji: "🕌",
    clues: ["Serviu de capital a muitos impérios ao longo de mil anos.", "O seu bairro antigo é coroado pela vasta mesquita Jama Masjid.", "A sua área metropolitana é a região da capital da Índia."],
    funFact: "Deli foi destruída e reconstruída pelo menos sete vezes ao longo da sua longa história.",
  },
  {
    id: "miami", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Villa_Vizcaya_20110228.jpg/960px-Villa_Vizcaya_20110228.jpg", name: "Miami", country: "Estados Unidos", tier: "easy", emoji: "🌴",
    clues: ["O seu bairro Art Déco brilha em néon pastel ao longo da praia.", "É uma porta de entrada entre os Estados Unidos e a América Latina.", "Fica na costa quente do sul da Florida."],
    funFact: "Mais de metade dos residentes de Miami nasceu no estrangeiro, e a maioria fala espanhol em casa.",
  },
  {
    id: "las-vegas", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Las_Vegas_from_above_%2840064746644%29.jpg/960px-Las_Vegas_from_above_%2840064746644%29.jpg", name: "Las Vegas", country: "Estados Unidos", tier: "easy", emoji: "🎰",
    clues: ["A sua avenida principal recria Paris, Veneza e o antigo Egito lado a lado.", "Ergueu-se no deserto de Mojave como capital do jogo e do entretenimento.", "Tem a alcunha de “Cidade do Pecado”."],
    funFact: "Las Vegas tem tantos quartos de hotel que demoraria décadas a dormir uma noite em cada um.",
  },
  {
    id: "washington-dc", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/12-07-13-washington-by-RalfR-08.jpg/960px-12-07-13-washington-by-RalfR-08.jpg", name: "Washington", country: "Estados Unidos", tier: "easy", emoji: "🦅",
    clues: ["O seu horizonte é propositadamente baixo — nenhum edifício pode ofuscar o Capitólio.", "Um alto obelisco de mármore ergue-se no seu relvado central, o Mall.", "É a capital dos Estados Unidos."],
    funFact: "Por lei, os edifícios de Washington mantêm-se baixos, por isso a cidade quase não tem arranha-céus, apesar da sua importância.",
  },

  // ——— MEDIUM (expansion) ———
  {
    id: "cape-town", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Camps_bay_%2853460319478%29_%28cropped%29.jpg/960px-Camps_bay_%2853460319478%29_%28cropped%29.jpg", name: "Cidade do Cabo", country: "África do Sul", tier: "medium", emoji: "🏔️",
    clues: ["Uma montanha de topo plano ergue-se mesmo sobre esta cidade costeira.", "Fica perto do ponto de encontro de dois oceanos, no extremo sudoeste de África.", "É uma das três capitais da África do Sul."],
    funFact: "A Table Mountain está entre as montanhas mais antigas da Terra e alberga mais de 2200 espécies de plantas.",
  },
  {
    id: "buenos-aires", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg/960px-Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg", name: "Buenos Aires", country: "Argentina", tier: "medium", emoji: "💃",
    clues: ["Os seus habitantes chamam-se porteños — “gente do porto”.", "É o berço do tango, com bulevares ao estilo europeu.", "É a capital da Argentina."],
    funFact: "A avenida 9 de Julio, em Buenos Aires, é uma das mais largas do mundo, com até 16 faixas.",
  },
  {
    id: "vienna", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Schoenbrunn_philharmoniker_2012.jpg/960px-Schoenbrunn_philharmoniker_2012.jpg", name: "Viena", country: "Áustria", tier: "medium", emoji: "🎻",
    clues: ["Foi a casa de Mozart, Beethoven e Freud.", "O seu grandioso Palácio de Schönbrunn rivaliza com Versalhes.", "É a capital da Áustria, no Danúbio."],
    funFact: "Viena é regularmente considerada a cidade mais habitável do mundo.",
  },
  {
    id: "lisbon", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Lisboa_-_Portugal_%2852597836992%29.jpg/960px-Lisboa_-_Portugal_%2852597836992%29.jpg", name: "Lisboa", country: "Portugal", tier: "medium", emoji: "🚋",
    clues: ["Elétricos amarelos sobem as suas sete colinas íngremes, acima de um largo estuário.", "Um terramoto em 1755 remodelou grande parte da sua Baixa.", "É a capital de Portugal."],
    funFact: "Lisboa é uma das cidades mais antigas da Europa Ocidental, mais velha do que Roma por vários séculos.",
  },
  {
    id: "athens", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Monastiraki_Square_and_Acropolis_in_Athens_%2844149181684%29.jpg/960px-Monastiraki_Square_and_Acropolis_in_Athens_%2844149181684%29.jpg", name: "Atenas", country: "Grécia", tier: "medium", emoji: "🏺",
    clues: ["Tem o nome de uma deusa da sabedoria que, no mito, a ganhou com uma oliveira.", "Um templo de mármore, o Pártenon, coroa a sua cidadela antiga.", "É a capital da Grécia e o berço da democracia."],
    funFact: "Atenas está habitada de forma contínua há mais de 3400 anos.",
  },
  {
    id: "kuala-lumpur", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Bukit_Bintang_junction_in_2024_2.jpg/960px-Bukit_Bintang_junction_in_2024_2.jpg", name: "Kuala Lumpur", country: "Malásia", tier: "medium", emoji: "🌇",
    clues: ["O seu nome significa “confluência lamacenta” em malaio.", "Duas torres prateadas ligadas por uma ponte aérea definem o seu horizonte.", "É a capital da Malásia."],
    funFact: "As Torres Petronas foram os edifícios mais altos do mundo entre 1998 e 2004.",
  },
  {
    id: "budapest", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg/960px-View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg", name: "Budapeste", country: "Hungria", tier: "medium", emoji: "🌉",
    clues: ["Formou-se quando duas cidades em margens opostas do Danúbio se juntaram.", "É famosa pelas grandiosas casas de banhos termais alimentadas por fontes quentes.", "É a capital da Hungria."],
    funFact: "Budapeste assenta sobre mais de 100 fontes termais e é uma cidade termal desde os tempos romanos.",
  },
  {
    id: "warsaw", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Aleja_Niepdleglosci_Warsaw_2022_aerial_%28cropped%29.jpg/960px-Aleja_Niepdleglosci_Warsaw_2022_aerial_%28cropped%29.jpg", name: "Varsóvia", country: "Polónia", tier: "medium", emoji: "🏙️",
    clues: ["A sua cidade velha foi reconstruída tijolo a tijolo após uma destruição quase total na guerra.", "Uma sereia é o seu símbolo cívico oficial.", "É a capital da Polónia."],
    funFact: "A Cidade Velha reconstruída de Varsóvia é Património da UNESCO precisamente por ter sido reconstruída com tanta fidelidade.",
  },
  {
    id: "helsinki", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Suomenlinna_%28cropped%29.jpg/960px-Suomenlinna_%28cropped%29.jpg", name: "Helsínquia", country: "Finlândia", tier: "medium", emoji: "🏰",
    clues: ["Uma fortaleza marítima em ilhas guarda o seu porto.", "É uma capital nórdica de design depurado e longos invernos.", "É a capital da Finlândia."],
    funFact: "A fortaleza marítima de Suomenlinna, em Helsínquia, estende-se por oito ilhas e é Património da UNESCO.",
  },
  {
    id: "dublin", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Dublin_-_aerial_-_2025-07-07_01.jpg/960px-Dublin_-_aerial_-_2025-07-07_01.jpg", name: "Dublin", country: "Irlanda", tier: "medium", emoji: "☘️",
    clues: ["Os escritores James Joyce e Oscar Wilde chamaram-lhe casa.", "Uma cerveja preta escura nasceu numa fábrica aqui, em 1759.", "É a capital da Irlanda."],
    funFact: "A fábrica da Guinness, em Dublin, assinou um dia um arrendamento de 9000 anos para o seu terreno.",
  },
  {
    id: "oslo", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Nationaltheatret_evening.jpg/960px-Nationaltheatret_evening.jpg", name: "Oslo", country: "Noruega", tier: "medium", emoji: "🎭",
    clues: ["Fica no topo de um longo fiorde rodeado por colinas florestadas.", "Atribui todos os anos o Prémio Nobel da Paz.", "É a capital da Noruega."],
    funFact: "Oslo entrega o Prémio Nobel da Paz, o único Nobel que não é atribuído na Suécia.",
  },
  {
    id: "copenhagen", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/2018_-_Christiansborg_from_the_Marble_Bridge.jpg/960px-2018_-_Christiansborg_from_the_Marble_Bridge.jpg", name: "Copenhaga", country: "Dinamarca", tier: "medium", emoji: "🚲",
    clues: ["Uma pequena sereia de bronze está sentada numa rocha do seu porto.", "Mais gente se desloca aqui de bicicleta do que de carro.", "É a capital da Dinamarca."],
    funFact: "Copenhaga tem mais bicicletas do que habitantes, e os ciclistas superam os carros no centro.",
  },
  {
    id: "zurich", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Altstadt_Z%C3%BCrich_2015.jpg/960px-Altstadt_Z%C3%BCrich_2015.jpg", name: "Zurique", country: "Suíça", tier: "medium", emoji: "🏦",
    clues: ["Fica na ponta de um lago com os Alpes no horizonte.", "É um polo global da banca e da riqueza privada.", "É a maior cidade da Suíça."],
    funFact: "Zurique lidera regularmente os índices de qualidade de vida — e os dos salários mais altos do mundo.",
  },
  {
    id: "munich", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Stadtbild_M%C3%BCnchen.jpg/960px-Stadtbild_M%C3%BCnchen.jpg", name: "Munique", country: "Alemanha", tier: "medium", emoji: "🍺",
    clues: ["Realiza todos os outonos o maior festival de cerveja do mundo.", "Fica ao pé dos Alpes da Baviera.", "É a capital da Baviera, no sul da Alemanha."],
    funFact: "O Oktoberfest de Munique atrai cerca de seis milhões de visitantes, que bebem mais de sete milhões de litros de cerveja.",
  },
  {
    id: "montreal", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Montreal%2C_Quebec_skyline.jpg/960px-Montreal%2C_Quebec_skyline.jpg", name: "Montreal", country: "Canadá", tier: "medium", emoji: "⛪",
    clues: ["É a maior cidade de língua francesa das Américas.", "Uma colina chamada Mont Royal dá-lhe o nome.", "É o coração cultural do Quebec, no Canadá."],
    funFact: "Montreal tem uma rede de 33 km de túneis subterrâneos, para que as pessoas evitem os invernos rigorosos.",
  },
  {
    id: "stockholm", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Royal_Dramatic_Theatre_Stockholm.jpg/960px-Royal_Dramatic_Theatre_Stockholm.jpg", name: "Estocolmo", country: "Suécia", tier: "medium", emoji: "👑",
    clues: ["Foi construída sobre 14 ilhas ligadas por dezenas de pontes.", "Acolhe a maioria das cerimónias do Prémio Nobel todos os dezembros.", "É a capital da Suécia."],
    funFact: "O metro depurado de Estocolmo é muitas vezes chamado a maior galeria de arte do mundo, estação a estação.",
  },
  {
    id: "brussels", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Grand_Place_Bruselas_2.jpg/960px-Grand_Place_Bruselas_2.jpg", name: "Bruxelas", country: "Bélgica", tier: "medium", emoji: "🍟",
    clues: ["A sua ornamentada praça central, a Grand-Place, é uma joia da UNESCO.", "Acolhe a sede da União Europeia.", "É a capital da Bélgica."],
    funFact: "Bruxelas homenageia uma estatueta de um menino a urinar, vestida com centenas de trajes ao longo do ano.",
  },

  // ——— HARD (expansion) ———
  {
    id: "tbilisi", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/View_of_Tbilisi_from_Tabori_Church_2023-10-08-2.jpg/960px-View_of_Tbilisi_from_Tabori_Church_2023-10-08-2.jpg", name: "Tbilisi", country: "Geórgia", tier: "hard", emoji: "♨️",
    clues: ["O seu nome vem de uma palavra antiga para “quente”, por causa das suas fontes sulfurosas.", "Estende-se por um rio, abaixo de uma fortaleza no cimo de uma colina chamada Narikala.", "É a capital da Geórgia, no Cáucaso."],
    funFact: "Diz a lenda que um rei fundou Tbilisi depois de o seu falcão cair numa fonte termal natural.",
  },
  {
    id: "ljubljana", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Ljubljana_Old_Town%2C_Slovenia_%28Old_Camera%29_%2833286165680%29.jpg/960px-Ljubljana_Old_Town%2C_Slovenia_%28Old_Camera%29_%2833286165680%29.jpg", name: "Liubliana", country: "Eslovénia", tier: "hard", emoji: "🐉",
    clues: ["Um dragão é o seu símbolo cívico, a guardar uma ponte famosa.", "Um castelo no cimo de uma colina domina a sua cidade velha sem carros, junto a um pequeno rio.", "É a compacta capital da Eslovénia."],
    funFact: "Pensa-se que o nome de Liubliana esteja ligado a uma palavra eslava para “amada”.",
  },
  {
    id: "bruges", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Br%C3%BCgge_Blick_vom_Belfried_4.jpg/960px-Br%C3%BCgge_Blick_vom_Belfried_4.jpg", name: "Bruges", country: "Bélgica", tier: "hard", emoji: "🍫",
    clues: ["Os seus canais medievais valeram-lhe a alcunha de “Veneza do Norte”.", "Uma alta torre sineira domina a sua praça de mercado calcetada.", "É uma cidade medieval preservada na Bélgica, famosa pelo chocolate e pela renda."],
    funFact: "Bruges foi uma das cidades comerciais mais importantes do mundo lá no século XIII.",
  },
  {
    id: "chefchaouen", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Chefchaouen_%2852189357475%29.jpg/960px-Chefchaouen_%2852189357475%29.jpg", name: "Chefchaouen", country: "Marrocos", tier: "hard", emoji: "🔵",
    clues: ["Quase todas as paredes e ruelas da sua cidade velha estão pintadas de azul.", "Fica nas montanhas do Rife, no norte de Marrocos.", "Tem a alcunha de “Pérola Azul”."],
    funFact: "Ninguém sabe ao certo porque é que Chefchaouen é azul — as teorias vão do arrefecimento a repelir mosquitos.",
  },
  {
    id: "samarkand", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/RegistanSquare_Samarkand.jpg/960px-RegistanSquare_Samarkand.jpg", name: "Samarcanda", country: "Usbequistão", tier: "hard", emoji: "🕌",
    clues: ["Foi uma joia da antiga Rota da Seda sob o conquistador Tamerlão.", "A sua praça Registan é emoldurada por três madraças revestidas de azulejos.", "É uma das cidades mais antigas da Ásia Central, no Usbequistão."],
    funFact: "Samarcanda tem mais de 2700 anos — praticamente a mesma idade que Roma.",
  },
  {
    id: "edinburgh", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Skyline_of_Edinburgh.jpg/960px-Skyline_of_Edinburgh.jpg", name: "Edimburgo", country: "Escócia", tier: "hard", emoji: "🏰",
    clues: ["Um castelo assenta sobre um vulcão extinto, acima da sua cidade velha.", "Acolhe todos os agostos o maior festival de artes do mundo.", "É a capital da Escócia."],
    funFact: "Edimburgo formou um dos primeiros corpos de bombeiros municipais organizados do mundo, lá em 1824.",
  },
  {
    id: "bergen", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Bergen_panorama_at_night_-_panoramio_%281%29.jpg/960px-Bergen_panorama_at_night_-_panoramio_%281%29.jpg", name: "Bergen", country: "Noruega", tier: "hard", emoji: "🐟",
    clues: ["Uma fila de casas de madeira coloridas alinha o seu antigo cais.", "Está rodeada por sete montanhas e é uma porta de entrada para os fiordes.", "É a segunda cidade da Noruega, na costa oeste."],
    funFact: "Bergen é uma das cidades mais chuvosas da Europa, com chuva em cerca de 240 dias por ano.",
  },
  {
    id: "ghent", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Gent%2C_de_Graslei_vanaf_de_Korenlei_met_oeg24758tm61%2B25159_IMG_0447_2021-08-13_18.37.jpg/960px-Gent%2C_de_Graslei_vanaf_de_Korenlei_met_oeg24758tm61%2B25159_IMG_0447_2021-08-13_18.37.jpg", name: "Gante", country: "Bélgica", tier: "hard", emoji: "⛪",
    clues: ["Casas de guilda alinham os cais do seu porto fluvial medieval.", "Guarda o célebre retábulo de van Eyck, o Retábulo de Gante.", "É uma histórica cidade flamenga na Bélgica."],
    funFact: "O Retábulo de Gante é uma das obras de arte mais roubadas da história, levada pelo menos uma dúzia de vezes.",
  },
  {
    id: "lviv", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/%D0%9B%D0%B0%D1%82%D0%B8%D0%BD%D1%81%D1%8C%D0%BA%D0%B8%D0%B9_%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D0%B0%D0%BB%D1%8C%D0%BD%D0%B8%D0%B9_%D1%81%D0%BE%D0%B1%D0%BE%D1%80_%28%D0%9B%D1%8C%D0%B2%D1%96%D0%B2%29_16.jpg/960px-%D0%9B%D0%B0%D1%82%D0%B8%D0%BD%D1%81%D1%8C%D0%BA%D0%B8%D0%B9_%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D0%B0%D0%BB%D1%8C%D0%BD%D0%B8%D0%B9_%D1%81%D0%BE%D0%B1%D0%BE%D1%80_%28%D0%9B%D1%8C%D0%B2%D1%96%D0%B2%29_16.jpg", name: "Lviv", country: "Ucrânia", tier: "hard", emoji: "🎭",
    clues: ["A sua cidade velha calcetada mistura história polaca, austríaca e ucraniana.", "É famosa pelas casas de café e pelo chocolate, no oeste da Ucrânia.", "É a capital cultural do oeste da Ucrânia."],
    funFact: "Diz-se que Lviv tem a maior concentração de casas de café por pessoa da Ucrânia.",
  },
  {
    id: "yerevan", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Mount_Ararat_and_the_Yerevan_skyline_%28June_2018%29.jpg/960px-Mount_Ararat_and_the_Yerevan_skyline_%28June_2018%29.jpg", name: "Erevan", country: "Arménia", tier: "hard", emoji: "🍑",
    clues: ["O Monte Ararat, coberto de neve, ergue-se sobre ela do outro lado da fronteira.", "É construída em grande parte com pedra vulcânica rosada local.", "É a capital da Arménia."],
    funFact: "Erevan é mais antiga do que Roma, fundada como fortaleza em 782 a.C.",
  },
  {
    id: "baku", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Baku_Montage.jpg/960px-Baku_Montage.jpg", name: "Baku", country: "Azerbaijão", tier: "hard", emoji: "🔥",
    clues: ["Três arranha-céus curvos em forma de chama iluminam o seu horizonte.", "Fica abaixo do nível do mar, na margem do mar Cáspio.", "É a capital do Azerbaijão, a “Terra do Fogo”."],
    funFact: "Baku fica cerca de 28 m abaixo do nível do mar, o que a torna a capital nacional mais baixa do mundo.",
  },
  {
    id: "valletta", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/St_Sebastian_Curtain_%28cropped%29.jpg/960px-St_Sebastian_Curtain_%28cropped%29.jpg", name: "Valeta", country: "Malta", tier: "hard", emoji: "🛡️",
    clues: ["Foi construída pelos Cavaleiros de São João como cidade-fortaleza.", "Uma das capitais mais pequenas da Europa, assenta numa península rochosa do Mediterrâneo.", "É a capital de Malta."],
    funFact: "A Valeta reúne 320 monumentos em apenas 0,8 km², uma das zonas históricas mais densas do mundo.",
  },
  {
    id: "riga", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Riga_%2833844464828%29.jpg/960px-Riga_%2833844464828%29.jpg", name: "Riga", country: "Letónia", tier: "hard", emoji: "🎄",
    clues: ["Tem uma das melhores coleções de arquitetura Arte Nova da Europa.", "Fica num rio perto do mar Báltico.", "É a capital da Letónia."],
    funFact: "Riga reivindica a primeira árvore de Natal decorada de sempre, erguida na sua praça em 1510.",
  },
  {
    id: "bratislava", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Slovakia_bratislava.jpg/960px-Slovakia_bratislava.jpg", name: "Bratislava", country: "Eslováquia", tier: "hard", emoji: "🏰",
    clues: ["Um castelo branco e quadrado assenta numa colina acima do Danúbio.", "É a única capital nacional que faz fronteira com dois outros países.", "É a capital da Eslováquia."],
    funFact: "Bratislava faz fronteira com a Áustria e com a Hungria — a única capital que toca em dois países.",
  },
  {
    id: "sarajevo", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Sarajevo_City_Panorama.JPG/960px-Sarajevo_City_Panorama.JPG", name: "Sarajevo", country: "Bósnia e Herzegovina", tier: "hard", emoji: "🌉",
    clues: ["Mesquitas, igrejas e sinagogas erguem-se a poucas ruas umas das outras.", "Um assassínio nas suas ruas em 1914 ajudou a desencadear a Primeira Guerra Mundial.", "É a capital da Bósnia e Herzegovina."],
    funFact: "Sarajevo acolheu os Jogos Olímpicos de Inverno de 1984, uma década antes do seu longo cerco na guerra.",
  },
  {
    id: "porto", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Puente_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_13.JPG/960px-Puente_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_13.JPG", name: "Porto", country: "Portugal", tier: "hard", emoji: "🍷",
    clues: ["Uma ponte de ferro de dois níveis atravessa o rio até às suas caves de vinho.", "O vinho fortificado que exporta para todo o mundo tem o seu nome.", "É a segunda cidade de Portugal, na foz do Douro."],
    funFact: "O vinho do Porto envelhece do outro lado do rio, nas caves de Vila Nova de Gaia.",
  },
];
