// Troque esta senha antes de publicar o site. Isso é apenas uma trava
// simples para evitar cliques acidentais — não é uma senha de verdade
// protegendo um servidor, então não reutilize uma senha importante aqui.
const ADMIN_SENHA = "fullarts123";
const SESSAO_LOGIN = "fullarts_admin_logado";

const TAMANHO_MAX_IMAGEM = 900;
const QUALIDADE_IMAGEM = 0.8;

function redimensionarImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = reject;
    leitor.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, TAMANHO_MAX_IMAGEM / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * escala;
        canvas.height = img.height * escala;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", QUALIDADE_IMAGEM));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

// ---- Números e moeda ----

function paraNumero(valor) {
  if (typeof valor === "number") return isNaN(valor) ? 0 : valor;
  let texto = String(valor || "").trim().replace(/[^\d,.-]/g, "");
  if (texto.includes(",")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }
  const numero = parseFloat(texto);
  return isNaN(numero) ? 0 : numero;
}

function formatarMoeda(numero) {
  return (numero || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---- Login ----

function mostrarPainel() {
  document.getElementById("gate").hidden = true;
  document.getElementById("painel").hidden = false;
  renderizarLista();
  renderizarSelectProdutosVenda();
  renderizarVendas();
  definirDataVendaHoje();
}

function definirDataVendaHoje() {
  const hoje = new Date().toLocaleDateString("sv-SE"); // formato YYYY-MM-DD no fuso local
  document.getElementById("venda-data").value = hoje;
}

document.getElementById("form-login").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const senha = document.getElementById("senha").value;

  if (senha === ADMIN_SENHA) {
    sessionStorage.setItem(SESSAO_LOGIN, "true");
    document.getElementById("erro-login").hidden = true;
    mostrarPainel();
  } else {
    document.getElementById("erro-login").hidden = false;
  }
});

if (sessionStorage.getItem(SESSAO_LOGIN) === "true") {
  mostrarPainel();
}

// ---- Abas (Produtos / Vendas) ----

document.querySelectorAll(".admin-tab").forEach((botao) => {
  botao.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");

    const aba = botao.dataset.tab;
    document.getElementById("tab-produtos").hidden = aba !== "produtos";
    document.getElementById("tab-vendas").hidden = aba !== "vendas";
  });
});

// ---- Fotos selecionadas (permite escolher várias vezes e remover antes de salvar) ----

const campoFoto = document.getElementById("campo-foto");
let fotosSelecionadas = [];

function renderizarPreviewFotos() {
  const container = document.getElementById("preview-fotos");

  if (fotosSelecionadas.length === 0) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  container.hidden = false;
  container.innerHTML = fotosSelecionadas
    .map(
      (src, i) => `
        <div class="admin-preview-item">
          <img src="${src}" alt="Foto ${i + 1}" />
          <button type="button" class="admin-preview-item__remover" data-index="${i}" aria-label="Remover foto">×</button>
        </div>
      `
    )
    .join("");

  container.querySelectorAll(".admin-preview-item__remover").forEach((botao) => {
    botao.addEventListener("click", () => {
      fotosSelecionadas.splice(Number(botao.dataset.index), 1);
      renderizarPreviewFotos();
    });
  });
}

campoFoto.addEventListener("change", async () => {
  for (const arquivo of Array.from(campoFoto.files)) {
    fotosSelecionadas.push(await redimensionarImagem(arquivo));
  }
  campoFoto.value = "";
  renderizarPreviewFotos();
});

// ---- Adicionar / editar produto ----

let produtoEditandoId = null;

function entrarModoEdicao(produto) {
  produtoEditandoId = produto.id;
  document.getElementById("campo-nome").value = produto.nome;
  document.getElementById("campo-descricao").value = produto.descricao;
  document.getElementById("campo-preco").value = produto.preco;
  document.getElementById("campo-ativo").checked = produto.ativo !== false;
  fotosSelecionadas = [...produto.imagens];
  renderizarPreviewFotos();

  document.getElementById("titulo-form-produto").textContent = "Editar produto";
  document.getElementById("btn-salvar-produto").textContent = "Salvar edição";
  document.getElementById("btn-cancelar-edicao").hidden = false;

  document.getElementById("form-produto").scrollIntoView({ behavior: "smooth", block: "start" });
}

