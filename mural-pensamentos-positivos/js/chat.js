/* =====================================================================
 * CHAT.JS — Sala de Bate-Papo de Acolhimento Fraterno
 * ---------------------------------------------------------------------
 * Requisitos atendidos:
 *   RF04 — Etiquetas de perfil (Pessoa em Busca de Acolhimento /
 *          Voluntário da Comunidade), com aviso do sistema na troca.
 *   RF05 — Sugestão de horário (datetime-local) publicada como
 *          mensagem especial do sistema.
 *   Triagem de emergência — termos de crise geram encaminhamento
 *          imediato para CVV (188), SAMU (192) e CAPS.
 *
 * LIMITAÇÃO DO MVP: como ainda não há servidor, a outra pessoa da
 * conversa é SIMULADA com respostas prontas. A estrutura de dados já
 * permite trocar a simulação por comunicação em tempo real no futuro
 * (ex.: WebSocket), sem mudar as telas.
 * ===================================================================== */

/* A pessoa simulada depende da etiqueta escolhida pelo usuário:
   quem busca acolhimento conversa com uma voluntária, e vice-versa. */
const PARTICIPANTE_SIMULADO = {
  busca: {
    nome: "Ana",
    etiqueta: "voluntario",
    saudacao:
      "Oi! Que bom que você chegou. 😊 Eu sou a Ana, voluntária da comunidade. Pode falar no seu tempo — estou aqui para te ouvir, sem julgamentos.",
    respostas: [
      "Obrigada por confiar em mim e compartilhar isso. Estou aqui te ouvindo. 💚",
      "Entendo... parece que você está carregando bastante coisa. Quer me contar um pouco mais?",
      "Faz todo sentido se sentir assim. O que costuma te ajudar a relaxar um pouquinho nesses dias?",
      "Você não está sozinho(a) nessa. Só de ter vindo conversar já mostra muita coragem.",
      "Que tal pensarmos juntos em um passo pequeno que você poderia dar hoje para cuidar de si?",
      "Fico feliz em conversar com você. Se em algum momento ficar pesado demais, lembre que o CVV (188) atende 24h, tá bom?"
    ]
  },
  voluntario: {
    nome: "Visitante",
    etiqueta: "busca",
    saudacao:
      "Oi... obrigado por estar disponível. Eu só queria conversar um pouco, o dia hoje foi bem cansativo.",
    respostas: [
      "Obrigado por me ouvir. Essa semana de provas está bem puxada...",
      "É bom poder falar com alguém. Às vezes parece que ninguém tem tempo pra isso.",
      "Acho que só de desabafar já estou me sentindo um pouco mais leve.",
      "Vou tentar organizar melhor meus horários e descansar um pouco hoje.",
      "Valeu mesmo pela paciência e pelas palavras. 🙏"
    ]
  }
};

// sessionStorage: lembra qual conversa pertence a ESTA aba do navegador
const CHAVE_CONVERSA_ATUAL = "mpp_conversa_atual";

/* ---------- Estado do chat ---------- */
let conversaAtualId = sessionStorage.getItem(CHAVE_CONVERSA_ATUAL);
let contadorRespostas = 0; //   controla qual resposta pronta será usada
let respostasPendentes = 0; //  quantas respostas simuladas estão "sendo digitadas"
let elementoQueAbriuChat = null; // para devolver o foco ao fechar (acessibilidade)

/* ---------- Elementos da página ---------- */
const painelChat = document.getElementById("painel-chat");
const fundoChat = document.getElementById("fundo-chat");
const botoesAbrirChat = document.querySelectorAll("[data-abrir-chat]");
const botaoFecharChat = document.getElementById("botao-fechar-chat");
const botaoChatFlutuante = document.getElementById("botao-chat-flutuante");
const etiquetaAtual = document.getElementById("etiqueta-atual");

const etapaEntrada = document.getElementById("chat-entrada");
const formEntradaChat = document.getElementById("form-entrada-chat");
const campoApelido = document.getElementById("campo-apelido");

