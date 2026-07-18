// Pop-culture geography trivia — real geography wrapped in sitcom references
// (in the spirit of The Office "Company Picnic" game-show geography gags).
// Prompts are European Portuguese; answers are place names (proper nouns).

export interface TriviaQuestion {
  prompt: string;
  options: string[]; // includes `answer`
  answer: string;
  source: string;    // show, shown as flavour
}

export const POP_TRIVIA: TriviaQuestion[] = [
  { prompt: "Em que estado dos EUA fica Scranton, a cidade de The Office?", options: ["Pensilvânia", "Ohio", "Nova Iorque", "Nova Jérsia"], answer: "Pensilvânia", source: "The Office" },
  { prompt: "Parks and Recreation passa-se em Pawnee, cidade fictícia de que estado?", options: ["Indiana", "Illinois", "Iowa", "Michigan"], answer: "Indiana", source: "Parks and Rec" },
  { prompt: "Em que cidade se passa It's Always Sunny in Philadelphia?", options: ["Filadélfia", "Pittsburgh", "Boston", "Baltimore"], answer: "Filadélfia", source: "It's Always Sunny" },
  { prompt: "Segundo Matt Groening, a Springfield dos Simpsons tem o nome de uma cidade de que estado?", options: ["Oregon", "Illinois", "Massachusetts", "Missouri"], answer: "Oregon", source: "The Simpsons" },
  { prompt: "Em que bairro de Nova Iorque se passa Brooklyn Nine-Nine?", options: ["Brooklyn", "Queens", "Bronx", "Manhattan"], answer: "Brooklyn", source: "Brooklyn Nine-Nine" },
  { prompt: "O bar de Cheers fica em que cidade dos EUA?", options: ["Boston", "Chicago", "Nova Iorque", "Seattle"], answer: "Boston", source: "Cheers" },
  { prompt: "Em O Príncipe de Bel-Air, Will muda-se de Filadélfia para que cidade?", options: ["Los Angeles", "São Francisco", "San Diego", "Sacramento"], answer: "Los Angeles", source: "Fresh Prince" },
  { prompt: "A equipa AFC Richmond, de Ted Lasso, joga em que país?", options: ["Inglaterra", "Escócia", "Irlanda", "País de Gales"], answer: "Inglaterra", source: "Ted Lasso" },
  { prompt: "Os Rose, de Schitt's Creek, vêm de uma série de que país?", options: ["Canadá", "EUA", "Reino Unido", "Austrália"], answer: "Canadá", source: "Schitt's Creek" },
  { prompt: "Em que cidade do Novo México se passa Breaking Bad?", options: ["Albuquerque", "Santa Fé", "Las Cruces", "Roswell"], answer: "Albuquerque", source: "Breaking Bad" },
  { prompt: "A série The Wire retrata que cidade dos EUA?", options: ["Baltimore", "Washington", "Filadélfia", "Detroit"], answer: "Baltimore", source: "The Wire" },
  { prompt: "Friends passa-se sobretudo em que cidade?", options: ["Nova Iorque", "Los Angeles", "Chicago", "Boston"], answer: "Nova Iorque", source: "Friends" },
];
