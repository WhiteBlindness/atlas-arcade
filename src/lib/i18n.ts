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