const etapaConversa = document.getElementById("chat-conversa");
const seletorEtiqueta = document.getElementById("seletor-etiqueta");
const botaoSairChat = document.getElementById("botao-sair-chat");
const caixaMensagens = document.getElementById("mensagens-chat");
const indicadorDigitando = document.getElementById("indicador-digitando");
const painelAgendamento = document.getElementById("painel-agendamento");
const formAgendamento = document.getElementById("form-agendamento");
const campoHorario = document.getElementById("campo-horario");
const alertaChat = document.getElementById("alerta-chat");
const formMensagemChat = document.getElementById("form-mensagem-chat");
const campoMensagemChat = document.getElementById("campo-mensagem-chat");
const avisoConversaEncerrada = document.getElementById("aviso-conversa-encerrada");
const botaoNovaConversa = document.getElementById("botao-nova-conversa");

/* ---------------------------------------------------------------------
 * ABRIR E FECHAR A SALA
 * ------------------------------------------------------------------- */

function abrirChat() {
  elementoQueAbriuChat = document.activeElement;

  painelChat.classList.add("painel-chat--aberto");
  fundoChat.hidden = false;
  document.body.classList.add("chat-aberto");

  // Se esta aba já tem uma conversa, volta para ela; senão, mostra a entrada
  if (buscarConversaAtual()) {
    mostrarEtapaConversa();
  } else {
    mostrarEtapaEntrada();
  }
}

function fecharChat() {
  painelChat.classList.remove("painel-chat--aberto");
  fundoChat.hidden = true;
  document.body.classList.remove("chat-aberto");

  if (elementoQueAbriuChat) elementoQueAbriuChat.focus();
}

function chatEstaAberto() {
  return painelChat.classList.contains("painel-chat--aberto");
}

/* ---------------------------------------------------------------------
 * CONVERSA ATUAL
 * ------------------------------------------------------------------- */

function buscarConversaAtual() {
  return conversaAtualId ? buscarConversa(conversaAtualId) : null;
}

function limparConversaAtual() {
  conversaAtualId = null;
  sessionStorage.removeItem(CHAVE_CONVERSA_ATUAL);
  caixaMensagens.innerHTML = "";
  atualizarIndicadorDoChat();
}

/* ---------------------------------------------------------------------
 * ETAPA 1 — ENTRADA (apelido + etiqueta)
 * ------------------------------------------------------------------- */

function mostrarEtapaEntrada() {
  etapaEntrada.hidden = false;
  etapaConversa.hidden = true;
  atualizarCabecalhoDoChat(null);
  campoApelido.focus();
}

function entrarNaSala(evento) {
  evento.preventDefault();

  const apelido = campoApelido.value.trim() || "Anônimo";
  const etiqueta = formEntradaChat.elements.etiqueta.value;

  // O apelido também passa pelo filtro (não pode conter ofensas)
  if (analisarMensagem(apelido, "chat").tipo === "ofensivo") {
    mostrarAviso("Escolha um apelido respeitoso, por favor. 💚", "erro");
    campoApelido.focus();
    return;
  }

  // Cria a solicitação de conversa (ela aparece no painel administrativo)
  const conversa = criarConversa(apelido, etiqueta);
  conversaAtualId = conversa.id;
  sessionStorage.setItem(CHAVE_CONVERSA_ATUAL, conversa.id);
  contadorRespostas = 0;
  caixaMensagens.innerHTML = "";

  registrarMensagemDoSistema(
    `Você entrou na sala como "${ETIQUETAS[etiqueta].nome}". Esta é uma conversa de acolhimento fraterno entre pares e não substitui o acompanhamento de profissionais de saúde. Respeito e sigilo sempre! 💚`
  );

  formEntradaChat.reset();
  mostrarEtapaConversa();
  simularRespostaDoParticipante(PARTICIPANTE_SIMULADO[etiqueta].saudacao);
}

/* ---------------------------------------------------------------------
 * ETAPA 2 — CONVERSA
 * ------------------------------------------------------------------- */

