/* =====================================================================
 * ADMIN.JS — Painel Administrativo (moderação)
 * ---------------------------------------------------------------------
 * Funções do painel:
 *   - Editar e excluir pensamentos do mural;
 *   - Listar as pessoas que solicitaram conversa e encerrar o chat
 *     em caso de necessidade.
 *
 * ATENÇÃO: o login abaixo é apenas DEMONSTRATIVO (protótipo acadêmico).
 * Em um sistema real, a autenticação deve ser feita no servidor, com
 * senha criptografada e controle de sessão. Nunca deixe a senha no JS! - !
 * ===================================================================== */

const SENHA_DEMONSTRACAO = "admin123";
const CHAVE_SESSAO_ADMIN = "mpp_admin_logado";

const AVISO_ENCERRAMENTO_MODERACAO =
  "🔒 Esta conversa foi encerrada pela equipe de moderação. Se precisar de ajuda imediata, ligue para o CVV (188), gratuito e 24h, ou para o SAMU (192).";

/* ---------- Elementos da página ---------- */
const telaLogin = document.getElementById("tela-login");
const formLogin = document.getElementById("form-login");
const campoSenha = document.getElementById("campo-senha");
const alertaLogin = document.getElementById("alerta-login");
const botaoSair = document.getElementById("botao-sair");

const painelAdmin = document.getElementById("painel-admin");
const resumoPensamentos = document.getElementById("resumo-pensamentos");
const resumoAtivas = document.getElementById("resumo-ativas");
const resumoAtencao = document.getElementById("resumo-atencao");
const resumoEncerradas = document.getElementById("resumo-encerradas");
const contadorAbaConversas = document.getElementById("contador-aba-conversas");
const botoesAba = document.querySelectorAll(".aba");

const secaoPensamentos = document.getElementById("secao-pensamentos");
const campoBusca = document.getElementById("campo-busca");
const botaoRestaurar = document.getElementById("botao-restaurar");
const corpoTabelaPensamentos = document.getElementById(
  "corpo-tabela-pensamentos"
);
const semPensamentos = document.getElementById("sem-pensamentos");

const secaoConversas = document.getElementById("secao-conversas");
const botaoLimparEncerradas = document.getElementById(
  "botao-limpar-encerradas"
);
const corpoTabelaConversas = document.getElementById("corpo-tabela-conversas");
const semConversas = document.getElementById("sem-conversas");

const modalEdicao = document.getElementById("modal-edicao");
const formEdicao = document.getElementById("form-edicao");
const campoEdicaoAutor = document.getElementById("edicao-autor");
const campoEdicaoCategoria = document.getElementById("edicao-categoria");
const campoEdicaoTexto = document.getElementById("edicao-texto");
const alertaEdicao = document.getElementById("alerta-edicao");
const botaoCancelarEdicao = document.getElementById("botao-cancelar-edicao");
const botaoFecharEdicao = document.getElementById("botao-fechar-edicao");

/* ---------- Estado da tela ---------- */
let pensamentoEmEdicaoId = null;

/* ---------------------------------------------------------------------
 * LOGIN (demonstrativo)
 * ------------------------------------------------------------------- */

function usuarioEstaLogado() {
  return sessionStorage.getItem(CHAVE_SESSAO_ADMIN) === "sim";
}

function fazerLogin(evento) {
  evento.preventDefault();

  if (campoSenha.value !== SENHA_DEMONSTRACAO) {
    exibirAlerta(
      alertaLogin,
      "erro",
      "<p>Senha incorreta. Tente novamente.</p>"
    );
    campoSenha.select();
    return;
  }

  sessionStorage.setItem(CHAVE_SESSAO_ADMIN, "sim");
  formLogin.reset();
  esconderAlerta(alertaLogin);
  mostrarPainel();
}

function fazerLogout() {
  sessionStorage.removeItem(CHAVE_SESSAO_ADMIN);
  mostrarLogin();
}

function mostrarLogin() {
  telaLogin.hidden = false;
  painelAdmin.hidden = true;
  botaoSair.hidden = true;
  campoSenha.focus();
}

function mostrarPainel() {
  telaLogin.hidden = true;
  painelAdmin.hidden = false;
  botaoSair.hidden = false;
  atualizarPainel();
}

