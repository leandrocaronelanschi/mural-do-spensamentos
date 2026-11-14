/* =====================================================================
 * MODERACAO.JS — Filtro automático de mensagens (RF02)
 * ---------------------------------------------------------------------
 * Antes de qualquer publicação, o texto passa por este filtro, que
 * procura três grupos de termos:
 *
 *  1. TERMOS_DE_CRISE    → possível risco à vida. A pessoa é orientada a
 *                          buscar o CVV (188), o SAMU (192) ou o CAPS.
 *  2. PALAVRAS_OFENSIVAS → palavrões e ofensas. Bloqueados no mural e no chat.
 *  3. PALAVRAS_NEGATIVAS → tom negativo ou depreciativo. Bloqueados apenas
 *                          no mural (no chat, desabafar faz parte do acolhimento).
 *
 * Os termos são escritos SEM acento e em minúsculas, porque o texto do
 * usuário também é "normalizado" antes da comparação.
 * ===================================================================== */

const TERMOS_DE_CRISE = [
  "morrer",
  "suicidio",
  "suicidar",
  "me matar",
  "se matar",
  "tirar minha vida",
  "tirar a minha vida",
  "acabar com tudo",
  "acabar com a minha vida",
  "nao aguento mais",
  "nao quero mais viver",
  "nao quero viver",
  "sem vontade de viver",
  "vontade de sumir",
  "me cortar",
  "automutilacao",
  "me machucar",
  "me ferir"
];

const PALAVRAS_OFENSIVAS = [
  "idiota",
  "idiotas",
  "burro",
  "burra",
  "imbecil",
  "otario",
  "otaria",
  "estupido",
  "estupida",
  "babaca",
  "retardado",
  "retardada",
  "vagabundo",
  "vagabunda",
  "nojento",
  "nojenta",
  "desgraca",
  "desgracado",
  "desgracada",
  "merda",
  "porra",
  "caralho",
  "fdp",
  "vsf",
  "pqp",
  "cala a boca"
];

const PALAVRAS_NEGATIVAS = [
  "triste",
  "tristeza",
  "odeio",
  "odio",
  "detesto",
  "ruim",
  "pessimo",
  "pessima",
  "horrivel",
  "terrivel",
  "desisto",
  "desistir",
  "inutil",
  "inuteis",
  "derrota",
  "derrotado",
  "derrotada",
  "fracasso",
  "fracassado",
  "fracassada",
  "incapaz",
  "perdedor",
  "perdedora",
  "nao sirvo",
  "nunca vou conseguir",
  "sem esperanca"
];

// Textos de orientação exibidos quando uma mensagem é barrada
const ORIENTACOES_MODERACAO = {
  negativo:
    "Sua mensagem tem palavras com tom negativo. Que tal reescrever focando em otimismo, gratidão ou superação? 🌱",
  ofensivo:
    "Sua mensagem contém termos ofensivos e não pode ser enviada. Aqui cultivamos respeito e gentileza. 💚",
  crise:
    "Percebemos palavras que podem indicar um momento muito difícil. Você não está sozinho(a): procure ajuda agora mesmo. Se foi apenas uma expressão, você pode reescrever a mensagem."
};

/**
 * Deixa o texto em um formato padrão para comparação:
 * minúsculas, sem acentos e com as palavras separadas por um espaço.
 * Exemplo: "Hoje NÃO   aguento mais!!"  →  " hoje nao aguento mais "
 */
function normalizarTexto(texto) {
  const palavras = texto
    .toLowerCase()
    .normalize("NFD") //                separa a letra do acento (ã → a + ~)
    .replace(/[̀-ͯ]/g, "") // remove os acentos
    .split(/[^a-z0-9]+/) //             quebra em palavras, ignorando pontuação
    .filter((palavra) => palavra !== "");

  // Os espaços nas pontas permitem procurar a palavra INTEIRA com includes(" termo ").
  // Assim "ruim" é encontrado, mas "ruína" ou "ruins" não geram falso positivo por acidente.
  return " " + palavras.join(" ") + " ";
}

/** Retorna os termos da lista que aparecem no texto como palavras inteiras. */
function encontrarTermos(textoNormalizado, listaDeTermos) {
  return listaDeTermos.filter((termo) => textoNormalizado.includes(" " + termo + " "));
}

/**
 * Analisa uma mensagem e devolve o resultado da moderação.
 * @param {string} texto    Texto digitado pelo usuário.
 * @param {string} contexto "mural" ou "chat".
 * @returns {{ tipo: "ok" | "crise" | "ofensivo" | "negativo", termos: string[] }}
 */
function analisarMensagem(texto, contexto) {
  const textoNormalizado = normalizarTexto(texto);

  // 1º: crise tem prioridade, pois envolve a segurança da pessoa
  const termosDeCrise = encontrarTermos(textoNormalizado, TERMOS_DE_CRISE);
  if (termosDeCrise.length > 0) {
    return { tipo: "crise", termos: termosDeCrise };
  }

  // 2º: ofensas são barradas em qualquer lugar
  const ofensas = encontrarTermos(textoNormalizado, PALAVRAS_OFENSIVAS);
  if (ofensas.length > 0) {
    return { tipo: "ofensivo", termos: ofensas };
  }

  // 3º: tom negativo só é barrado no mural
  if (contexto === "mural") {
    const negativas = encontrarTermos(textoNormalizado, PALAVRAS_NEGATIVAS);
    if (negativas.length > 0) {
      return { tipo: "negativo", termos: negativas };
    }
  }

  return { tipo: "ok", termos: [] };
}
