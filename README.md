# 🌻 Mural dos Pensamentos Positivos

Protótipo funcional (MVP) do Projeto Integrador I-A — Ação Extensionista
Curso de Análise e Desenvolvimento de Sistemas · FAESA · 2026

Plataforma web de **acolhimento fraterno e escuta solidária** entre pares, com dois pilares:

1. **Mural dos Pensamentos Positivos** — cards com mensagens de gratidão, superação,
   autocuidado e motivação, protegidos por um filtro automático de moderação.
2. **Sala de Bate-Papo** — conversa com etiquetas de perfil e sugestão de horários.

> ⚠️ Este projeto **não substitui o acompanhamento de profissionais de saúde mental**.
> Em crise ou risco à vida: **CVV 188** (24h, gratuito) · **SAMU 192** · **CAPS**.

---

## Como executar

Não precisa instalar nada. Basta abrir o `index.html` no navegador.

Recomendado: usar a extensão **Live Server** do VS Code (botão direito no `index.html` →
*Open with Live Server*), pois ela garante que o mural e o painel administrativo
compartilhem os mesmos dados em qualquer navegador.

- **Mural:** `index.html`
- **Painel administrativo:** `admin.html` — senha de demonstração: `admin123`

---

## Estrutura de pastas

```
mural-pensamentos-positivos/
├── index.html          → Mural (página principal) + Sala de Bate-Papo
├── admin.html          → Painel administrativo
├── css/
│   ├── style.css       → Estilos gerais (variáveis, componentes, responsividade)
│   └── admin.css       → Estilos exclusivos do painel
├── img/
│   └── fundo-destaque.svg → Ilustração de fundo da seção de destaque (jardim em SVG)
└── js/
    ├── armazenamento.js → Camada de dados (localStorage como "banco de dados")
    ├── moderacao.js     → Filtro de palavras (RF02)
    ├── comum.js         → Funções compartilhadas (datas, alertas, emergência, XSS)
    ├── mural.js         → Lógica do mural e do termo de consentimento
    ├── chat.js          → Lógica da sala de bate-papo
    └── admin.js         → Lógica do painel administrativo
```

Os scripts são carregados nesta ordem: **dados → filtro → comum → tela**.

---

## Requisitos atendidos

| Requisito | Onde está |
|---|---|
| **RF01** — Banner de transparência e CVV 188 | Topo fixo de todas as páginas |
| **RF02** — Filtro de mensagens negativas | `js/moderacao.js` (mural, chat e edição do admin) |
| **RF03** — Mural com nome (padrão "Anônimo"), texto e data | `js/mural.js` |
| **RF04** — Etiquetas *Pessoa em Busca de Acolhimento* (cinza) e *Voluntário da Comunidade* (verde), com aviso ao trocar | `js/chat.js` |
| **RF05** — Sugestão de horário (`datetime-local`) como mensagem especial | `js/chat.js` |
| **RNF01** — Cores pastel (#e0f2f1 / #2c6e63), fonte legível, alto contraste | `css/style.css` |
| **RNF02** — Responsivo (< 600px) | `css/style.css` e `css/admin.css` |
| **RNF03** — Código simples e comentado | Todos os arquivos |

### Melhorias em relação à especificação

- **Termo de Consentimento** obrigatório no primeiro acesso (data do aceite registrada — LGPD).
- **Botão de Emergência** em todas as telas: CVV 188, SAMU 192 e busca do CAPS mais próximo.
- **Filtro em 3 níveis:**
  - *crise* → acolhe e encaminha para CVV/SAMU/CAPS;
  - *ofensivo* → bloqueia no mural e no chat;
  - *negativo* → bloqueia só no mural, porque no chat desabafar faz parte do acolhimento.
- O filtro ignora acentos e maiúsculas e compara **palavras inteiras**, o que evita falsos positivos.
- **Categorias** e filtro no mural, além de curtidas (💚) limitadas a uma por navegador.
- **Painel administrativo:**
  - edita e exclui pensamentos;
  - lista as solicitações de conversa e encerra um chat em tempo real;
  - mostra indicadores de crise e de ofensas bloqueadas, sem expor o conteúdo das conversas (LGPD).
- Proteção contra **XSS**: todo texto digitado passa por `escaparHTML()`.
- Acessibilidade: `<dialog>` nativo, `aria-*`, foco visível, `role="log"` no chat e `prefers-reduced-motion`.

---

## Roteiro de demonstração (apresentação)

1. Abra o `index.html`, leia e aceite o **Termo de Consentimento**.
2. Clique em **✍️ Compartilhar um pensamento** e tente publicar *"Hoje o dia foi péssimo"*.
   O filtro bloqueia, mostra o termo encontrado e mantém o texto no formulário.
3. Tente *"não aguento mais"*: aparece o alerta de crise com CVV, SAMU e CAPS.
4. Publique uma mensagem positiva: o card aparece no topo do mural.
5. Abra a **💬 Sala de Bate-Papo**, escolha uma etiqueta e converse.
   Troque a etiqueta e sugira um horário (RF04 e RF05).
6. Em **outra aba**, abra o `admin.html` (senha `admin123`) → **Solicitações de conversa** →
   **⛔ Encerrar chat** na sua conversa. Volte à primeira aba: a conversa foi encerrada na hora.
7. Ainda no painel, edite ou exclua um pensamento. O mural se atualiza sozinho na outra aba.

---

## Limitações do MVP e próximos passos

| Limitação atual | Próximo passo |
|---|---|
| Dados ficam no `localStorage` (só no navegador) | Back-end com API REST e banco de dados (ex.: Node.js + PostgreSQL) |
| A outra pessoa do chat é **simulada** | Comunicação em tempo real com WebSocket |
| Login do admin com senha fixa no JavaScript | Autenticação no servidor com senha criptografada (hash) |
| Filtro baseado em lista de palavras | Análise semântica / processamento de linguagem natural |
| Sem cadastro de voluntários | Cadastro com validação e capacitação ética dos voluntários |

---

### Base legal considerada

- **Lei nº 4.119/1962, Art. 13:** atividades clínicas são privativas de psicólogos.
  Por isso o app não usa linguagem clínica.
- **Decreto-Lei nº 3.688/1941, Art. 47:** exercício ilegal de profissão. Por isso há alertas visíveis.
- **Lei nº 9.608/1998:** Lei do Voluntariado, base da escuta solidária.
- **Lei nº 13.709/2018 (LGPD):** anonimato opcional, registro de consentimento e minimização de dados no painel.
