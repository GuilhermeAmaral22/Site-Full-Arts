// Camada de acesso às categorias: lê e grava direto na tabela "categorias"
// do Supabase. Qualquer visitante consegue ler; só um admin logado
// consegue criar ou excluir.

async function obterCategorias() {
  const { data, error } = await supabaseClient.from("categorias").select("*").order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar categorias:", error);
    return [];
  }
  return data;
}

async function criarCategoria(nome) {
  const { data, error } = await supabaseClient.from("categorias").insert({ nome }).select().single();
  if (error) throw error;
  return data;
}

async function excluirCategoria(id) {
  const { error } = await supabaseClient.from("categorias").delete().eq("id", id);
  if (error) throw error;
}