function sairModoEdicao() {
  produtoEditandoId = null;
  document.getElementById("form-produto").reset();
  document.getElementById("campo-ativo").checked = true;
  fotosSelecionadas = [];
  renderizarPreviewFotos();

  document.getElementById("titulo-form-produto").textContent = "Adicionar produto";
  document.getElementById("btn-salvar-produto").textContent = "Adicionar produto";
  document.getElementById("btn-cancelar-edicao").hidden = true;
}

document.getElementById("btn-cancelar-edicao").addEventListener("click", sairModoEdicao);

document.getElementById("form-produto").addEventListener("submit", (evento) => {
  evento.preventDefault();

  if (fotosSelecionadas.length === 0) {
    alert("Adicione pelo menos uma foto do produto.");
    return;
  }

  const dadosFormulario = {
    nome: document.getElementById("campo-nome").value.trim(),
    descricao: document.getElementById("campo-descricao").value.trim(),
    preco: document.getElementById("campo-preco").value.trim(),
    imagens: [...fotosSelecionadas],
    ativo: document.getElementById("campo-ativo").checked,
  };

  const produtos = obterProdutos();

  if (produtoEditandoId) {
    const indice = produtos.findIndex((produto) => produto.id === produtoEditandoId);
    if (indice !== -1) {
      produtos[indice] = { ...produtos[indice], ...dadosFormulario };
    }
  } else {
    produtos.push({ id: gerarId(), ...dadosFormulario });
  }

  salvarProdutos(produtos);
  sairModoEdicao();
  renderizarLista();
  renderizarSelectProdutosVenda();
});

// ---- Lista / exclusão / status / edição ----

