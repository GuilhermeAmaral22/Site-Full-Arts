// Camada de acesso aos produtos: lê/escreve os rascunhos feitos no painel
// admin (guardados no localStorage deste navegador) e cai para o catálogo
// publicado (PRODUTOS_PADRAO) quando não há rascunho salvo.
const CHAVE_STORAGE = "fullarts_produtos";

// Rascunhos salvos antes da galeria de várias fotos tinham um campo
// "imagem" (texto único) em vez de "imagens" (lista). Normaliza aqui para
// que rascunhos antigos continuem funcionando sem quebrar a página.
// Também garante o campo "ativo" em produtos salvos antes dessa opção existir.
function normalizarProduto(produto) {
  const normalizado = Array.isArray(produto.imagens)
    ? produto
    : { ...produto, imagens: produto.imagem ? [produto.imagem] : [] };
  return { ...normalizado, ativo: normalizado.ativo !== false };
}

function produtoDisponivel(produto) {
  return !!produto && produto.ativo !== false;
}

function obterProdutos() {
  const bruto = localStorage.getItem(CHAVE_STORAGE);
  if (!bruto) return [...PRODUTOS_PADRAO];

  try {
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista.map(normalizarProduto) : [...PRODUTOS_PADRAO];
  } catch {
    return [...PRODUTOS_PADRAO];
  }
}

function salvarProdutos(lista) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(lista));
}

function gerarId() {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function temRascunhoLocal() {
  return localStorage.getItem(CHAVE_STORAGE) !== null;
}

function obterProdutoPorId(id) {
  return obterProdutos().find((produto) => produto.id === id);
}
