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

  // ——— EASY (expansion) ———
  {
    id: "moscow", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Saint_Basil%27s_Cathedral_and_the_Red_Square.jpg/960px-Saint_Basil%27s_Cathedral_and_the_Red_Square.jpg", name: "Moscovo", country: "Rússia", tier: "easy", emoji: "🏛️",
    clues: ["Its metro stations look like underground palaces, with marble halls and chandeliers.", "Its historic fortified core is known as the Kremlin.", "Its Red Square is fronted by a cathedral with colourful onion domes."],
    funFact: "Saint Basil's Cathedral has nine chapels designed to look like flames rising into the sky.",
  },
  {
    id: "berlin", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg/960px-Museumsinsel_Berlin_Juli_2021_1_%28cropped%29_b.jpg", name: "Berlim", country: "Alemanha", tier: "easy", emoji: "🐻",
    clues: ["A wall split this city in two for nearly three decades.", "It has more bridges than Venice and a river-island full of museums.", "Its best-known landmark is the Brandenburg Gate."],
    funFact: "Berlin is about nine times larger than Paris by area, yet far less densely populated.",
  },
  {
    id: "toronto", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Toronto_Skyline_from_Olympic_Island%2C_June_20_2026_%285-3_cropped%29.jpg/960px-Toronto_Skyline_from_Olympic_Island%2C_June_20_2026_%285-3_cropped%29.jpg", name: "Toronto", country: "Canadá", tier: "easy", emoji: "🍁",
    clues: ["A needle-like tower held the record as the world's tallest free-standing structure for decades.", "It is the largest city of its country, on the shore of Lake Ontario.", "Its country is famous for maple syrup and ice hockey."],
    funFact: "Over half of Toronto's residents were born outside Canada, making it one of the most multicultural cities on Earth.",
  },
  {
    id: "seoul", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg/960px-%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg", name: "Seul", country: "Coreia do Sul", tier: "easy", emoji: "🏯",
    clues: ["A river of the same name splits this megacity, crossed by dozens of bridges.", "It blends royal Joseon palaces with the home of K-pop.", "It is the capital of South Korea."],
    funFact: "Seoul offers some of the fastest internet on the planet, with free public Wi-Fi across the city.",
  },
  {
    id: "shanghai", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Huangpu_Park_20124-Shanghai_%2832208802494%29.jpg/960px-Huangpu_Park_20124-Shanghai_%2832208802494%29.jpg", name: "Xangai", country: "China", tier: "easy", emoji: "🌆",
    clues: ["Its waterfront promenade, the Bund, faces a futuristic skyline across the river.", "It is its country's largest city and busiest port.", "The Oriental Pearl Tower rises over its Pudong district."],
    funFact: "Shanghai's maglev train hits 431 km/h — the fastest commercial train service in the world.",
  },
  {
    id: "bangkok", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/4Y1A1159_Bangkok_%2833536795515%29.jpg/960px-4Y1A1159_Bangkok_%2833536795515%29.jpg", name: "Banguecoque", country: "Tailândia", tier: "easy", emoji: "🛕",
    clues: ["Its full ceremonial name is the longest city name in the world.", "Golden Buddhist temples and canals earned it comparisons to Venice.", "It is the capital of Thailand."],
    funFact: "Bangkok's full ceremonial name runs to 168 letters and holds a Guinness world record.",
  },
  {
    id: "beijing", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Skyline_of_Beijing_CBD_with_B-5906_approaching_%2820211016171955%29_%281%29.jpg/960px-Skyline_of_Beijing_CBD_with_B-5906_approaching_%2820211016171955%29_%281%29.jpg", name: "Pequim", country: "China", tier: "easy", emoji: "🏯",
    clues: ["A vast walled palace complex at its heart was off-limits to commoners for 500 years.", "The Great Wall winds through the mountains just north of it.", "It is the capital of China."],
    funFact: "The Forbidden City has 9,999 rooms — one short of the 10,000 believed to belong only to heaven.",
  },
  {
    id: "los-angeles", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Hollywood_sign_%288485145044%29.jpg/960px-Hollywood_sign_%288485145044%29.jpg", name: "Los Angeles", country: "Estados Unidos", tier: "easy", emoji: "🎬",
    clues: ["A white hillside sign spells out its film district.", "It sprawls across Southern California and is famous for traffic and beaches.", "It is the home of Hollywood."],
    funFact: "The Hollywood sign originally read 'HOLLYWOODLAND' and advertised a housing development.",
  },
  {
    id: "chicago", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Chicago_River_ferry_b.jpg/960px-Chicago_River_ferry_b.jpg", name: "Chicago", country: "Estados Unidos", tier: "easy", emoji: "🌃",
    clues: ["The world's first modern skyscraper rose here in 1885.", "It sits on a Great Lake and is nicknamed the 'Windy City'.", "A giant mirrored bean sculpture reflects its skyline in a downtown park."],
    funFact: "Engineers reversed the flow of the Chicago River in 1900 so the city's waste flowed away from its drinking water.",
  },
  {
    id: "madrid", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg/960px-Plaza_Mayor_De_Madrid_%28215862629%29_edited.jpeg", name: "Madrid", country: "Espanha", tier: "easy", emoji: "🎨",
    clues: ["Its 'golden triangle' of art museums includes the Prado.", "It is the highest capital city in Europe, on a plateau in the centre of its country.", "It is the capital of Spain."],
    funFact: "Madrid's coat of arms features a bear reaching for a strawberry tree.",
  },
  {
    id: "mexico-city", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg/960px-Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg", name: "Cidade do México", country: "México", tier: "easy", emoji: "🌮",
    clues: ["It was built on the ruins of the Aztec capital Tenochtitlan.", "It sits in a high valley and slowly sinks into the old lakebed beneath it.", "It is the capital of Mexico."],
    funFact: "Mexico City is sinking up to 50 cm a year as it drains the aquifer under its former lake.",
  },
  {
    id: "mumbai", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Mumbai_Bandra-Worli_Sea_Link.jpg/960px-Mumbai_Bandra-Worli_Sea_Link.jpg", name: "Bombaim", country: "Índia", tier: "easy", emoji: "🌉",
    clues: ["It is the home of the world's most prolific film industry, Bollywood.", "A cable-stayed sea link curves across its bay.", "It is India's financial capital, on the Arabian Sea."],
    funFact: "Mumbai's dabbawalas deliver 200,000 home-cooked lunches a day with almost no errors.",
  },
  {
    id: "delhi", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Jama_Masjid_2011.jpg/960px-Jama_Masjid_2011.jpg", name: "Deli", country: "Índia", tier: "easy", emoji: "🕌",
    clues: ["It has served as a capital for many empires across a thousand years.", "Its old quarter is crowned by the vast Jama Masjid mosque.", "Its metropolitan area is the capital region of India."],
    funFact: "Delhi has been destroyed and rebuilt at least seven times through its long history.",
  },
  {
    id: "miami", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Villa_Vizcaya_20110228.jpg/960px-Villa_Vizcaya_20110228.jpg", name: "Miami", country: "Estados Unidos", tier: "easy", emoji: "🌴",
    clues: ["Its Art Deco district glows in pastel neon along the beach.", "It is a gateway between the United States and Latin America.", "It sits on the warm coast of southern Florida."],
    funFact: "More than half of Miami's residents were born abroad, and most speak Spanish at home.",
  },
  {
    id: "las-vegas", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Las_Vegas_from_above_%2840064746644%29.jpg/960px-Las_Vegas_from_above_%2840064746644%29.jpg", name: "Las Vegas", country: "Estados Unidos", tier: "easy", emoji: "🎰",
    clues: ["Its main strip recreates Paris, Venice and ancient Egypt side by side.", "It rose out of the Mojave Desert as a gambling and entertainment capital.", "It is nicknamed 'Sin City'."],
    funFact: "Las Vegas has so many hotel rooms that it would take decades to sleep one night in each.",
  },
  {
    id: "washington-dc", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/12-07-13-washington-by-RalfR-08.jpg/960px-12-07-13-washington-by-RalfR-08.jpg", name: "Washington", country: "Estados Unidos", tier: "easy", emoji: "🦅",
    clues: ["Its skyline is deliberately low — no building may overshadow the Capitol.", "A tall marble obelisk stands on its central grassy Mall.", "It is the capital of the United States."],
    funFact: "By law, Washington's buildings stay low, so it has almost no skyscrapers despite its importance.",
  },

  // ——— MEDIUM (expansion) ———
  {
    id: "cape-town", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Camps_bay_%2853460319478%29_%28cropped%29.jpg/960px-Camps_bay_%2853460319478%29_%28cropped%29.jpg", name: "Cidade do Cabo", country: "África do Sul", tier: "medium", emoji: "🏔️",
    clues: ["A flat-topped mountain looms directly over this coastal city.", "It lies near the meeting point of two oceans at Africa's south-west tip.", "It is one of South Africa's three capital cities."],
    funFact: "Table Mountain is among the oldest mountains on Earth and hosts over 2,200 plant species.",
  },
  {
    id: "buenos-aires", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg/960px-Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg", name: "Buenos Aires", country: "Argentina", tier: "medium", emoji: "💃",
    clues: ["Its residents are called porteños — 'people of the port'.", "It is the birthplace of tango, with European-style boulevards.", "It is the capital of Argentina."],
    funFact: "The 9 de Julio avenue in Buenos Aires is one of the widest in the world, with up to 16 lanes.",
  },
  {
    id: "vienna", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Schoenbrunn_philharmoniker_2012.jpg/960px-Schoenbrunn_philharmoniker_2012.jpg", name: "Viena", country: "Áustria", tier: "medium", emoji: "🎻",
    clues: ["It was home to Mozart, Beethoven and Freud.", "Its grand Schönbrunn Palace rivals Versailles.", "It is the capital of Austria, on the Danube."],
    funFact: "Vienna is regularly ranked the most liveable city in the world.",
  },
  {
    id: "lisbon", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Lisboa_-_Portugal_%2852597836992%29.jpg/960px-Lisboa_-_Portugal_%2852597836992%29.jpg", name: "Lisboa", country: "Portugal", tier: "medium", emoji: "🚋",
    clues: ["Yellow trams climb its seven steep hills above a wide river estuary.", "A 1755 earthquake reshaped much of its downtown grid.", "It is the capital of Portugal."],
    funFact: "Lisbon is one of the oldest cities in Western Europe, predating Rome by centuries.",
  },
  {
    id: "athens", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Monastiraki_Square_and_Acropolis_in_Athens_%2844149181684%29.jpg/960px-Monastiraki_Square_and_Acropolis_in_Athens_%2844149181684%29.jpg", name: "Atenas", country: "Grécia", tier: "medium", emoji: "🏺",
    clues: ["It is named after a goddess of wisdom who, in myth, won it with an olive tree.", "A marble temple, the Parthenon, crowns its ancient citadel.", "It is the capital of Greece and cradle of democracy."],
    funFact: "Athens has been continuously inhabited for over 3,400 years.",
  },
  {
    id: "kuala-lumpur", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Bukit_Bintang_junction_in_2024_2.jpg/960px-Bukit_Bintang_junction_in_2024_2.jpg", name: "Kuala Lumpur", country: "Malásia", tier: "medium", emoji: "🌇",
    clues: ["Its name means 'muddy confluence' in Malay.", "Twin silver towers linked by a skybridge define its skyline.", "It is the capital of Malaysia."],
    funFact: "The Petronas Towers were the tallest buildings in the world from 1998 to 2004.",
  },
  {
    id: "budapest", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg/960px-View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg", name: "Budapeste", country: "Hungria", tier: "medium", emoji: "🌉",
    clues: ["It formed when two cities on opposite banks of the Danube merged.", "It is famous for grand thermal bathhouses fed by hot springs.", "It is the capital of Hungary."],
    funFact: "Budapest sits on over 100 thermal springs and has been a spa city since Roman times.",
  },
  {
    id: "warsaw", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Aleja_Niepdleglosci_Warsaw_2022_aerial_%28cropped%29.jpg/960px-Aleja_Niepdleglosci_Warsaw_2022_aerial_%28cropped%29.jpg", name: "Varsóvia", country: "Polónia", tier: "medium", emoji: "🏙️",
    clues: ["Its old town was rebuilt brick by brick after near-total wartime destruction.", "A mermaid is its official civic symbol.", "It is the capital of Poland."],
    funFact: "Warsaw's reconstructed Old Town is a UNESCO site precisely because it was rebuilt so faithfully.",
  },
  {
    id: "helsinki", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Suomenlinna_%28cropped%29.jpg/960px-Suomenlinna_%28cropped%29.jpg", name: "Helsínquia", country: "Finlândia", tier: "medium", emoji: "🏰",
    clues: ["A sea fortress on islands guards its harbour.", "It is a Nordic capital of clean design and long winters.", "It is the capital of Finland."],
    funFact: "Helsinki's sea fortress Suomenlinna is spread across eight islands and is a UNESCO site.",
  },
  {
    id: "dublin", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Dublin_-_aerial_-_2025-07-07_01.jpg/960px-Dublin_-_aerial_-_2025-07-07_01.jpg", name: "Dublin", country: "Irlanda", tier: "medium", emoji: "☘️",
    clues: ["Writers James Joyce and Oscar Wilde called it home.", "A dark stout beer was born at a brewery here in 1759.", "It is the capital of Ireland."],
    funFact: "The Guinness brewery in Dublin once signed a 9,000-year lease on its land.",
  },
  {
    id: "oslo", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Nationaltheatret_evening.jpg/960px-Nationaltheatret_evening.jpg", name: "Oslo", country: "Noruega", tier: "medium", emoji: "🎭",
    clues: ["It sits at the head of a long fjord ringed by forested hills.", "It awards the Nobel Peace Prize each year.", "It is the capital of Norway."],
    funFact: "Oslo hands out the Nobel Peace Prize, the only Nobel not awarded in Sweden.",
  },
  {
    id: "copenhagen", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/2018_-_Christiansborg_from_the_Marble_Bridge.jpg/960px-2018_-_Christiansborg_from_the_Marble_Bridge.jpg", name: "Copenhaga", country: "Dinamarca", tier: "medium", emoji: "🚲",
    clues: ["A small bronze mermaid sits on a rock in its harbour.", "More people here commute by bicycle than by car.", "It is the capital of Denmark."],
    funFact: "Copenhagen has more bicycles than residents, and cyclists outnumber cars downtown.",
  },
  {
    id: "zurich", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Altstadt_Z%C3%BCrich_2015.jpg/960px-Altstadt_Z%C3%BCrich_2015.jpg", name: "Zurique", country: "Suíça", tier: "medium", emoji: "🏦",
    clues: ["It sits at the tip of a lake with the Alps on the horizon.", "It is a global hub of banking and private wealth.", "It is the largest city of Switzerland."],
    funFact: "Zurich regularly tops rankings for quality of life — and for the world's highest wages.",
  },
  {
    id: "munich", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Stadtbild_M%C3%BCnchen.jpg/960px-Stadtbild_M%C3%BCnchen.jpg", name: "Munique", country: "Alemanha", tier: "medium", emoji: "🍺",
    clues: ["It throws the world's largest beer festival every autumn.", "It sits at the foot of the Bavarian Alps.", "It is the capital of Bavaria, in southern Germany."],
    funFact: "Munich's Oktoberfest draws around six million visitors who drink over seven million litres of beer.",
  },
  {
    id: "montreal", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Montreal%2C_Quebec_skyline.jpg/960px-Montreal%2C_Quebec_skyline.jpg", name: "Montreal", country: "Canadá", tier: "medium", emoji: "⛪",
    clues: ["It is the largest French-speaking city in the Americas.", "A hill named Mont Royal gives it its name.", "It is the cultural heart of Quebec, Canada."],
    funFact: "Montreal has a 33 km network of underground tunnels so people can avoid its harsh winters.",
  },
  {
    id: "stockholm", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Royal_Dramatic_Theatre_Stockholm.jpg/960px-Royal_Dramatic_Theatre_Stockholm.jpg", name: "Estocolmo", country: "Suécia", tier: "medium", emoji: "👑",
    clues: ["It is built across 14 islands linked by dozens of bridges.", "It hosts most of the Nobel Prize ceremonies each December.", "It is the capital of Sweden."],
    funFact: "Stockholm's clean metro is often called the world's longest art gallery, station by station.",
  },
  {
    id: "brussels", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Grand_Place_Bruselas_2.jpg/960px-Grand_Place_Bruselas_2.jpg", name: "Bruxelas", country: "Bélgica", tier: "medium", emoji: "🍟",
    clues: ["Its ornate central square, the Grand-Place, is a UNESCO gem.", "It hosts the headquarters of the European Union.", "It is the capital of Belgium."],
    funFact: "Brussels honours a tiny statue of a urinating boy, dressed in hundreds of costumes through the year.",
  },

  // ——— HARD (expansion) ———
  {
    id: "tbilisi", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/View_of_Tbilisi_from_Tabori_Church_2023-10-08-2.jpg/960px-View_of_Tbilisi_from_Tabori_Church_2023-10-08-2.jpg", name: "Tbilisi", country: "Geórgia", tier: "hard", emoji: "♨️",
    clues: ["Its name comes from an old word for 'warm', after its sulphur springs.", "It straddles a river below a hilltop fortress called Narikala.", "It is the capital of Georgia, in the Caucasus."],
    funFact: "Legend says a king founded Tbilisi after his falcon fell into a natural hot spring.",
  },
  {
    id: "ljubljana", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Ljubljana_Old_Town%2C_Slovenia_%28Old_Camera%29_%2833286165680%29.jpg/960px-Ljubljana_Old_Town%2C_Slovenia_%28Old_Camera%29_%2833286165680%29.jpg", name: "Liubliana", country: "Eslovénia", tier: "hard", emoji: "🐉",
    clues: ["A dragon is its civic symbol, guarding a famous bridge.", "A hilltop castle overlooks its car-free old town on a small river.", "It is the compact capital of Slovenia."],
    funFact: "Ljubljana's name is thought to relate to a Slavic word for 'beloved'.",
  },
  {
    id: "bruges", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Br%C3%BCgge_Blick_vom_Belfried_4.jpg/960px-Br%C3%BCgge_Blick_vom_Belfried_4.jpg", name: "Bruges", country: "Bélgica", tier: "hard", emoji: "🍫",
    clues: ["Its medieval canals earned it the nickname 'Venice of the North'.", "A tall belfry tower overlooks its cobbled market square.", "It is a preserved medieval city in Belgium, famed for chocolate and lace."],
    funFact: "Bruges was one of the world's most important trading cities back in the 13th century.",
  },
  {
    id: "chefchaouen", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Chefchaouen_%2852189357475%29.jpg/960px-Chefchaouen_%2852189357475%29.jpg", name: "Chefchaouen", country: "Marrocos", tier: "hard", emoji: "🔵",
    clues: ["Nearly every wall and alley of its old town is painted blue.", "It sits in the Rif Mountains of northern Morocco.", "It is nicknamed the 'Blue Pearl'."],
    funFact: "Nobody fully agrees why Chefchaouen is blue — theories range from cooling to repelling mosquitoes.",
  },
  {
    id: "samarkand", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/RegistanSquare_Samarkand.jpg/960px-RegistanSquare_Samarkand.jpg", name: "Samarcanda", country: "Uzbequistão", tier: "hard", emoji: "🕌",
    clues: ["It was a jewel of the ancient Silk Road under the conqueror Timur.", "Its Registan square is framed by three tiled madrasas.", "It is one of the oldest cities of Central Asia, in Uzbekistan."],
    funFact: "Samarkand is over 2,700 years old — roughly the same age as Rome.",
  },
  {
    id: "edinburgh", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Skyline_of_Edinburgh.jpg/960px-Skyline_of_Edinburgh.jpg", name: "Edimburgo", country: "Escócia", tier: "hard", emoji: "🏰",
    clues: ["A castle sits on an extinct volcano above its old town.", "It hosts the world's largest arts festival every August.", "It is the capital of Scotland."],
    funFact: "Edinburgh formed one of the world's first organised municipal fire brigades, back in 1824.",
  },
  {
    id: "bergen", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Bergen_panorama_at_night_-_panoramio_%281%29.jpg/960px-Bergen_panorama_at_night_-_panoramio_%281%29.jpg", name: "Bergen", country: "Noruega", tier: "hard", emoji: "🐟",
    clues: ["A row of colourful wooden wharf houses lines its old harbour.", "It is ringed by seven mountains and is a gateway to the fjords.", "It is Norway's second city, on the west coast."],
    funFact: "Bergen is one of the rainiest cities in Europe, with rain on roughly 240 days a year.",
  },
  {
    id: "ghent", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Gent%2C_de_Graslei_vanaf_de_Korenlei_met_oeg24758tm61%2B25159_IMG_0447_2021-08-13_18.37.jpg/960px-Gent%2C_de_Graslei_vanaf_de_Korenlei_met_oeg24758tm61%2B25159_IMG_0447_2021-08-13_18.37.jpg", name: "Gante", country: "Bélgica", tier: "hard", emoji: "⛪",
    clues: ["Guild houses line the quays of its medieval river port.", "It holds the celebrated van Eyck altarpiece, the Ghent Altarpiece.", "It is a historic Flemish city in Belgium."],
    funFact: "The Ghent Altarpiece is one of the most stolen artworks in history, taken at least a dozen times.",
  },
  {
    id: "lviv", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/%D0%9B%D0%B0%D1%82%D0%B8%D0%BD%D1%81%D1%8C%D0%BA%D0%B8%D0%B9_%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D0%B0%D0%BB%D1%8C%D0%BD%D0%B8%D0%B9_%D1%81%D0%BE%D0%B1%D0%BE%D1%80_%28%D0%9B%D1%8C%D0%B2%D1%96%D0%B2%29_16.jpg/960px-%D0%9B%D0%B0%D1%82%D0%B8%D0%BD%D1%81%D1%8C%D0%BA%D0%B8%D0%B9_%D0%BA%D0%B0%D1%84%D0%B5%D0%B4%D1%80%D0%B0%D0%BB%D1%8C%D0%BD%D0%B8%D0%B9_%D1%81%D0%BE%D0%B1%D0%BE%D1%80_%28%D0%9B%D1%8C%D0%B2%D1%96%D0%B2%29_16.jpg", name: "Lviv", country: "Ucrânia", tier: "hard", emoji: "🎭",
    clues: ["Its cobbled old town blends Polish, Austrian and Ukrainian history.", "It is famous for coffee houses and chocolate in western Ukraine.", "It is the cultural capital of western Ukraine."],
    funFact: "Lviv is said to have the highest concentration of coffee houses per person in Ukraine.",
  },
  {
    id: "yerevan", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Mount_Ararat_and_the_Yerevan_skyline_%28June_2018%29.jpg/960px-Mount_Ararat_and_the_Yerevan_skyline_%28June_2018%29.jpg", name: "Erevan", country: "Arménia", tier: "hard", emoji: "🍑",
    clues: ["Snow-capped Mount Ararat looms over it from across the border.", "It is built largely from local pink volcanic stone.", "It is the capital of Armenia."],
    funFact: "Yerevan is older than Rome, founded as a fortress in 782 BC.",
  },
  {
    id: "baku", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Baku_Montage.jpg/960px-Baku_Montage.jpg", name: "Baku", country: "Azerbaijão", tier: "hard", emoji: "🔥",
    clues: ["Three curved skyscrapers shaped like flames light up its skyline.", "It sits below sea level on the shore of the Caspian Sea.", "It is the capital of Azerbaijan, the 'Land of Fire'."],
    funFact: "Baku lies about 28 m below sea level, making it the lowest-lying national capital in the world.",
  },
  {
    id: "valletta", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/St_Sebastian_Curtain_%28cropped%29.jpg/960px-St_Sebastian_Curtain_%28cropped%29.jpg", name: "Valeta", country: "Malta", tier: "hard", emoji: "🛡️",
    clues: ["It was built by the Knights of St John as a fortress city.", "One of Europe's smallest capitals, it sits on a rocky Mediterranean peninsula.", "It is the capital of Malta."],
    funFact: "Valletta packs 320 monuments into just 0.8 km², one of the densest historic areas anywhere.",
  },
  {
    id: "riga", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Riga_%2833844464828%29.jpg/960px-Riga_%2833844464828%29.jpg", name: "Riga", country: "Letónia", tier: "hard", emoji: "🎄",
    clues: ["It has one of Europe's finest collections of Art Nouveau buildings.", "It sits on a river near the Baltic Sea.", "It is the capital of Latvia."],
    funFact: "Riga claims the first-ever decorated Christmas tree, put up in its town square in 1510.",
  },
  {
    id: "bratislava", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Slovakia_bratislava.jpg/960px-Slovakia_bratislava.jpg", name: "Bratislava", country: "Eslováquia", tier: "hard", emoji: "🏰",
    clues: ["A boxy white castle sits on a hill above the Danube.", "It is the only national capital that borders two other countries.", "It is the capital of Slovakia."],
    funFact: "Bratislava borders both Austria and Hungary — the only capital touching two countries.",
  },
  {
    id: "sarajevo", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Sarajevo_City_Panorama.JPG/960px-Sarajevo_City_Panorama.JPG", name: "Sarajevo", country: "Bósnia e Herzegovina", tier: "hard", emoji: "🌉",
    clues: ["Mosques, churches and synagogues stand within a few streets of each other here.", "An assassination on its streets in 1914 helped spark the First World War.", "It is the capital of Bosnia and Herzegovina."],
    funFact: "Sarajevo hosted the 1984 Winter Olympics, a decade before its long wartime siege.",
  },
  {
    id: "porto", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Puente_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_13.JPG/960px-Puente_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_13.JPG", name: "Porto", country: "Portugal", tier: "hard", emoji: "🍷",
    clues: ["A double-deck iron bridge crosses the river to its wine cellars.", "The fortified wine it ships worldwide takes its name.", "It is Portugal's second city, at the mouth of the Douro."],
    funFact: "Port wine is aged across the river from Porto, in the cellars of Vila Nova de Gaia.",
  },
];
