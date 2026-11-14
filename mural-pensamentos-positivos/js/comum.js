/* =====================================================================
 * COMUM.JS — Constantes e funções usadas em todas as páginas
 * ---------------------------------------------------------------------
 * Formatação de datas, segurança (escape de HTML), alertas, avisos
 * rápidos e o Botão de Emergência presente em todas as telas.
 * ===================================================================== */

// Categorias dos pensamentos do mural
const CATEGORIAS = {
  gratidao: { nome: "Gratidão", icone: "🙏" },
  superacao: { nome: "Superação", icone: "🌱" },
  autocuidado: { nome: "Autocuidado", icone: "🌸" },
  motivacao: { nome: "Motivação", icone: "☀️" }
};

// Etiquetas de identificação da Sala de Bate-Papo (RF04)
const ETIQUETAS = {
  busca: { nome: "Pessoa em Busca de Acolhimento", classe: "etiqueta--busca" },
  voluntario: { nome: "Voluntário da Comunidade", classe: "etiqueta--voluntario" }
};

const LINK_BUSCA_CAPS = "https://www.google.com/maps/search/CAPS+perto+de+mim";

/* ---------------------------------------------------------------------
 * SEGURANÇA
 * ------------------------------------------------------------------- */

/**
 * Evita ataques de XSS: transforma caracteres especiais do HTML em texto.
 * TODO texto digitado pelo usuário passa por aqui antes de ir para o innerHTML.
 */
function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/* ---------------------------------------------------------------------
 * FORMATAÇÃO DE DATAS
 * ------------------------------------------------------------------- */

/** Ex.: "07/11/2026 às 14:30" */
function formatarDataHora(iso) {
  const data = new Date(iso);
  return `${data.toLocaleDateString("pt-BR")} às ${formatarHora(iso)}`;
}

/** Ex.: "14:30" */
function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Ex.: "sábado, 08/11 às 19:00" (usado no agendamento de conversas) */
function formatarHorarioAgendado(iso) {
  const data = new Date(iso);
  const diaDaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" });
  const diaMes = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${diaDaSemana}, ${diaMes} às ${formatarHora(iso)}`;
}

/** Ex.: "agora mesmo", "há 5 min", "há 2 h", "ontem", "há 3 dias" */
function formatarTempoRelativo(iso) {
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;

  return new Date(iso).toLocaleDateString("pt-BR");
}

/* ---------------------------------------------------------------------
 * ALERTAS (dentro de formulários)
 * ------------------------------------------------------------------- */

/** Mostra um alerta. Tipos: "erro" (vermelho) ou "crise" (amarelo). */
function exibirAlerta(elemento, tipo, conteudoHTML) {
  elemento.className = `alerta alerta--${tipo}`;
  elemento.innerHTML = conteudoHTML;
  elemento.hidden = false;
}

function esconderAlerta(elemento) {
  elemento.hidden = true;
  elemento.innerHTML = "";
}

/** Monta o alerta adequado para o resultado do filtro de moderação. */
function exibirAlertaDeModeracao(elemento, resultado) {
  // Em caso de crise, o foco é acolher e encaminhar, não "corrigir" o texto
  if (resultado.tipo === "crise") {
    exibirAlerta(
      elemento,
      "crise",
      `<p>💛 ${ORIENTACOES_MODERACAO.crise}</p>${criarHTMLContatosEmergencia()}`
    );
    return;
  }

  const termos = resultado.termos.map((termo) => `<mark>${escaparHTML(termo)}</mark>`).join(", ");
  exibirAlerta(
    elemento,
    "erro",
    `<p><strong>⚠️ Mensagem não publicada.</strong> ${ORIENTACOES_MODERACAO[resultado.tipo]}</p>
     <p class="alerta__detalhe">Termo(s) encontrado(s): ${termos}</p>`
  );
}

/** Botões rápidos de emergência (usados nos alertas de crise e no chat). */
function criarHTMLContatosEmergencia() {
  return `
    <div class="contatos-rapidos">
      <a href="tel:188" class="contato-rapido">📞 CVV 188</a>
      <a href="tel:192" class="contato-rapido">🚑 SAMU 192</a>
      <a href="${LINK_BUSCA_CAPS}" target="_blank" rel="noopener" class="contato-rapido">📍 CAPS perto de mim</a>
    </div>`;
}

/* ---------------------------------------------------------------------
 * AVISOS RÁPIDOS (toast) — substituem o alert() do navegador
 * ------------------------------------------------------------------- */

/** Tipos: "sucesso" (verde), "erro" (vermelho) ou "info" (cinza). */
function mostrarAviso(mensagem, tipo = "sucesso") {
  const areaAvisos = document.getElementById("area-avisos");
  const aviso = document.createElement("div");

  aviso.className = `aviso aviso--${tipo}`;
  aviso.textContent = mensagem;
  areaAvisos.appendChild(aviso);

  // Remove o aviso depois de 4 segundos
  setTimeout(() => aviso.remove(), 4000);
}

/* ---------------------------------------------------------------------
 * MODAIS (<dialog>) E BOTÃO DE EMERGÊNCIA
 * ------------------------------------------------------------------- */

/** Fecha o modal quando a pessoa clica no fundo escuro, fora da caixa. */
function fecharAoClicarFora(modal) {
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) modal.close();
  });
}

/**
 * Todo botão com o atributo data-abrir-emergencia abre o modal com
 * CVV (188), SAMU (192) e a busca do CAPS mais próximo.
 */
function configurarBotoesDeEmergencia() {
  const modalEmergencia = document.getElementById("modal-emergencia");
  if (!modalEmergencia) return;

  document.querySelectorAll("[data-abrir-emergencia]").forEach((botao) => {
    botao.addEventListener("click", () => modalEmergencia.showModal());
  });
  fecharAoClicarFora(modalEmergencia);
}

configurarBotoesDeEmergencia();
