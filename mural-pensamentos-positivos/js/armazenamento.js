/* =====================================================================
 * ARMAZENAMENTO.JS — Camada de dados do protótipo
 * ---------------------------------------------------------------------
 * O MVP ainda não tem servidor (back-end). Para simular um banco de
 * dados usamos o localStorage do navegador, que:
 *   - mantém os dados salvos mesmo depois de recarregar a página;
 *   - é compartilhado entre o Mural (index.html) e o Painel
 *     Administrativo (admin.html), quando abertos no mesmo navegador.
 *
 * Todas as leituras e gravações ficam concentradas neste arquivo.
 * Assim, as telas não precisam saber COMO os dados são guardados e,
 * no futuro, basta trocar este arquivo por chamadas a uma API.
 * ===================================================================== */

// "Tabelas" do nosso banco de dados dentro do localStorage
const CHAVES = {
  pensamentos: "mpp_pensamentos",
  conversas: "mpp_conversas",
  curtidas: "mpp_curtidas",
  termoAceito: "mpp_termo_aceito"
};

/* ---------------------------------------------------------------------
 * 1. FUNÇÕES GENÉRICAS
 * ------------------------------------------------------------------- */

/** Lê uma chave do localStorage e converte o texto JSON em objeto. */
function lerDados(chave, valorPadrao) {
  try {
    const valorSalvo = localStorage.getItem(chave);
    return valorSalvo === null ? valorPadrao : JSON.parse(valorSalvo);
  } catch (erro) {
    console.error(`Erro ao ler "${chave}" do armazenamento:`, erro);
    return valorPadrao;
  }
}

/** Converte o valor em texto JSON e grava no localStorage. */
function gravarDados(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (erro) {
    console.error(`Erro ao gravar "${chave}" no armazenamento:`, erro);
  }
}

/** Gera um identificador único simples (data atual + parte aleatória). */
function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Data e hora atual no formato ISO (padrão usado para salvar datas). */
function agoraISO() {
  return new Date().toISOString();
}

/** Data no passado — usada apenas para montar os dados de exemplo. */
function minutosAtras(minutos) {
  return new Date(Date.now() - minutos * 60000).toISOString();
}

/** Dia seguinte em uma hora cheia — usada nos dados de exemplo. */
function amanhaAs(hora) {
  const data = new Date();
  data.setDate(data.getDate() + 1);
  data.setHours(hora, 0, 0, 0);
  return data.toISOString();
}

/* ---------------------------------------------------------------------
 * 2. PENSAMENTOS DO MURAL (RF03)
 * Estrutura: { id, autor, texto, categoria, curtidas, criadoEm, editadoEm }
 * ------------------------------------------------------------------- */

/** Mensagens iniciais para o mural não começar vazio. */
function criarPensamentosDeExemplo() {
  const exemplos = [
    {
      autor: "Lucas (ADS)",
      categoria: "superacao",
      curtidas: 12,
      minutos: 25,
      texto: "Mesmo nos dias de prova e entrega de projeto, lembre-se de respirar fundo. Cada passo conta!"
    },
    {
      autor: "Anônimo",
      categoria: "gratidao",
      curtidas: 8,
      minutos: 90,
      texto: "Que o dia de hoje traga paz e bons pensamentos para todos nós da faculdade e da comunidade!"
    },
    {
      autor: "Mariana",
      categoria: "autocuidado",
      curtidas: 15,
      minutos: 180,
      texto: "Descansar também é produtivo. Beba água, alongue o corpo e seja gentil com você hoje. 🌸"
    },
    {
      autor: "Anônimo",
      categoria: "motivacao",
      curtidas: 21,
      minutos: 300,
      texto: "Você já atravessou todos os seus dias difíceis até aqui. Continue, você é capaz!"
    },
    {
      autor: "Turma do 3º período",
      categoria: "gratidao",
      curtidas: 6,
      minutos: 1500,
      texto: "Obrigado a todos que ajudaram no trabalho em grupo. Juntos a gente vai mais longe! 🤝"
    },
    {
      autor: "Anônimo",
      categoria: "autocuidado",
      curtidas: 9,
      minutos: 2900,
      texto: "Hoje me permiti desligar o celular por uma hora e caminhar ao ar livre. Recomendo demais!"
    }
  ];

  return exemplos.map((exemplo) => ({
    id: gerarId(),
    autor: exemplo.autor,
    texto: exemplo.texto,
    categoria: exemplo.categoria,
    curtidas: exemplo.curtidas,
    criadoEm: minutosAtras(exemplo.minutos),
    editadoEm: null
  }));
}

