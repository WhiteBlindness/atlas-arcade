"use client";

import { useSettingsStore, type Lang } from "@/store/settingsStore";

const DICT = {
  en: {
    selectGame: "SELECT GAME",
    signInHint: "▶ SIGN IN TO SAVE SCORES ◀",
    insertCoin: "INSERT COIN",
    play: "PLAY →",
    comingSoon: "COMING SOON",
    best: "BEST",
    descGloble: "Mystery country. Guess by distance. Hot or cold?",
    descCapital: "Match capitals to countries before time runs out.",
    descFlag: "Name the flag. Fast. Faster. Don't miss.",
    descPeaks: "Higher or lower? Compare oddly mismatched world stats.",
    descTectonic: "Drag lost countries back onto the map. Snap!",
    descFrontier: "Who shares this border? Pick the right neighbor.",
    descOneStrike: "Rapid-fire questions. One mistake ends it all.",
    descUrban: "Guess the city from its skyline and streets.",
    modeTitle: "SELECT MODE",
    dailyChallenge: "DAILY CHALLENGE",
    dailyDesc: "One shared puzzle. Same for every player on Earth today.",
    free: "FREE",
    arcadeMode: "ARCADE MODE",
    arcadeDesc: "Random endless practice. New puzzle every run.",
    oneCoin: "1 COIN",
    cancel: "CANCEL",
    outOfCoins: "OUT OF COINS",
    outOfCoinsDesc: "Your daily allowance is spent. Coins refill at UTC midnight.",
    watchAd: "WATCH AD (+1 COIN)",
    premium: "INSERT COIN (PREMIUM UNLIMITED)",
    comingSoon2: "COMING SOON",
  },
  pt: {
    selectGame: "ESCOLHE O JOGO",
    signInHint: "▶ INICIA SESSÃO PARA GUARDAR PONTOS ◀",
    insertCoin: "INSERIR MOEDA",
    play: "JOGAR →",
    comingSoon: "BREVEMENTE",
    best: "RECORDE",
    descGloble: "País mistério. Adivinha pela distância. Quente ou frio?",
    descCapital: "Liga capitais a países antes que o tempo acabe.",
    descFlag: "Diz o nome da bandeira. Rápido. Sem falhar.",
    descPeaks: "Mais alto ou mais baixo? Compara estatísticas mundiais.",
    descTectonic: "Arrasta os países perdidos para o mapa. Encaixa!",
    descFrontier: "Quem partilha esta fronteira? Escolhe o vizinho certo.",
    descOneStrike: "Perguntas em rajada. Um erro e acabou.",
    descUrban: "Adivinha a cidade pelo horizonte e pelas ruas.",
    modeTitle: "ESCOLHE O MODO",
    dailyChallenge: "DESAFIO DIÁRIO",
    dailyDesc: "Um puzzle partilhado. Igual para todos os jogadores hoje.",
    free: "GRÁTIS",
    arcadeMode: "MODO ARCADE",
    arcadeDesc: "Treino aleatório sem fim. Puzzle novo em cada partida.",
    oneCoin: "1 MOEDA",
    cancel: "CANCELAR",
    outOfCoins: "SEM MOEDAS",
    outOfCoinsDesc: "Gastaste as moedas de hoje. Repõem à meia-noite UTC.",
    watchAd: "VER ANÚNCIO (+1 MOEDA)",
    premium: "INSERIR MOEDA (PREMIUM ILIMITADO)",
    comingSoon2: "BREVEMENTE",
  },
  es: {
    selectGame: "ELIGE EL JUEGO",
    signInHint: "▶ INICIA SESIÓN PARA GUARDAR PUNTOS ◀",
    insertCoin: "INSERTAR MONEDA",
    play: "JUGAR →",
    comingSoon: "PRÓXIMAMENTE",
    best: "RÉCORD",
    descGloble: "País misterioso. Adivina por distancia. ¿Frío o caliente?",
    descCapital: "Une capitales con países antes de que acabe el tiempo.",
    descFlag: "Nombra la bandera. Rápido. Más rápido. No falles.",
    descPeaks: "¿Más alto o más bajo? Compara estadísticas mundiales.",
    descTectonic: "Arrastra los países perdidos al mapa. ¡Encaja!",
    descFrontier: "¿Quién comparte esta frontera? Elige al vecino correcto.",
    descOneStrike: "Preguntas a toda velocidad. Un error y se acabó.",
    descUrban: "Adivina la ciudad por su horizonte y sus calles.",
    modeTitle: "ELIGE EL MODO",
    dailyChallenge: "RETO DIARIO",
    dailyDesc: "Un puzle compartido. Igual para todos los jugadores hoy.",
    free: "GRATIS",
    arcadeMode: "MODO ARCADE",
    arcadeDesc: "Práctica aleatoria sin fin. Puzle nuevo en cada partida.",
    oneCoin: "1 MONEDA",
    cancel: "CANCELAR",
    outOfCoins: "SIN MONEDAS",
    outOfCoinsDesc: "Gastaste las monedas de hoy. Se reponen a medianoche UTC.",
    watchAd: "VER ANUNCIO (+1 MONEDA)",
    premium: "INSERTAR MONEDA (PREMIUM ILIMITADO)",
    comingSoon2: "PRÓXIMAMENTE",
  },
} as const;

export type TKey = keyof (typeof DICT)["en"];

export function t(lang: Lang, key: TKey): string {
  return DICT[lang][key];
}

export function useT() {
  const lang = useSettingsStore((s) => s.lang);
  return (key: TKey) => t(lang, key);
}

export const LANGS: Lang[] = ["en", "pt", "es"];
