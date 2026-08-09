// Camada de acesso aos produtos: lê e grava direto na tabela "produtos" do
// Supabase. Qualquer visitante consegue ler (select); só um admin logado
// consegue inserir, editar ou excluir (isso é garantido pelas políticas de
// segurança configuradas no banco, não só aqui no front-end).

async function obterProdutos() {
  const { data, error } = await supabaseClient
    .from("produtos")
    .select("*, categoria:categorias(id, nome)")
    .order("criado_em", { ascending: true });

  if (error) {
    console.error("Erro ao carregar produtos:", error);
    return [];
  }
  return data;
}

async function obterProdutosAtivos() {
  const produtos = await obterProdutos();
  return produtos.filter(produtoDisponivel);
}

async function obterProdutoPorId(id) {
  const { data, error } = await supabaseClient.from("produtos").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("Erro ao carregar produto:", error);
    return null;
  }
  return data;
}

async function criarProduto(dados) {
  const { data, error } = await supabaseClient.from("produtos").insert(dados).select().single();
  if (error) throw error;
  return data;
}

async function atualizarProduto(id, dados) {
  const { data, error } = await supabaseClient.from("produtos").update(dados).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

async function excluirProduto(id) {
  const { error } = await supabaseClient.from("produtos").delete().eq("id", id);
  if (error) throw error;
}

function produtoDisponivel(produto) {
  return !!produto && produto.ativo !== false;
}
