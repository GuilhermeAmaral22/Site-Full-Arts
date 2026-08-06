const idProduto = new URLSearchParams(window.location.search).get("id");
const produtoEncontrado = idProduto ? obterProdutoPorId(idProduto) : null;
const produtoAtual = produtoDisponivel(produtoEncontrado) ? produtoEncontrado : null;

function linkWhatsappPedido(nomeProduto) {
  const mensagem = `Olá! Quero fazer o pedido de: ${nomeProduto}`;
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
}

function renderizarGaleria(imagens, nome) {
  const principal = document.getElementById("galeria-principal");
  const miniaturas = document.getElementById("galeria-miniaturas");

  function mostrar(indice) {
    principal.src = imagens[indice];
    principal.alt = nome;
    miniaturas.querySelectorAll("button").forEach((botao, i) => {
      botao.classList.toggle("ativo", i === indice);
    });
  }

  if (imagens.length <= 1) {
    miniaturas.hidden = true;
  } else {
    miniaturas.innerHTML = imagens
      .map(
        (src, i) => `
          <button type="button" data-index="${i}">
            <img src="${src}" alt="${nome} — foto ${i + 1}" />
          </button>
        `
      )
      .join("");

    miniaturas.querySelectorAll("button").forEach((botao) => {
      botao.addEventListener("click", () => mostrar(Number(botao.dataset.index)));
    });
  }

  mostrar(0);
}

function renderizarProduto() {
  const container = document.getElementById("produto-conteudo");

  if (!produtoAtual) {
    container.innerHTML = `
      <p class="produto-vazio">
        Produto não encontrado. <a href="index.html#produtos">Voltar para o catálogo</a>.
      </p>
    `;
    return;
  }

  document.getElementById("titulo-pagina").textContent = `${produtoAtual.nome} — Full Arts`;

  container.innerHTML = `
    <div class="produto-galeria">
      <img id="galeria-principal" class="produto-galeria__principal" alt="${produtoAtual.nome}" />
      <div id="galeria-miniaturas" class="produto-galeria__miniaturas"></div>
    </div>
    <div class="produto-info">
      <h1>${produtoAtual.nome}</h1>
      <p class="produto-preco">${produtoAtual.preco}</p>
      <p class="produto-descricao">${produtoAtual.descricao}</p>
      <a class="btn btn-primary produto-cta" href="${linkWhatsappPedido(produtoAtual.nome)}" target="_blank" rel="noopener">
        Faça seu pedido
      </a>
    </div>
  `;

  renderizarGaleria(produtoAtual.imagens, produtoAtual.nome);
}

renderizarProduto();
configurarRodape();
configurarMenuMobile();