function renderizarLista() {
  const container = document.getElementById("lista-produtos");
  const produtos = obterProdutos();

  if (produtos.length === 0) {
    container.innerHTML = `<p class="admin-lista-vazia">Nenhum produto cadastrado.</p>`;
    return;
  }

  container.innerHTML = "";
  produtos.forEach((produto) => {
    const ativo = produto.ativo !== false;
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <img src="${produto.imagens[0]}" alt="${produto.nome}" />
      <div class="admin-item__info">
        <strong>${produto.nome}</strong>
        <span>${produto.preco}</span>
        <span class="admin-status admin-status--${ativo ? "ativo" : "inativo"}">${ativo ? "Ativo" : "Inativo"}</span>
      </div>
      <div class="admin-item__acoes">
        <button class="btn btn-ghost admin-item__editar" type="button" data-id="${produto.id}">Editar</button>
        <button class="btn btn-ghost admin-item__status" type="button" data-id="${produto.id}">${ativo ? "Desativar" : "Ativar"}</button>
        <button class="btn btn-ghost admin-item__excluir" type="button" data-id="${produto.id}">Excluir</button>
      </div>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll(".admin-item__editar").forEach((botao) => {
    botao.addEventListener("click", () => {
      const produto = obterProdutoPorId(botao.dataset.id);
      if (produto) entrarModoEdicao(produto);
    });
  });

  container.querySelectorAll(".admin-item__status").forEach((botao) => {
    botao.addEventListener("click", () => alternarStatusProduto(botao.dataset.id));
  });

  container.querySelectorAll(".admin-item__excluir").forEach((botao) => {
    botao.addEventListener("click", () => excluirProduto(botao.dataset.id));
  });
}

function alternarStatusProduto(id) {
  const produtos = obterProdutos();
  const produto = produtos.find((produto) => produto.id === id);
  if (!produto) return;

  produto.ativo = produto.ativo === false;
  salvarProdutos(produtos);
  renderizarLista();
  renderizarSelectProdutosVenda();
}

function excluirProduto(id) {
  if (produtoEditandoId === id) sairModoEdicao();
  const produtos = obterProdutos().filter((produto) => produto.id !== id);
  salvarProdutos(produtos);
  renderizarLista();
  renderizarSelectProdutosVenda();
}

// ---- Exportar / restaurar ----

function gerarCodigoExportacao(produtos) {
  const itens = produtos
    .map((produto) => {
      const imagens = produto.imagens.map((src) => `      "${src}"`).join(",\n");
      return `  {
    id: "${produto.id}",
    nome: "${produto.nome.replace(/"/g, '\\"')}",
    descricao: "${produto.descricao.replace(/"/g, '\\"')}",
    preco: "${produto.preco.replace(/"/g, '\\"')}",
    imagens: [
${imagens}
    ],
    ativo: ${produto.ativo !== false},
  }`;
    })
    .join(",\n");

  return `const PRODUTOS_PADRAO = [\n${itens}\n];\n`;
}

document.getElementById("btn-exportar").addEventListener("click", () => {
  const codigo = gerarCodigoExportacao(obterProdutos());
  document.getElementById("texto-exportar").value = codigo;
  document.getElementById("caixa-exportar").hidden = false;
});

document.getElementById("btn-copiar").addEventListener("click", async () => {
  const texto = document.getElementById("texto-exportar");
  await navigator.clipboard.writeText(texto.value);
  const botao = document.getElementById("btn-copiar");
  const original = botao.textContent;
  botao.textContent = "Copiado!";
  setTimeout(() => (botao.textContent = original), 1500);
});

document.getElementById("btn-restaurar").addEventListener("click", () => {
  if (!confirm("Isso apaga o rascunho local e volta para o catálogo publicado. Continuar?")) return;
  localStorage.removeItem(CHAVE_STORAGE);
  sairModoEdicao();
  renderizarLista();
  renderizarSelectProdutosVenda();
});

// ---- Vendas: registrar ----

function renderizarSelectProdutosVenda() {
  const select = document.getElementById("venda-produto");
  const produtos = obterProdutos();
  const selecionadoAnterior = select.value;

  if (produtos.length === 0) {
    select.innerHTML = `<option value="">Nenhum produto cadastrado</option>`;
    return;
  }

  select.innerHTML = produtos
    .map(
      (produto) =>
        `<option value="${produto.id}">${produto.nome}${produto.ativo === false ? " (inativo)" : ""}</option>`
    )
    .join("");

  if (produtos.some((produto) => produto.id === selecionadoAnterior)) {
    select.value = selecionadoAnterior;
  } else {
    preencherValorSugerido();
  }
}

function preencherValorSugerido() {
  const select = document.getElementById("venda-produto");
  const produto = obterProdutoPorId(select.value);
  if (produto) {
    document.getElementById("venda-valor").value = produto.preco;
  }
  atualizarResumoVenda();
}

document.getElementById("venda-produto").addEventListener("change", preencherValorSugerido);

function atualizarResumoVenda() {
  const resumo = document.getElementById("venda-resumo");
  const valorVenda = paraNumero(document.getElementById("venda-valor").value);
  const pesoGramas = paraNumero(document.getElementById("venda-peso").value);
  const outrosCustos = paraNumero(document.getElementById("venda-outros-custos").value);

  if (!valorVenda && !pesoGramas) {
    resumo.hidden = true;
    resumo.innerHTML = "";
    return;
  }

  const { custoProducao, taxaMarketplace, lucro } = calcularVenda({ valorVenda, pesoGramas, outrosCustos });

  resumo.hidden = false;
  resumo.innerHTML = `
    <div><span>Taxa da plataforma</span><strong>${formatarMoeda(taxaMarketplace)}</strong></div>
    <div><span>Custo de produção</span><strong>${formatarMoeda(custoProducao)}</strong></div>
    <div><span>Outros custos</span><strong>${formatarMoeda(outrosCustos)}</strong></div>
    <div class="admin-venda-resumo__lucro"><span>Lucro estimado</span><strong>${formatarMoeda(lucro)}</strong></div>
  `;
}

["venda-valor", "venda-peso", "venda-outros-custos"].forEach((id) => {
  document.getElementById(id).addEventListener("input", atualizarResumoVenda);
});

document.getElementById("form-venda").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const produtoId = document.getElementById("venda-produto").value;
  const produto = obterProdutoPorId(produtoId);
  if (!produto) {
    alert("Selecione um produto válido.");
    return;
  }

  const valorVenda = paraNumero(document.getElementById("venda-valor").value);
  const pesoGramas = paraNumero(document.getElementById("venda-peso").value);
  const outrosCustos = paraNumero(document.getElementById("venda-outros-custos").value);
  const data = document.getElementById("venda-data").value;

  if (!data) {
    alert("Informe a data da venda.");
    return;
  }

  const { custoProducao, taxaMarketplace, lucro } = calcularVenda({ valorVenda, pesoGramas, outrosCustos });

  const venda = {
    id: gerarIdVenda(),
    produtoId: produto.id,
    produtoNome: produto.nome,
    data,
    valorVenda,
    pesoGramas,
    outrosCustos,
    custoProducao,
    taxaMarketplace,
    lucro,
  };

  const vendas = obterVendas();
  vendas.push(venda);
  salvarVendas(vendas);

  evento.target.reset();
  document.getElementById("venda-resumo").hidden = true;
  definirDataVendaHoje();
  renderizarVendas();
});