function mostrarEtapaConversa() {
  etapaEntrada.hidden = true;
  etapaConversa.hidden = false;

  // RF05: não permite escolher um horário no passado
  campoHorario.min = formatarParaCampoDataHora(new Date());

  renderizarConversa();
  if (!formMensagemChat.hidden) campoMensagemChat.focus();
}

/**
 * Atualiza a tela com os dados salvos da conversa.
 * Desenha apenas as mensagens NOVAS, para não redesenhar tudo a cada
 * envio (e para leitores de tela não repetirem o histórico inteiro).
 */
function renderizarConversa() {
  const conversa = buscarConversaAtual();

  // A moderação pode ter excluído o registro em outra aba
  if (!conversa) {
    limparConversaAtual();
    mostrarEtapaEntrada();
    return;
  }

  const mensagensNovas = conversa.mensagens.slice(caixaMensagens.children.length);
  if (mensagensNovas.length > 0) {
    caixaMensagens.insertAdjacentHTML("beforeend", mensagensNovas.map(criarHTMLDaMensagem).join(""));
    caixaMensagens.scrollTop = caixaMensagens.scrollHeight;
  }

  seletorEtiqueta.value = conversa.etiqueta;
  atualizarCabecalhoDoChat(conversa.etiqueta);
  atualizarEstadoDaConversa(conversa.status === "ativa");
  atualizarIndicadorDoChat();
}

/** Cada tipo de mensagem tem uma aparência diferente no chat. */
function criarHTMLDaMensagem(mensagem) {
  const texto = escaparHTML(mensagem.texto);
  const hora = formatarHora(mensagem.data);

  // Mensagens das pessoas: mostram nome + etiqueta (RF04)
  if (mensagem.tipo === "enviada" || mensagem.tipo === "recebida") {
    const etiqueta = ETIQUETAS[mensagem.etiqueta] || ETIQUETAS.busca;
    return `
      <div class="mensagem mensagem--${mensagem.tipo}">
        <span class="mensagem__autor">
          ${escaparHTML(mensagem.autor)}
          <span class="etiqueta ${etiqueta.classe}">${etiqueta.nome}</span>
        </span>
        <p>${texto}</p>
        <time class="mensagem__hora">${hora}</time>
      </div>`;
  }

  // Alerta de crise: inclui os botões de emergência
  if (mensagem.tipo === "alerta") {
    return `
      <div class="mensagem mensagem--alerta">
        <p>${texto}</p>
        ${criarHTMLContatosEmergencia()}
      </div>`;
  }

  // "sistema" e "agendamento"
  return `
    <div class="mensagem mensagem--${mensagem.tipo}">
      <p>${texto}</p>
      <time class="mensagem__hora">${hora}</time>
    </div>`;
}

function atualizarCabecalhoDoChat(etiqueta) {
  if (!etiqueta) {
    etiquetaAtual.hidden = true;
    return;
  }
  etiquetaAtual.hidden = false;
  etiquetaAtual.className = `etiqueta ${ETIQUETAS[etiqueta].classe}`;
  etiquetaAtual.textContent = ETIQUETAS[etiqueta].nome;
}

/** Habilita ou bloqueia os controles conforme a conversa esteja ativa. */
function atualizarEstadoDaConversa(estaAtiva) {
  formMensagemChat.hidden = !estaAtiva;
  painelAgendamento.hidden = !estaAtiva;
  botaoSairChat.hidden = !estaAtiva;
  seletorEtiqueta.disabled = !estaAtiva;
  avisoConversaEncerrada.hidden = estaAtiva;

  if (!estaAtiva) {
    indicadorDigitando.hidden = true;
    esconderAlerta(alertaChat);
  }
}

/** Mostra um "pontinho verde" no botão flutuante quando há conversa ativa. */
function atualizarIndicadorDoChat() {
  const conversa = buscarConversaAtual();
  const temConversaAtiva = Boolean(conversa && conversa.status === "ativa");
  botaoChatFlutuante.classList.toggle("flutuante--ativo", temConversaAtiva);
}

