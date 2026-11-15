/* =====================================================================
 * MURAL.JS — Página principal: Mural dos Pensamentos Positivos
 * ---------------------------------------------------------------------
 * Responsável por:
 *   - Termo de Consentimento exibido no primeiro acesso;
 *   - Formulário que aparece ao clicar em "Compartilhar um pensamento";
 *   - Filtro de moderação antes da publicação (RF02);
 *   - Listagem dos pensamentos em cards, com filtro por categoria (RF03).
 * ===================================================================== */

const LIMITE_CARACTERES = 280;
const MINIMO_CARACTERES = 5;

/* ---------- Elementos da página ---------- */
const modalTermo = document.getElementById("modal-termo");
const checkTermo = document.getElementById("check-termo");
const botaoAceitarTermo = document.getElementById("botao-aceitar-termo");

const botaoNovoPensamento = document.getElementById("botao-novo-pensamento");
const painelFormulario = document.getElementById("painel-formulario");
const formPensamento = document.getElementById("form-pensamento");
const campoAutor = document.getElementById("campo-autor");
const campoTexto = document.getElementById("campo-texto");
const contadorCaracteres = document.getElementById("contador-caracteres");
const alertaMural = document.getElementById("alerta-mural");
const botaoCancelarPensamento = document.getElementById("botao-cancelar-pensamento");

const listaPensamentos = document.getElementById("lista-pensamentos");
const muralVazio = document.getElementById("mural-vazio");
const contadorPensamentos = document.getElementById("contador-pensamentos");
const botoesFiltro = document.querySelectorAll(".filtro");

/* ---------- Estado da tela ---------- */
let categoriaSelecionada = "todas";

/* ---------------------------------------------------------------------
 * TERMO DE CONSENTIMENTO
 * O acesso exige concordância com o termo (proposta do projeto, item 5.1).
 * ------------------------------------------------------------------- */

function exibirTermoSeNecessario() {
  if (!termoFoiAceito()) {
    modalTermo.showModal();
  }
}

function aceitarTermo() {
  registrarAceiteDoTermo();
  modalTermo.close();
  mostrarAviso("Seja bem-vindo(a) ao Mural! 💚");
}

/* ---------------------------------------------------------------------
 * FORMULÁRIO DE NOVO PENSAMENTO
 * ------------------------------------------------------------------- */

function abrirFormulario() {
  painelFormulario.hidden = false;
  botaoNovoPensamento.setAttribute("aria-expanded", "true");
  painelFormulario.scrollIntoView({ behavior: "smooth", block: "start" });
  campoTexto.focus({ preventScroll: true });
}

function fecharFormulario() {
  painelFormulario.hidden = true;
  botaoNovoPensamento.setAttribute("aria-expanded", "false");
  esconderAlerta(alertaMural);
}

function alternarFormulario() {
  if (painelFormulario.hidden) {
    abrirFormulario();
  } else {
    fecharFormulario();
  }
}

function atualizarContadorDeCaracteres() {
  const total = campoTexto.value.length;
  contadorCaracteres.textContent = `${total}/${LIMITE_CARACTERES}`;
  contadorCaracteres.classList.toggle("contador--limite", total > LIMITE_CARACTERES - 30);
}

/** Valida, passa pelo filtro de moderação e publica o pensamento. */
function publicarPensamento(evento) {
  evento.preventDefault(); // impede o recarregamento da página

  const texto = campoTexto.value.trim();
  const autor = campoAutor.value.trim() || "Anônimo"; // RF03: padrão "Anônimo"
  const categoria = formPensamento.elements.categoria.value;

  // 1) Validação básica de tamanho
  if (texto.length < MINIMO_CARACTERES) {
    exibirAlerta(
      alertaMural,
      "erro",
      `<p>✍️ Escreva uma mensagem com pelo menos ${MINIMO_CARACTERES} caracteres.</p>`
    );
    campoTexto.focus();
    return;
  }

  // 2) RF02 — Filtro de moderação ANTES da publicação.
  //    O apelido também é verificado, para evitar nomes ofensivos.
  const resultado = analisarMensagem(`${autor} ${texto}`, "mural");

  if (resultado.tipo !== "ok") {
    exibirAlertaDeModeracao(alertaMural, resultado);
    return; // os dados continuam no formulário para a pessoa reescrever
  }

  // 3) Mensagem aprovada: salva e atualiza a tela
  adicionarPensamento(autor, texto, categoria);

  formPensamento.reset();
  atualizarContadorDeCaracteres();
  fecharFormulario();
  selecionarFiltro("todas"); // garante que o novo card apareça
  mostrarAviso("Seu pensamento foi publicado no mural! 🌻");
}

