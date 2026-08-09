function linkWhatsapp(nomeProduto) {
  const mensagem = `Olá! Tenho interesse no produto: ${nomeProduto}`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
}

function criarCardProduto(produto) {
  const card = document.createElement("article");
  card.className = "card-produto";

  card.innerHTML = `
    <a class="card-produto__link" href="produto.html?id=${encodeURIComponent(produto.id)}">
      <img class="card-produto__img" src="${produto.imagens[0] || ""}" alt="${produto.nome}" loading="lazy" />
      <div class="card-produto__body">
        <h3 class="card-produto__nome">${produto.nome}</h3>
        <p class="card-produto__desc">${produto.descricao}</p>
        <span class="card-produto__preco">${produto.preco}</span>
      </div>
    </a>
    <div class="card-produto__acoes">
      <a class="btn btn-whatsapp" href="${linkWhatsapp(produto.nome)}" target="_blank" rel="noopener">
        Pedir no WhatsApp
      </a>
    </div>
  `;

  return card;
}

let produtosCarregados = [];
let categoriaAtiva = "";

function normalizarTexto(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function aplicarFiltros() {
  const grid = document.getElementById("grid-produtos");
  const campoBusca = document.getElementById("campo-busca-header");
  const termoBusca = normalizarTexto(campoBusca ? campoBusca.value : "");

  const produtosFiltrados = produtosCarregados.filter((produto) => {
    const pertenceCategoria = !categoriaAtiva || produto.categoria_id === categoriaAtiva;
    const combinaBusca =
      !termoBusca ||
      normalizarTexto(produto.nome).includes(termoBusca) ||
      normalizarTexto(produto.descricao).includes(termoBusca);
    return pertenceCategoria && combinaBusca;
  });

  if (produtosFiltrados.length === 0) {
    grid.innerHTML =
      produtosCarregados.length === 0
        ? `<p class="grid-vazio">Nenhum produto cadastrado ainda.</p>`
        : `<p class="grid-vazio">Nenhum produto encontrado.</p>`;
    return;
  }

  grid.innerHTML = "";
  produtosFiltrados.forEach((produto) => grid.appendChild(criarCardProduto(produto)));
}

async function renderizarCategoriasSidebar() {
  const container = document.getElementById("lista-categorias-filtro");
  if (!container) return;

  const categorias = await obterCategorias();

  container.innerHTML = [
    `<button type="button" class="categoria-filtro ativo" data-id="">Todas</button>`,
    ...categorias.map(
      (categoria) => `<button type="button" class="categoria-filtro" data-id="${categoria.id}">${categoria.nome}</button>`
    ),
  ].join("");

  container.querySelectorAll(".categoria-filtro").forEach((botao) => {
    botao.addEventListener("click", () => {
      categoriaAtiva = botao.dataset.id;
      container.querySelectorAll(".categoria-filtro").forEach((b) => b.classList.remove("ativo"));
      botao.classList.add("ativo");
      aplicarFiltros();
    });
  });
}

function configurarBusca() {
  const form = document.querySelector(".busca-form");
  const campoBusca = document.getElementById("campo-busca-header");
  if (!form || !campoBusca) return;

  const termoInicial = new URLSearchParams(window.location.search).get("busca");
  if (termoInicial) campoBusca.value = termoInicial;

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    aplicarFiltros();
    document.getElementById("produtos").scrollIntoView({ behavior: "smooth" });
  });

  campoBusca.addEventListener("input", aplicarFiltros);
}

async function renderizarProdutos() {
  const grid = document.getElementById("grid-produtos");

  await renderizarCategoriasSidebar();

  try {
    produtosCarregados = await obterProdutosAtivos();
    aplicarFiltros();
  } catch (erro) {
    console.error(erro);
    grid.innerHTML = `<p class="grid-vazio">Não foi possível carregar os produtos agora. Tente recarregar a página.</p>`;
  }
}

// ==== Carrossel da home ====
// Troque estes caminhos pelas suas próprias imagens quando quiser
// (mesmas proporções ficam melhores: recomendado por volta de 1600x600).
const IMAGENS_CARROSSEL = [
  "img/banner/banner1.svg",
  "img/banner/banner2.svg",
  "img/banner/banner3.svg",
];

const INTERVALO_CARROSSEL = 4500;

function iniciarCarrossel() {
  const track = document.getElementById("carrossel-track");
  const dotsContainer = document.getElementById("carrossel-dots");
  const btnPrev = document.getElementById("carrossel-prev");
  const btnNext = document.getElementById("carrossel-next");
  if (!track) return;

  let atual = 0;
  let timer;

  track.innerHTML = IMAGENS_CARROSSEL.map(
    (src, i) => `<img src="${src}" alt="Full Arts — destaque ${i + 1}" />`
  ).join("");

  dotsContainer.innerHTML = IMAGENS_CARROSSEL.map(
    (_, i) => `<button class="carrossel-dot" data-index="${i}" aria-label="Ir para slide ${i + 1}"></button>`
  ).join("");

  const dots = dotsContainer.querySelectorAll(".carrossel-dot");

  function irPara(indice) {
    atual = (indice + IMAGENS_CARROSSEL.length) % IMAGENS_CARROSSEL.length;
    track.style.transform = `translateX(-${atual * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle("ativo", i === atual));
  }

  function reiniciarAutoplay() {
    clearInterval(timer);
    timer = setInterval(() => irPara(atual + 1), INTERVALO_CARROSSEL);
  }

  btnPrev.addEventListener("click", () => {
    irPara(atual - 1);
    reiniciarAutoplay();
  });

  btnNext.addEventListener("click", () => {
    irPara(atual + 1);
    reiniciarAutoplay();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      irPara(Number(dot.dataset.index));
      reiniciarAutoplay();
    });
  });

  irPara(0);
  reiniciarAutoplay();
}

(async function iniciar() {
  configurarBusca();
  await renderizarProdutos();
  configurarRodape();
  configurarMenuMobile();
  iniciarCarrossel();
})();