/** Retorna todos os pensamentos (do mais recente para o mais antigo). */
function listarPensamentos() {
  let pensamentos = lerDados(CHAVES.pensamentos, null);

  // Primeiro acesso: ainda não existe nada salvo, então gravamos os exemplos
  if (pensamentos === null) {
    pensamentos = criarPensamentosDeExemplo();
    salvarPensamentos(pensamentos);
  }
  return pensamentos;
}

function salvarPensamentos(pensamentos) {
  gravarDados(CHAVES.pensamentos, pensamentos);
}

function buscarPensamento(id) {
  return listarPensamentos().find((pensamento) => pensamento.id === id);
}

/** Cria um novo pensamento e coloca no início da lista. */
function adicionarPensamento(autor, texto, categoria) {
  const pensamentos = listarPensamentos();
  const novoPensamento = {
    id: gerarId(),
    autor: autor,
    texto: texto,
    categoria: categoria,
    curtidas: 0,
    criadoEm: agoraISO(),
    editadoEm: null
  };

  pensamentos.unshift(novoPensamento); // unshift = adiciona no início
  salvarPensamentos(pensamentos);
  return novoPensamento;
}

/** Atualiza autor, texto e categoria (usado pelo painel administrativo). */
function editarPensamento(id, novosDados) {
  const pensamentos = listarPensamentos();
  const pensamento = pensamentos.find((item) => item.id === id);
  if (!pensamento) return false;

  pensamento.autor = novosDados.autor;
  pensamento.texto = novosDados.texto;
  pensamento.categoria = novosDados.categoria;
  pensamento.editadoEm = agoraISO();

  salvarPensamentos(pensamentos);
  return true;
}

function excluirPensamento(id) {
  const restantes = listarPensamentos().filter((pensamento) => pensamento.id !== id);
  salvarPensamentos(restantes);
}

function restaurarPensamentosDeExemplo() {
  salvarPensamentos(criarPensamentosDeExemplo());
  gravarDados(CHAVES.curtidas, []);
}

/* Curtidas: guardamos quais pensamentos ESTE navegador já curtiu,
   para que cada pessoa só consiga curtir uma vez. */
function listarCurtidas() {
  return lerDados(CHAVES.curtidas, []);
}

/** Curte ou descurte um pensamento e retorna a situação atualizada. */
function alternarCurtida(id) {
  const pensamentos = listarPensamentos();
  const pensamento = pensamentos.find((item) => item.id === id);
  if (!pensamento) return null;

  const curtidas = listarCurtidas();
  const jaCurtiu = curtidas.includes(id);

  if (jaCurtiu) {
    pensamento.curtidas = Math.max(0, pensamento.curtidas - 1);
    curtidas.splice(curtidas.indexOf(id), 1);
  } else {
    pensamento.curtidas++;
    curtidas.push(id);
  }

  salvarPensamentos(pensamentos);
  gravarDados(CHAVES.curtidas, curtidas);
  return { curtido: !jaCurtiu, total: pensamento.curtidas };
}

/* ---------------------------------------------------------------------
 * 3. CONVERSAS DA SALA DE BATE-PAPO (RF04 / RF05)
 * Cada registro representa uma pessoa que solicitou uma conversa.
 * ------------------------------------------------------------------- */

/** Monta um objeto de conversa com os valores iniciais. */
function montarConversa(apelido, etiqueta) {
  return {
    id: gerarId(),
    apelido: apelido,
    etiqueta: etiqueta, //           "busca" ou "voluntario"
    status: "ativa", //              "ativa" ou "encerrada"
    iniciadaEm: agoraISO(),
    ultimaAtividade: agoraISO(),
    encerradaEm: null,
    encerradaPor: null, //           "participante" ou "moderacao"
    horarioSugerido: null, //        RF05 - data/hora proposta para conversar
    horarioConfirmado: false,
    alertaCrise: false, //           true se o filtro detectou termos de crise
    bloqueiosOfensivos: 0, //        quantas mensagens ofensivas foram barradas
    mensagens: []
  };
}