/* ---------------------------------------------------------------------
 * LISTAGEM DOS CARDS (RF03)
 * ------------------------------------------------------------------- */

function renderizarMural() {
  const todos = listarPensamentos();
  const idsCurtidos = listarCurtidas();

  const visiveis =
    categoriaSelecionada === "todas"
      ? todos
      : todos.filter((pensamento) => pensamento.categoria === categoriaSelecionada);

  listaPensamentos.innerHTML = visiveis
    .map((pensamento) => criarHTMLDoCard(pensamento, idsCurtidos.includes(pensamento.id)))
    .join("");

  muralVazio.hidden = visiveis.length > 0;
  contadorPensamentos.textContent =
    visiveis.length === 1 ? "1 pensamento" : `${visiveis.length} pensamentos`;
}

function criarHTMLDoCard(pensamento, foiCurtido) {
  // Se a categoria salva for inválida, usamos "motivacao" como padrão
  const chaveCategoria = CATEGORIAS[pensamento.categoria] ? pensamento.categoria : "motivacao";
  const categoria = CATEGORIAS[chaveCategoria];
  const textoEditado = pensamento.editadoEm ? " · editado pela moderação" : "";

  return `
    <article class="card card--${chaveCategoria}">
      <span class="card__categoria">${categoria.icone} ${categoria.nome}</span>
      <p class="card__texto">${escaparHTML(pensamento.texto)}</p>
      <footer class="card__rodape">
        <span class="card__autor">
          <strong>${escaparHTML(pensamento.autor)}</strong>
          <time datetime="${pensamento.criadoEm}" title="${formatarDataHora(pensamento.criadoEm)}">
            ${formatarTempoRelativo(pensamento.criadoEm)}${textoEditado}
          </time>
        </span>
        <button type="button" class="botao-curtir" data-id="${pensamento.id}"
                aria-pressed="${foiCurtido}" title="Este pensamento me inspirou">
          💚 <span>${pensamento.curtidas}</span>
        </button>
      </footer>
    </article>`;
}

function selecionarFiltro(categoria) {
  categoriaSelecionada = categoria;

  botoesFiltro.forEach((botao) => {
    const estaAtivo = botao.dataset.categoria === categoria;
    botao.classList.toggle("filtro--ativo", estaAtivo);
    botao.setAttribute("aria-pressed", estaAtivo);
  });

  renderizarMural();
}

/**
 * Delegação de eventos: um único "ouvinte" na lista trata o clique de
 * todos os botões de curtir, inclusive dos cards criados depois.
 */
function tratarCliqueNoMural(evento) {
  const botaoCurtir = evento.target.closest(".botao-curtir");
  if (!botaoCurtir) return;

  const resultado = alternarCurtida(botaoCurtir.dataset.id);
  if (!resultado) return;

  // Atualiza só o botão clicado (sem redesenhar o mural inteiro)
  botaoCurtir.setAttribute("aria-pressed", resultado.curtido);
  botaoCurtir.querySelector("span").textContent = resultado.total;
}

/* ---------------------------------------------------------------------
 * INICIALIZAÇÃO
 * ------------------------------------------------------------------- */

function iniciarMural() {
  // Termo de consentimento
  modalTermo.addEventListener("cancel", (evento) => evento.preventDefault()); // impede fechar com Esc
  checkTermo.addEventListener("change", () => {
    botaoAceitarTermo.disabled = !checkTermo.checked;
  });
  botaoAceitarTermo.addEventListener("click", aceitarTermo);

  // Formulário
  botaoNovoPensamento.addEventListener("click", alternarFormulario);
  botaoCancelarPensamento.addEventListener("click", fecharFormulario);
  campoTexto.addEventListener("input", atualizarContadorDeCaracteres);
  formPensamento.addEventListener("submit", publicarPensamento);

  // Filtros e cards
  botoesFiltro.forEach((botao) => {
    botao.addEventListener("click", () => selecionarFiltro(botao.dataset.categoria));
  });
  listaPensamentos.addEventListener("click", tratarCliqueNoMural);

  // Se o painel administrativo editar o mural em outra aba, atualizamos aqui
  window.addEventListener("storage", (evento) => {
    if (evento.key === CHAVES.pensamentos) renderizarMural();
  });

  renderizarMural();
  exibirTermoSeNecessario();
}

iniciarMural();