// ---- Vendas: histórico / filtro / resumo ----

function obterVendasFiltradas() {
  const inicio = document.getElementById("historico-inicio").value;
  const fim = document.getElementById("historico-fim").value;

  return obterVendas()
    .filter((venda) => (!inicio || venda.data >= inicio) && (!fim || venda.data <= fim))
    .sort((a, b) => (a.data < b.data ? 1 : -1));
}

function renderizarVendas() {
  const vendas = obterVendasFiltradas();

  const pedidos = vendas.length;
  const faturamento = vendas.reduce((soma, venda) => soma + venda.valorVenda, 0);
  const lucro = vendas.reduce((soma, venda) => soma + venda.lucro, 0);
  const custos = faturamento - lucro;

  document.getElementById("resumo-pedidos").textContent = pedidos;
  document.getElementById("resumo-faturamento").textContent = formatarMoeda(faturamento);
  document.getElementById("resumo-custos").textContent = formatarMoeda(custos);
  document.getElementById("resumo-lucro").textContent = formatarMoeda(lucro);

  const container = document.getElementById("lista-vendas");

  if (vendas.length === 0) {
    container.innerHTML = `<p class="admin-lista-vazia">Nenhuma venda registrada neste período.</p>`;
    return;
  }

  container.innerHTML = "";
  vendas.forEach((venda) => {
    const [ano, mes, dia] = venda.data.split("-");
    const item = document.createElement("div");
    item.className = "admin-item admin-item--venda";
    item.innerHTML = `
      <div class="admin-item__info">
        <strong>${venda.produtoNome}</strong>
        <span>${dia}/${mes}/${ano} · Venda: ${formatarMoeda(venda.valorVenda)}</span>
        <span class="admin-status admin-status--${venda.lucro >= 0 ? "ativo" : "inativo"}">Lucro: ${formatarMoeda(venda.lucro)}</span>
      </div>
      <div class="admin-item__acoes">
        <button class="btn btn-ghost admin-item__excluir" type="button" data-id="${venda.id}">Excluir</button>
      </div>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll(".admin-item__excluir").forEach((botao) => {
    botao.addEventListener("click", () => excluirVenda(botao.dataset.id));
  });
}

function excluirVenda(id) {
  const vendas = obterVendas().filter((venda) => venda.id !== id);
  salvarVendas(vendas);
  renderizarVendas();
}

document.getElementById("historico-inicio").addEventListener("change", renderizarVendas);
document.getElementById("historico-fim").addEventListener("change", renderizarVendas);
document.getElementById("btn-limpar-filtro").addEventListener("click", () => {
  document.getElementById("historico-inicio").value = "";
  document.getElementById("historico-fim").value = "";
  renderizarVendas();
});