/** Solicitações de exemplo para o painel administrativo não começar vazio. */
function criarConversasDeExemplo() {
  return [
    {
      ...montarConversa("Anônimo", "busca"),
      iniciadaEm: minutosAtras(15),
      ultimaAtividade: minutosAtras(2)
    },
    {
      ...montarConversa("Júlia", "busca"),
      iniciadaEm: minutosAtras(42),
      ultimaAtividade: minutosAtras(10),
      horarioSugerido: amanhaAs(19),
      horarioConfirmado: true
    },
    {
      ...montarConversa("Visitante", "busca"),
      iniciadaEm: minutosAtras(30),
      ultimaAtividade: minutosAtras(6),
      alertaCrise: true
    },
    {
      ...montarConversa("Anônimo", "busca"),
      iniciadaEm: minutosAtras(55),
      ultimaAtividade: minutosAtras(20),
      bloqueiosOfensivos: 3
    },
    {
      ...montarConversa("Carlos", "voluntario"),
      iniciadaEm: minutosAtras(200),
      ultimaAtividade: minutosAtras(150),
      status: "encerrada",
      encerradaEm: minutosAtras(150),
      encerradaPor: "participante"
    }
  ];
}

function listarConversas() {
  let conversas = lerDados(CHAVES.conversas, null);

  if (conversas === null) {
    conversas = criarConversasDeExemplo();
    salvarConversas(conversas);
  }
  return conversas;
}

function salvarConversas(conversas) {
  gravarDados(CHAVES.conversas, conversas);
}

function buscarConversa(id) {
  return listarConversas().find((conversa) => conversa.id === id);
}

/** Registra uma nova solicitação de conversa. */
function criarConversa(apelido, etiqueta) {
  const conversas = listarConversas();
  const conversa = montarConversa(apelido, etiqueta);

  conversas.push(conversa);
  salvarConversas(conversas);
  return conversa;
}

/**
 * Função auxiliar: encontra a conversa, aplica a alteração e salva.
 * Evita repetir o mesmo "ler → alterar → salvar" nas funções abaixo.
 * Sempre lemos a versão mais recente do localStorage, pois o painel
 * administrativo pode ter alterado a conversa em outra aba.
 */
function alterarConversa(id, aplicarAlteracao) {
  const conversas = listarConversas();
  const conversa = conversas.find((item) => item.id === id);
  if (!conversa) return null;

  aplicarAlteracao(conversa);
  conversa.ultimaAtividade = agoraISO();
  salvarConversas(conversas);
  return conversa;
}

function atualizarConversa(id, novosDados) {
  return alterarConversa(id, (conversa) => Object.assign(conversa, novosDados));
}

/** Adiciona uma mensagem ({ tipo, autor, etiqueta, texto }) na conversa. */
function adicionarMensagemNaConversa(id, mensagem) {
  return alterarConversa(id, (conversa) => {
    conversa.mensagens.push({ ...mensagem, data: agoraISO() });
  });
}

function registrarBloqueioOfensivo(id) {
  return alterarConversa(id, (conversa) => {
    conversa.bloqueiosOfensivos++;
  });
}

function marcarAlertaDeCrise(id) {
  return atualizarConversa(id, { alertaCrise: true });
}

/** Encerra a conversa e deixa um aviso do sistema para o participante. */
function encerrarConversa(id, encerradaPor, textoDoAviso) {
  return alterarConversa(id, (conversa) => {
    conversa.status = "encerrada";
    conversa.encerradaPor = encerradaPor;
    conversa.encerradaEm = agoraISO();
    conversa.mensagens.push({
      tipo: "sistema",
      autor: "Sistema",
      texto: textoDoAviso,
      data: agoraISO()
    });
  });
}

function excluirConversa(id) {
  salvarConversas(listarConversas().filter((conversa) => conversa.id !== id));
}

function excluirConversasEncerradas() {
  salvarConversas(listarConversas().filter((conversa) => conversa.status === "ativa"));
}

/* ---------------------------------------------------------------------
 * 4. TERMO DE CONSENTIMENTO
 * Guardamos a data do aceite como registro do consentimento (LGPD).
 * ------------------------------------------------------------------- */

function termoFoiAceito() {
  return lerDados(CHAVES.termoAceito, null) !== null;
}

function registrarAceiteDoTermo() {
  gravarDados(CHAVES.termoAceito, { versao: "1.0", aceitoEm: agoraISO() });
}