/* ---------------------------------------------------------------------
 * ATUALIZAÇÃO GERAL
 * ------------------------------------------------------------------- */

function atualizarPainel() {
  renderizarResumo();
  renderizarTabelaPensamentos();
  renderizarTabelaConversas();
}

/** Uma conversa precisa de atenção se teve termos de crise ou ofensas bloqueadas. */
function precisaDeAtencao(conversa) {
  return conversa.alertaCrise || conversa.bloqueiosOfensivos > 0;
}

function renderizarResumo() {
  const conversas = listarConversas();
  const ativas = conversas.filter((conversa) => conversa.status === "ativa");

  resumoPensamentos.textContent = listarPensamentos().length;
  resumoAtivas.textContent = ativas.length;
  resumoAtencao.textContent = ativas.filter(precisaDeAtencao).length;
  resumoEncerradas.textContent = conversas.length - ativas.length;
  contadorAbaConversas.textContent = ativas.length;
}

function trocarAba(abaSelecionada) {
  botoesAba.forEach((botao) => {
    const estaAtiva = botao.dataset.aba === abaSelecionada;
    botao.classList.toggle("aba--ativa", estaAtiva);
    botao.setAttribute("aria-selected", estaAtiva);
  });

  secaoPensamentos.hidden = abaSelecionada !== "pensamentos";
  secaoConversas.hidden = abaSelecionada !== "conversas";
}

/* ---------------------------------------------------------------------
 * PENSAMENTOS DO MURAL — editar e excluir
 * ------------------------------------------------------------------- */

function renderizarTabelaPensamentos() {
  const busca = campoBusca.value.trim().toLowerCase();

  const pensamentos = listarPensamentos().filter((pensamento) =>
    `${pensamento.texto} ${pensamento.autor}`.toLowerCase().includes(busca)
  );

  corpoTabelaPensamentos.innerHTML = pensamentos
    .map(criarLinhaDoPensamento)
    .join("");
  semPensamentos.hidden = pensamentos.length > 0;
}

function criarLinhaDoPensamento(pensamento) {
  const chaveCategoria = CATEGORIAS[pensamento.categoria]
    ? pensamento.categoria
    : "motivacao";
  const categoria = CATEGORIAS[chaveCategoria];
  const textoEditado = pensamento.editadoEm
    ? `<br><span class="texto-pequeno">editado em ${formatarDataHora(pensamento.editadoEm)}</span>`
    : "";

  return `
    <tr>
      <td data-label="Publicado em">${formatarDataHora(pensamento.criadoEm)}${textoEditado}</td>
      <td data-label="Autor">${escaparHTML(pensamento.autor)}</td>
      <td data-label="Categoria">
        <span class="tag tag--${chaveCategoria}">${categoria.icone} ${categoria.nome}</span>
      </td>
      <td data-label="Pensamento" class="celula-texto">${escaparHTML(pensamento.texto)}</td>
      <td data-label="Curtidas">💚 ${pensamento.curtidas}</td>
      <td data-label="Ações" class="celula-acoes">
        <button type="button" class="botao botao--secundario botao--pequeno"
                data-acao="editar" data-id="${pensamento.id}">✏️ Editar</button>
        <button type="button" class="botao botao--perigo botao--pequeno"
                data-acao="excluir" data-id="${pensamento.id}">🗑️ Excluir</button>
      </td>
    </tr>`;
}

/** Delegação de eventos: trata os botões de todas as linhas da tabela. */
function tratarAcaoNoPensamento(evento) {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;

  if (botao.dataset.acao === "editar") abrirEdicao(botao.dataset.id);
  if (botao.dataset.acao === "excluir")
    excluirPensamentoComConfirmacao(botao.dataset.id);
}

function abrirEdicao(id) {
  const pensamento = buscarPensamento(id);
  if (!pensamento) return;

  pensamentoEmEdicaoId = id;
  campoEdicaoAutor.value = pensamento.autor;
  campoEdicaoCategoria.value = pensamento.categoria;
  campoEdicaoTexto.value = pensamento.texto;
  esconderAlerta(alertaEdicao);

  modalEdicao.showModal();
  campoEdicaoTexto.focus();
}

function fecharEdicao() {
  pensamentoEmEdicaoId = null;
  modalEdicao.close();
}