/* ---------------------------------------------------------------------
 * REGISTRO DE MENSAGENS
 * ------------------------------------------------------------------- */

function registrarMensagem(mensagem) {
  adicionarMensagemNaConversa(conversaAtualId, mensagem);
  renderizarConversa();
}

function registrarMensagemDoSistema(texto, tipo = "sistema") {
  registrarMensagem({ tipo: tipo, autor: "Sistema", etiqueta: null, texto: texto });
}

/** Envio de mensagem pelo usuário, com moderação e triagem de emergência. */
function enviarMensagemChat(evento) {
  evento.preventDefault();

  const texto = campoMensagemChat.value.trim();
  const conversa = buscarConversaAtual();
  if (texto === "" || !conversa || conversa.status !== "ativa") return;

  const resultado = analisarMensagem(texto, "chat");

  // Ofensas são bloqueadas e contabilizadas para a moderação
  if (resultado.tipo === "ofensivo") {
    registrarBloqueioOfensivo(conversa.id);
    exibirAlerta(alertaChat, "erro", `<p>${ORIENTACOES_MODERACAO.ofensivo}</p>`);
    return;
  }
  esconderAlerta(alertaChat);

  registrarMensagem({
    tipo: "enviada",
    autor: conversa.apelido,
    etiqueta: conversa.etiqueta,
    texto: texto
  });
  campoMensagemChat.value = "";

  // Triagem de emergência: risco à vida → encaminhamento imediato
  if (resultado.tipo === "crise") {
    marcarAlertaDeCrise(conversa.id);
    registrarMensagemDoSistema(
      "💛 Percebemos que você pode estar passando por um momento muito difícil, e você não precisa enfrentar isso sozinho(a). Nossos voluntários oferecem escuta, mas agora o mais indicado é falar com quem é preparado para momentos de crise: ligue para o CVV (188), gratuito e 24h, ou para o SAMU (192).",
      "alerta"
    );
    return;
  }

  simularRespostaDoParticipante();
}

/**
 * Simula a resposta da outra pessoa depois de alguns segundos,
 * mostrando o aviso "está digitando..." enquanto isso.
 */
function simularRespostaDoParticipante(textoDefinido) {
  const conversa = buscarConversaAtual();
  const participante = PARTICIPANTE_SIMULADO[conversa.etiqueta];

  // Usa o texto recebido ou a próxima resposta pronta da lista (em ciclo)
  const texto =
    textoDefinido || participante.respostas[contadorRespostas++ % participante.respostas.length];

  respostasPendentes++;
  indicadorDigitando.textContent = `${participante.nome} está digitando...`;
  indicadorDigitando.hidden = false;

  const tempoDeEspera = 1200 + Math.random() * 1300; // entre 1,2 e 2,5 segundos

  setTimeout(() => {
    respostasPendentes--;
    if (respostasPendentes === 0) indicadorDigitando.hidden = true;

    // A conversa pode ter sido encerrada enquanto a resposta era "digitada"
    const conversaAtualizada = buscarConversaAtual();
    if (!conversaAtualizada || conversaAtualizada.status !== "ativa") return;

    registrarMensagem({
      tipo: "recebida",
      autor: participante.nome,
      etiqueta: participante.etiqueta,
      texto: texto
    });
  }, tempoDeEspera);
}

/* ---------------------------------------------------------------------
 * RF04 — TROCA DE ETIQUETA
 * ------------------------------------------------------------------- */

function alterarEtiqueta() {
  const novaEtiqueta = seletorEtiqueta.value;

  atualizarConversa(conversaAtualId, { etiqueta: novaEtiqueta });
  registrarMensagemDoSistema(`🔄 Você alterou sua etiqueta para "${ETIQUETAS[novaEtiqueta].nome}".`);
}

/* ---------------------------------------------------------------------
 * RF05 — SUGESTÃO DE HORÁRIO PARA CONVERSA
 * ------------------------------------------------------------------- */

