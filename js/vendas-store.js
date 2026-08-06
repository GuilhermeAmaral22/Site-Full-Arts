// Camada de acesso às vendas: lê e grava direto na tabela "vendas" do
// Supabase. Só um admin logado consegue ler ou gravar (dado privado do
// negócio) — garantido pelas políticas de segurança do banco.
const TAXA_FIXA_MARKETPLACE = 4;
const TAXA_PERCENTUAL_MARKETPLACE = 0.18;
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

function calcularVenda({ valorVenda, pesoGramas, outrosCustos }) {
  const custoProducao = pesoGramas * PRECO_POR_GRAMA;
  const taxaMarketplace = TAXA_FIXA_MARKETPLACE + valorVenda * TAXA_PERCENTUAL_MARKETPLACE;
  const custoTotal = custoProducao + taxaMarketplace + outrosCustos;
  const lucro = valorVenda - custoTotal;

  return { custoProducao, taxaMarketplace, custoTotal, lucro };
}
