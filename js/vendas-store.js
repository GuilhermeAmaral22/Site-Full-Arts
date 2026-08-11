// Camada de acesso às vendas: lê e grava direto na tabela "vendas" do
// Supabase. Só um admin logado consegue ler ou gravar (dado privado do
// negócio) — garantido pelas políticas de segurança do banco.
const PRECO_POR_GRAMA = 100 / 1000; // R$ 100,00 a cada 1000g

async function obterVendas() {
  const { data, error } = await supabaseClient.from("vendas").select("*").order("data", { ascending: false });

  if (error) {
    console.error("Erro ao carregar vendas:", error);
    return [];
  }
  return data;
}

async function criarVenda(dados) {
  const { error } = await supabaseClient.from("vendas").insert(dados);
  if (error) throw error;
}

async function excluirVenda(id) {
  const { error } = await supabaseClient.from("vendas").delete().eq("id", id);
  if (error) throw error;
}

// valorRecebido já é o líquido (a Shopee repassa descontando a taxa dela),
// então aqui só descontamos o que é nosso: matéria-prima (peso de 1 unidade
// × quantidade) e outros custos do pedido (embalagem, etc).
function calcularVenda({ valorRecebido, pesoUnitarioGramas, quantidade, outrosCustos }) {
  const custoProducao = pesoUnitarioGramas * quantidade * PRECO_POR_GRAMA;
  const custoTotal = custoProducao + outrosCustos;
  const lucro = valorRecebido - custoTotal;

  return { custoProducao, custoTotal, lucro };
}