/** Converte uma data para o formato aceito pelo datetime-local: "AAAA-MM-DDTHH:MM". */
function formatarParaCampoDataHora(data) {
  const doisDigitos = (numero) => String(numero).padStart(2, "0");
  return (
    `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}` +
    `T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`
  );
}

function sugerirHorario(evento) {
  evento.preventDefault();

  if (!campoHorario.value) {
    exibirAlerta(alertaChat, "erro", "<p>📅 Escolha uma data e um horário.</p>");
    return;
  }

  const dataEscolhida = new Date(campoHorario.value);
  if (dataEscolhida <= new Date()) {
    exibirAlerta(alertaChat, "erro", "<p>🕐 Escolha um horário no futuro.</p>");
    return;
  }
  esconderAlerta(alertaChat);

  const conversa = atualizarConversa(conversaAtualId, {
    horarioSugerido: dataEscolhida.toISOString(),
    horarioConfirmado: false
  });

  // A proposta aparece no chat como mensagem especial do sistema
  registrarMensagemDoSistema(
    `📅 Proposta de horário: ${conversa.apelido} (${ETIQUETAS[conversa.etiqueta].nome}) sugeriu conversar ${formatarHorarioAgendado(conversa.horarioSugerido)}.`,
    "agendamento"
  );

  formAgendamento.reset();
  painelAgendamento.open = false;
  simularConfirmacaoDeHorario();
}

/** Na proposta do projeto, uma parte sugere o horário e a outra confirma. */
function simularConfirmacaoDeHorario() {
  const participante = PARTICIPANTE_SIMULADO[buscarConversaAtual().etiqueta];

  setTimeout(() => {
    const conversa = buscarConversaAtual();
    if (!conversa || conversa.status !== "ativa") return;

    atualizarConversa(conversa.id, { horarioConfirmado: true });
    registrarMensagemDoSistema(`✅ ${participante.nome} confirmou o horário proposto. Combinado!`, "agendamento");
  }, 2500);
}

/* ---------------------------------------------------------------------
 * SAIR / NOVA CONVERSA
 * ------------------------------------------------------------------- */

function sairDaConversa() {
  if (!confirm("Deseja mesmo sair e encerrar esta conversa?")) return;

  encerrarConversa(conversaAtualId, "participante", "A conversa foi encerrada pelo participante.");
  limparConversaAtual();
  mostrarEtapaEntrada();
  mostrarAviso("Conversa encerrada. Cuide-se! 💚");
}

function iniciarNovaConversa() {
  limparConversaAtual();
  mostrarEtapaEntrada();
}

/* ---------------------------------------------------------------------
 * INICIALIZAÇÃO
 * ------------------------------------------------------------------- */

function iniciarChat() {
  botoesAbrirChat.forEach((botao) => botao.addEventListener("click", abrirChat));
  botaoFecharChat.addEventListener("click", fecharChat);
  fundoChat.addEventListener("click", fecharChat);

  formEntradaChat.addEventListener("submit", entrarNaSala);
  formMensagemChat.addEventListener("submit", enviarMensagemChat);
  campoMensagemChat.addEventListener("input", () => esconderAlerta(alertaChat)); // some ao reescrever
  formAgendamento.addEventListener("submit", sugerirHorario);
  seletorEtiqueta.addEventListener("change", alterarEtiqueta);
  botaoSairChat.addEventListener("click", sairDaConversa);
  botaoNovaConversa.addEventListener("click", iniciarNovaConversa);

  // Tecla Esc fecha a sala (quando nenhum modal estiver aberto por cima)
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && chatEstaAberto() && !document.querySelector("dialog[open]")) {
      fecharChat();
    }
  });

  // Quando a moderação encerra a conversa no painel administrativo (em
  // outra aba), o evento "storage" avisa esta aba e a tela é atualizada.
  window.addEventListener("storage", (evento) => {
    if (evento.key !== CHAVES.conversas || !conversaAtualId) return;

    if (!etapaConversa.hidden) {
      renderizarConversa();
    } else {
      atualizarIndicadorDoChat();
    }
  });

  atualizarIndicadorDoChat();
}

iniciarChat();
