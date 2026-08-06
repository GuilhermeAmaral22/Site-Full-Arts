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

// Envia uma foto (data URL) para o Storage do Supabase e devolve a URL pública.
async function enviarFoto(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const caminho = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await supabaseClient.storage.from("produtos").upload(caminho, blob, {
    contentType: "image/jpeg",
  });
  if (error) throw error;

  const { data } = supabaseClient.storage.from("produtos").getPublicUrl(caminho);
  return data.publicUrl;
}

// Fotos já salvas (URL do Storage) ficam como estão; só as novas (data URL,
// escolhidas agora no formulário) são enviadas para o Storage.
async function resolverImagens(lista) {
  const resultado = [];
  for (const item of lista) {
    resultado.push(item.startsWith("data:") ? await enviarFoto(item) : item);
  }
  return resultado;
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
  return (Number(numero) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---- Login ----

async function mostrarPainel() {
  document.getElementById("gate").hidden = true;
  document.getElementById("painel").hidden = false;
  document.getElementById("btn-logout").hidden = false;
  await renderizarLista();
  await renderizarSelectProdutosVenda();
  await renderizarVendas();
  definirDataVendaHoje();
}

function definirDataVendaHoje() {
  const hoje = new Date().toLocaleDateString("sv-SE"); // formato YYYY-MM-DD no fuso local
  document.getElementById("venda-data").value = hoje;
}

document.getElementById("form-login").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;
  const botao = evento.target.querySelector("button[type=submit]");

  botao.disabled = true;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
  botao.disabled = false;

  if (error) {
    document.getElementById("erro-login").hidden = false;
    return;
  }

  document.getElementById("erro-login").hidden = true;
  await mostrarPainel();
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

(async function verificarSessao() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  if (session) await mostrarPainel();
})();

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

document.getElementById("form-produto").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (fotosSelecionadas.length === 0) {
    alert("Adicione pelo menos uma foto do produto.");
    return;
  }

  const botao = document.getElementById("btn-salvar-produto");
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    const imagens = await resolverImagens(fotosSelecionadas);
    const dados = {
      nome: document.getElementById("campo-nome").value.trim(),
      descricao: document.getElementById("campo-descricao").value.trim(),
      preco: document.getElementById("campo-preco").value.trim(),
      imagens,
      ativo: document.getElementById("campo-ativo").checked,
    };

    if (produtoEditandoId) {
      await atualizarProduto(produtoEditandoId, dados);
    } else {
      await criarProduto(dados);
    }

    sairModoEdicao();
    await renderizarLista();
    await renderizarSelectProdutosVenda();
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível salvar o produto. Tente novamente.");
    botao.textContent = textoOriginal;
  } finally {
    botao.disabled = false;
  }
});

// ---- Lista / exclusão / status / edição ----

async function renderizarLista() {
  const container = document.getElementById("lista-produtos");
  const produtos = await obterProdutos();

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
      <img src="${produto.imagens[0] || ""}" alt="${produto.nome}" />
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
    botao.addEventListener("click", async () => {
      const produto = await obterProdutoPorId(botao.dataset.id);
      if (produto) entrarModoEdicao(produto);
    });
  });

  container.querySelectorAll(".admin-item__status").forEach((botao) => {
    botao.addEventListener("click", () => alternarStatusProduto(botao.dataset.id));
  });

  container.querySelectorAll(".admin-item__excluir").forEach((botao) => {
    botao.addEventListener("click", () => excluirProdutoClique(botao.dataset.id));
  });
}

async function alternarStatusProduto(id) {
  const produto = await obterProdutoPorId(id);
  if (!produto) return;

  try {
    await atualizarProduto(id, { ativo: produto.ativo === false });
    await renderizarLista();
    await renderizarSelectProdutosVenda();
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível atualizar o status do produto.");
  }
}

async function excluirProdutoClique(id) {
  if (!confirm("Tem certeza que deseja excluir este produto? Essa ação não pode ser desfeita.")) return;
  if (produtoEditandoId === id) sairModoEdicao();

  try {
    await excluirProduto(id);
    await renderizarLista();
    await renderizarSelectProdutosVenda();
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível excluir o produto.");
  }
}

// ---- Vendas: registrar ----

async function renderizarSelectProdutosVenda() {
  const select = document.getElementById("venda-produto");
  const produtos = await obterProdutos();
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
    await preencherValorSugerido();
  }
}

async function preencherValorSugerido() {
  const select = document.getElementById("venda-produto");
  const produto = await obterProdutoPorId(select.value);
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

document.getElementById("form-venda").addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const produtoId = document.getElementById("venda-produto").value;
  const produto = await obterProdutoPorId(produtoId);
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

  try {
    await criarVenda({
      produto_id: produto.id,
      produto_nome: produto.nome,
      data,
      valor_venda: valorVenda,
      peso_gramas: pesoGramas,
      outros_custos: outrosCustos,
      custo_producao: custoProducao,
      taxa_marketplace: taxaMarketplace,
      lucro,
    });

    evento.target.reset();
    document.getElementById("venda-resumo").hidden = true;
    definirDataVendaHoje();
    await renderizarVendas();
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível registrar a venda. Tente novamente.");
  }
});

// ---- Vendas: histórico / filtro / resumo ----

async function obterVendasFiltradas() {
  const inicio = document.getElementById("historico-inicio").value;
  const fim = document.getElementById("historico-fim").value;
  const vendas = await obterVendas();

  return vendas.filter((venda) => (!inicio || venda.data >= inicio) && (!fim || venda.data <= fim));
}

async function renderizarVendas() {
  const vendas = await obterVendasFiltradas();

  const pedidos = vendas.length;
  const faturamento = vendas.reduce((soma, venda) => soma + Number(venda.valor_venda), 0);
  const lucro = vendas.reduce((soma, venda) => soma + Number(venda.lucro), 0);
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
        <strong>${venda.produto_nome}</strong>
        <span>${dia}/${mes}/${ano} · Venda: ${formatarMoeda(venda.valor_venda)}</span>
        <span class="admin-status admin-status--${venda.lucro >= 0 ? "ativo" : "inativo"}">Lucro: ${formatarMoeda(venda.lucro)}</span>
      </div>
      <div class="admin-item__acoes">
        <button class="btn btn-ghost admin-item__excluir" type="button" data-id="${venda.id}">Excluir</button>
      </div>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll(".admin-item__excluir").forEach((botao) => {
    botao.addEventListener("click", () => excluirVendaClique(botao.dataset.id));
  });
}

async function excluirVendaClique(id) {
  if (!confirm("Excluir esta venda do histórico?")) return;
  try {
    await excluirVenda(id);
    await renderizarVendas();
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível excluir a venda.");
  }
}

document.getElementById("historico-inicio").addEventListener("change", renderizarVendas);
document.getElementById("historico-fim").addEventListener("change", renderizarVendas);
document.getElementById("btn-limpar-filtro").addEventListener("click", () => {
  document.getElementById("historico-inicio").value = "";
  document.getElementById("historico-fim").value = "";
  renderizarVendas();
});