function salvarEdicao(evento) {
  evento.preventDefault();

  const autor = campoEdicaoAutor.value.trim() || "Anônimo";
  const texto = campoEdicaoTexto.value.trim();
  const categoria = campoEdicaoCategoria.value;

  if (texto.length < 5) {
    exibirAlerta(
      alertaEdicao,
      "erro",
      "<p>A mensagem precisa ter pelo menos 5 caracteres.</p>"
    );
    return;
  }

  // A edição também passa pelo filtro: nem a moderação publica conteúdo negativo
  const resultado = analisarMensagem(`${autor} ${texto}`, "mural");
  if (resultado.tipo !== "ok") {
    exibirAlertaDeModeracao(alertaEdicao, resultado);
    return;
  }

  editarPensamento(pensamentoEmEdicaoId, { autor, texto, categoria });
  fecharEdicao();
  atualizarPainel();
  mostrarAviso("Pensamento atualizado com sucesso! ✏️");
}

function excluirPensamentoComConfirmacao(id) {
  const pensamento = buscarPensamento(id);
  if (!pensamento) return;

  const confirmou = confirm(
    `Deseja excluir este pensamento do mural?\n\n"${pensamento.texto}"`
  );
  if (!confirmou) return;

  excluirPensamento(id);
  atualizarPainel();
  mostrarAviso("Pensamento excluído do mural.", "info");
}

function restaurarExemplos() {
  const confirmou = confirm(
    "Isso vai substituir TODOS os pensamentos atuais pelos exemplos iniciais. Deseja continuar?"
  );
  if (!confirmou) return;

  restaurarPensamentosDeExemplo();
  atualizarPainel();
  mostrarAviso("Pensamentos de exemplo restaurados.", "info");
}

/* ---------------------------------------------------------------------
 * SOLICITAÇÕES DE CONVERSA — acompanhar e encerrar
 * ------------------------------------------------------------------- */

/** Ordem: ativas primeiro → com alerta primeiro → atividade mais recente. */
function ordenarConversas(a, b) {
  if (a.status !== b.status) {
    return a.status === "ativa" ? -1 : 1;
  }
  if (precisaDeAtencao(a) !== precisaDeAtencao(b)) {
    return precisaDeAtencao(a) ? -1 : 1;
  }
  return new Date(b.ultimaAtividade) - new Date(a.ultimaAtividade);
}

function renderizarTabelaConversas() {
  const conversas = listarConversas().sort(ordenarConversas);

  corpoTabelaConversas.innerHTML = conversas.map(criarLinhaDaConversa).join("");
  semConversas.hidden = conversas.length > 0;
}

function criarLinhaDaConversa(conversa) {
  const etiqueta = ETIQUETAS[conversa.etiqueta] || ETIQUETAS.busca;
  const estaAtiva = conversa.status === "ativa";
  const classeDaLinha =
    estaAtiva && precisaDeAtencao(conversa) ? "linha--atencao" : "";

  const botaoDeAcao = estaAtiva
    ? `<button type="button" class="botao botao--perigo botao--pequeno"
               data-acao="encerrar" data-id="${conversa.id}">⛔ Encerrar chat</button>`
    : `<button type="button" class="botao botao--texto botao--pequeno"
               data-acao="remover" data-id="${conversa.id}">🗑️ Remover registro</button>`;

  return `
    <tr class="${classeDaLinha}">
      <td data-label="Participante"><strong>${escaparHTML(conversa.apelido)}</strong></td>
      <td data-label="Etiqueta"><span class="etiqueta ${etiqueta.classe}">${etiqueta.nome}</span></td>
      <td data-label="Início">
        ${formatarDataHora(conversa.iniciadaEm)}
        <br><span class="texto-pequeno">última atividade ${formatarTempoRelativo(conversa.ultimaAtividade)}</span>
      </td>
      <td data-label="Horário sugerido">${criarTextoDoHorario(conversa)}</td>
      <td data-label="Indicadores">${criarIndicadores(conversa)}</td>
      <td data-label="Situação">${criarTextoDaSituacao(conversa)}</td>
      <td data-label="Ações" class="celula-acoes">${botaoDeAcao}</td>
    </tr>`;
}

