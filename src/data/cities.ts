// Urban Legends dataset — cities with progressive clues (hardest first) and a
// fun fact revealed after each round. Tiers control difficulty and scoring.

export type CityTier = "easy" | "medium" | "hard";

export interface CityEntry {
  /** City photo (Wikimedia Commons); tinted green in the UI to fit the arcade look */
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
    id: "paris", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/960px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg", name: "Paris", country: "France", tier: "easy", emoji: "🗼",
    clues: [
      "Its metro system has more than 300 stations packed into a fairly small city core.",
      "It is nicknamed the 'City of Light' and is split by a famous river into Left and Right banks.",
      "Its iron tower, built for the 1889 World's Fair, was meant to be temporary.",
    ],
    funFact: "The Eiffel Tower grows about 15 cm taller in summer as the iron expands in the heat.",
  },
  {
    id: "london", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Skyline_%28125508655%29.jpeg/960px-London_Skyline_%28125508655%29.jpeg", name: "London", country: "United Kingdom", tier: "easy", emoji: "🎡",
    clues: [
      "Black cabs here must pass a legendary street-memory exam called 'The Knowledge'.",
      "Its underground railway is the oldest in the world, opened in 1863.",
      "A giant clock tower next to its parliament is one of the most filmed landmarks on Earth.",
    ],
    funFact: "Big Ben is actually the name of the bell, not the tower — the tower is called Elizabeth Tower.",
  },
  {
    id: "new-york", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/960px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg", name: "New York", country: "United States", tier: "easy", emoji: "🗽",
    clues: [
      "Its street grid was planned in 1811, long before most of the city existed.",
      "A rectangular park of 341 hectares sits in the middle of its densest island.",
      "A copper statue in its harbor was a gift from France in 1886.",
    ],
    funFact: "The Statue of Liberty was originally shiny copper brown — it took about 30 years to turn green.",
  },
  {
    id: "tokyo", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/960px-Skyscrapers_of_Shinjuku_2009_January.jpg", name: "Tokyo", country: "Japan", tier: "easy", emoji: "🏮",
    clues: [
      "Its metropolitan area is the most populous on the planet, with over 37 million people.",
      "It was called Edo until 1868, when the emperor moved in and renamed it.",
      "Its famous scramble crossing lets thousands of people cross in every direction at once.",
    ],
    funFact: "Tokyo has more Michelin-starred restaurants than any other city in the world.",
  },
  {
    id: "rome", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg/960px-Trevi_Fountain%2C_Rome%2C_Italy_2_-_May_2007.jpg", name: "Rome", country: "Italy", tier: "easy", emoji: "🏛️",
    clues: [
      "Legend says it was founded by twin brothers raised by a she-wolf.",
      "An entire sovereign country sits inside this city's borders.",
      "Its ancient amphitheatre could hold 50,000 spectators for gladiator fights.",
    ],
    funFact: "About €1.5 million in coins is tossed into the Trevi Fountain every year — it all goes to charity.",
  },
  {
    id: "sydney", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg/960px-Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg", name: "Sydney", country: "Australia", tier: "easy", emoji: "🛶",
    clues: [
      "It is not its country's capital, though most people assume it is.",
      "Its harbour bridge is nicknamed 'The Coathanger'.",
      "Its opera house's sail-shaped roofs took 14 years to build.",
    ],
    funFact: "The Sydney Opera House roof is covered in more than one million self-cleaning tiles.",
  },
  {
    id: "cairo", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg/960px-Cairo_Opera_House%2C_Al_Hurriyah_Park_and_the_Nile_river_%2814797782354%29.jpg", name: "Cairo", country: "Egypt", tier: "easy", emoji: "🐪",
    clues: [
      "It is the largest city in both Africa and the Arab world.",
      "A river that flows through it is the longest on its continent.",
      "The last surviving Wonder of the Ancient World stands on its outskirts.",
    ],
    funFact: "The Great Pyramid of Giza was the tallest human-made structure for over 3,800 years.",
  },
  {
    id: "rio", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Cidade_Maravilhosa.jpg/960px-Cidade_Maravilhosa.jpg", name: "Rio de Janeiro", country: "Brazil", tier: "easy", emoji: "🎭",
    clues: [
      "Its name means 'January River', though there is no river — explorers mistook the bay.",
      "Its annual carnival draws around two million people per day to the streets.",
      "A 30-metre statue with open arms watches the city from a mountain top.",
    ],
    funFact: "Christ the Redeemer is struck by lightning several times a year — it once lost a thumb to a storm.",
  },

  // ——— MEDIUM ———
  {
    id: "amsterdam", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png/960px-Imagen_de_los_canales_conc%C3%A9ntricos_en_%C3%81msterdam.png", name: "Amsterdam", country: "Netherlands", tier: "medium", emoji: "🚲",
    clues: [
      "Its houses lean forward on purpose, so furniture can be hoisted without hitting the façade.",
      "It has more bicycles than residents and around 165 canals.",
      "The hidden annex where Anne Frank wrote her diary is now its most visited museum.",
    ],
    funFact: "Around 12,000–15,000 bikes are fished out of Amsterdam's canals every year.",
  },
  {
    id: "barcelona", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Evening_light_over_Barcelona.jpg/960px-Evening_light_over_Barcelona.jpg", name: "Barcelona", country: "Spain", tier: "medium", emoji: "🦎",
    clues: [
      "Its grid district, the Eixample, has distinctive chamfered street corners.",
      "The local language on its street signs is not the country's main language.",
      "Its most famous basilica has been under construction since 1882.",
    ],
    funFact: "The Sagrada Família has been under construction longer than the Great Pyramid of Giza took to build.",
  },
  {
    id: "istanbul", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Historical_peninsula_and_modern_skyline_of_Istanbul.jpg/960px-Historical_peninsula_and_modern_skyline_of_Istanbul.jpg", name: "Istanbul", country: "Turkey", tier: "medium", emoji: "⛵",
    clues: [
      "It is the only major city that spans two continents.",
      "It has been the capital of three empires: Roman, Byzantine and Ottoman.",
      "Its Grand Bazaar has over 4,000 shops under one roof.",
    ],
    funFact: "Istanbul's Grand Bazaar attracts up to 400,000 visitors a day — more than most theme parks.",
  },
  {
    id: "dubai", imageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/Burj_Khalifa_2021.jpg/960px-Burj_Khalifa_2021.jpg", name: "Dubai", country: "United Arab Emirates", tier: "medium", emoji: "🏗️",
    clues: [
      "In 1990 it had one skyscraper; today it has one of the tallest skylines on Earth.",
      "It built palm-tree-shaped artificial islands visible from space.",
      "The world's tallest building, at 828 metres, dominates its skyline.",
    ],
    funFact: "The Burj Khalifa is so tall that you can watch the sunset twice — once from the ground, again from the top.",
  },
  {
    id: "singapore", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Flag_of_Singapore.svg/960px-Flag_of_Singapore.svg.png", name: "Singapore", country: "Singapore", tier: "medium", emoji: "🦁",
    clues: [
      "This city IS its country — one of only a few true city-states left.",
      "Chewing gum has been banned from sale here since 1992.",
      "Its airport has a 40-metre indoor waterfall, the tallest in the world.",
    ],
    funFact: "Singapore's Changi Airport has a butterfly garden, a rooftop pool and a movie theatre — all free for travellers.",
  },
  {
    id: "san-francisco", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/San_Francisco_Downtown_Aerial%2C_August_2025.jpg/960px-San_Francisco_Downtown_Aerial%2C_August_2025.jpg", name: "San Francisco", country: "United States", tier: "medium", emoji: "🌉",
    clues: [
      "Its cable cars are the only moving National Historic Landmark in its country.",
      "A notorious island prison sits in the middle of its bay.",
      "Its famous bridge is painted 'International Orange', not gold.",
    ],
    funFact: "The Golden Gate Bridge is repainted continuously — by the time crews finish, it's time to start again.",
  },
  {
    id: "venice", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Venezia_aerial_view.jpg/960px-Venezia_aerial_view.jpg", name: "Venice", country: "Italy", tier: "medium", emoji: "🛥️",
    clues: [
      "It is built on 118 small islands connected by over 400 bridges.",
      "It has no roads for cars — everything moves by boat or on foot.",
      "Its gondoliers must be licensed, and there are only about 400 of them.",
    ],
    funFact: "Venice's buildings stand on millions of wooden piles driven into the mud over 1,000 years ago — still holding.",
  },
  {
    id: "prague", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Prague_%286365119737%29.jpg/960px-Prague_%286365119737%29.jpg", name: "Prague", country: "Czech Republic", tier: "medium", emoji: "🏰",
    clues: [
      "Its castle complex is the largest ancient castle in the world by area.",
      "A 600-year-old astronomical clock performs an hourly show in its old town square.",
      "It is nicknamed the 'City of a Hundred Spires'.",
    ],
    funFact: "Prague's Astronomical Clock from 1410 is the oldest one still in operation.",
  },

  // ——— HARD ———
  {
    id: "reykjavik", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg/960px-Reykjav%C3%ADk%2C_view_from_Hallgr%C3%ADmskirkja_%282%29.jpg", name: "Reykjavik", country: "Iceland", tier: "hard", emoji: "🌋",
    clues: [
      "It is the northernmost capital of a sovereign state.",
      "Most of its buildings are heated directly by geothermal water.",
      "In midsummer, its sun barely sets; in midwinter, daylight lasts about four hours.",
    ],
    funFact: "Reykjavik means 'Smoky Bay' — early settlers mistook geothermal steam for smoke.",
  },
  {
    id: "marrakesh", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Pavillon_Menarag%C3%A4rten.jpg/960px-Pavillon_Menarag%C3%A4rten.jpg", name: "Marrakesh", country: "Morocco", tier: "hard", emoji: "🕌",
    clues: [
      "Its medina is a UNESCO site with a maze of souks under one vast roofline.",
      "It is nicknamed the 'Red City' for its sandstone walls and buildings.",
      "Its main square, Jemaa el-Fnaa, fills nightly with storytellers and food stalls.",
    ],
    funFact: "By law, buildings in Marrakesh's old town must be painted in shades of the city's signature red-ochre.",
  },
  {
    id: "kyoto", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Kiyomizu.jpg/960px-Kiyomizu.jpg", name: "Kyoto", country: "Japan", tier: "hard", emoji: "⛩️",
    clues: [
      "It was its country's capital for over 1,000 years before losing the title.",
      "It has around 1,600 Buddhist temples and 400 Shinto shrines.",
      "A shimmering gold-leaf pavilion sits by a mirror pond in its northwest.",
    ],
    funFact: "Kyoto was spared from WWII bombing partly because a US official had honeymooned there and argued for its cultural value.",
  },
  {
    id: "cusco", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Vista_Calle_Suecia.jpg/960px-Vista_Calle_Suecia.jpg", name: "Cusco", country: "Peru", tier: "hard", emoji: "🦙",
    clues: [
      "It sits at 3,400 metres altitude — visitors often need days to acclimatise.",
      "It was the capital of the largest empire in pre-Columbian America.",
      "It is the gateway to a famous 15th-century citadel hidden in the mountains.",
    ],
    funFact: "Inca walls in Cusco have stones cut so precisely that a credit card can't fit between them — no mortar needed.",
  },
  {
    id: "tallinn", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Raekoja_plats_at_night.jpg/960px-Raekoja_plats_at_night.jpg", name: "Tallinn", country: "Estonia", tier: "hard", emoji: "🛡️",
    clues: [
      "Its medieval old town is one of the best preserved in northern Europe.",
      "Its country pioneered e-residency and online voting.",
      "It sits on the Gulf of Finland, a short ferry ride from Helsinki.",
    ],
    funFact: "Tallinn offered free public transport to all residents back in 2013 — one of the first capitals to do so.",
  },
  {
    id: "cartagena", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Museo_Naval_del_Caribe.JPG/960px-Museo_Naval_del_Caribe.JPG", name: "Cartagena", country: "Colombia", tier: "hard", emoji: "🏴‍☠️",
    clues: [
      "Its massive stone walls were built to fend off constant pirate attacks.",
      "It was one of the main ports for shipping New World gold to Spain.",
      "Its colourful colonial old town overlooks the Caribbean Sea.",
    ],
    funFact: "Cartagena's fortifications took nearly two centuries to complete — the most extensive in South America.",
  },
  {
    id: "luang-prabang", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Phou_si_Luang_Prabang_Laos_%E3%83%97%E3%83%BC%E3%82%B7%E3%83%BC%E3%81%AE%E4%B8%98_%E3%83%A9%E3%82%AA%E3%82%B9%E3%83%BB%E3%83%AB%E3%82%A2%E3%83%B3%E3%83%97%E3%83%A9%E3%83%90%E3%83%BC%E3%83%B3_DSCF6777.jpg/960px-Phou_si_Luang_Prabang_Laos_%E3%83%97%E3%83%BC%E3%82%B7%E3%83%BC%E3%81%AE%E4%B8%98_%E3%83%A9%E3%82%AA%E3%82%B9%E3%83%BB%E3%83%AB%E3%82%A2%E3%83%B3%E3%83%97%E3%83%A9%E3%83%90%E3%83%BC%E3%83%B3_DSCF6777.jpg", name: "Luang Prabang", country: "Laos", tier: "hard", emoji: "🧡",
    clues: [
      "Every dawn, hundreds of orange-robed monks walk its streets collecting alms.",
      "It sits at the confluence of the Mekong and one of its tributaries.",
      "This UNESCO-listed royal city was its country's capital until 1975.",
    ],
    funFact: "Luang Prabang's entire town centre is a UNESCO World Heritage site — new buildings must follow strict heritage rules.",
  },
  {
    id: "valparaiso", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Historic_Quarter_of_the_Seaport_City_of_Valpara%C3%ADso_04.jpg/330px-Historic_Quarter_of_the_Seaport_City_of_Valpara%C3%ADso_04.jpg", name: "Valparaíso", country: "Chile", tier: "hard", emoji: "🎨",
    clues: [
      "Its steep hills are connected by century-old funicular elevators.",
      "It was the most important Pacific port before the Panama Canal opened.",
      "Its hillside houses and staircases are covered in famous street art murals.",
    ],
    funFact: "Poet Pablo Neruda owned a quirky five-storey house in Valparaíso — now one of Chile's most visited museums.",
  },
];