function criarTextoDoHorario(conversa) {
  if (!conversa.horarioSugerido) {
    return '<span class="texto-pequeno">—</span>';
  }
  const situacao = conversa.horarioConfirmado
    ? "✅ confirmado"
    : "⏳ aguardando confirmação";
  return `${formatarHorarioAgendado(conversa.horarioSugerido)}<br><span class="texto-pequeno">${situacao}</span>`;
}

function criarIndicadores(conversa) {
  const indicadores = [];

  if (conversa.alertaCrise) {
    indicadores.push(
      '<span class="indicador indicador--crise">⚠️ Termo de crise</span>'
    );
  }
  if (conversa.bloqueiosOfensivos > 0) {
    indicadores.push(
      `<span class="indicador indicador--ofensivo">🚫 ${conversa.bloqueiosOfensivos} ofensa(s) bloqueada(s)</span>`
    );
  }

  return indicadores.length > 0
    ? indicadores.join(" ")
    : '<span class="texto-pequeno">Nenhum</span>';
}

function criarTextoDaSituacao(conversa) {
  if (conversa.status === "ativa") {
    return '<span class="situacao situacao--ativa">● Ativa</span>';
  }
  const quemEncerrou =
    conversa.encerradaPor === "moderacao"
      ? "pela moderação"
      : "pelo participante";
  return `<span class="situacao situacao--encerrada">Encerrada ${quemEncerrou}</span>`;
}

function tratarAcaoNaConversa(evento) {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;

  if (botao.dataset.acao === "encerrar")
    encerrarConversaComConfirmacao(botao.dataset.id);
  if (botao.dataset.acao === "remover")
    removerRegistroDeConversa(botao.dataset.id);
}

/**
 * Encerra o chat. Se o participante estiver com a sala aberta em outra
 * aba, ele recebe o aviso na hora (evento "storage" em js/chat.js).
 */
function encerrarConversaComConfirmacao(id) {
  const conversa = buscarConversa(id);
  if (!conversa) return;

  const confirmou = confirm(
    `Encerrar a conversa de "${conversa.apelido}"?\n\nO participante verá um aviso com os contatos de emergência (CVV 188 e SAMU 192).`
  );
  if (!confirmou) return;

  encerrarConversa(id, "moderacao", AVISO_ENCERRAMENTO_MODERACAO);
  atualizarPainel();
  mostrarAviso(`Conversa de "${conversa.apelido}" encerrada.`);
}

function removerRegistroDeConversa(id) {
  if (!confirm("Remover este registro de conversa encerrada?")) return;

  excluirConversa(id);
  atualizarPainel();
  mostrarAviso("Registro removido.", "info");
}

function limparConversasEncerradas() {
  if (!confirm("Remover todos os registros de conversas encerradas?")) return;

  excluirConversasEncerradas();
  atualizarPainel();
  mostrarAviso("Registros de conversas encerradas removidos.", "info");
}

/* ---------------------------------------------------------------------
 * INICIALIZAÇÃO
 * ------------------------------------------------------------------- */

function iniciarAdmin() {
  formLogin.addEventListener("submit", fazerLogin);
  botaoSair.addEventListener("click", fazerLogout);

  botoesAba.forEach((botao) => {
    botao.addEventListener("click", () => trocarAba(botao.dataset.aba));
  });

  campoBusca.addEventListener("input", renderizarTabelaPensamentos);
  botaoRestaurar.addEventListener("click", restaurarExemplos);
  corpoTabelaPensamentos.addEventListener("click", tratarAcaoNoPensamento);

  botaoLimparEncerradas.addEventListener("click", limparConversasEncerradas);
  corpoTabelaConversas.addEventListener("click", tratarAcaoNaConversa);

  formEdicao.addEventListener("submit", salvarEdicao);
  botaoCancelarEdicao.addEventListener("click", fecharEdicao);
  botaoFecharEdicao.addEventListener("click", fecharEdicao);
  fecharAoClicarFora(modalEdicao);

  // Atualiza o painel em tempo real quando o mural ou o chat mudam em outra aba
  window.addEventListener("storage", () => {
    if (usuarioEstaLogado()) atualizarPainel();
  });

  // Atualiza os tempos relativos ("há 5 min") a cada 30 segundos
  setInterval(() => {
    if (usuarioEstaLogado()) atualizarPainel();
  }, 30000);

  if (usuarioEstaLogado()) {
    mostrarPainel();
  } else {
    mostrarLogin();
  }
}

iniciarAdmin();
