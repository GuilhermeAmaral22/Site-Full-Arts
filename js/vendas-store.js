// Camada de acesso às vendas registradas no painel admin (guardadas no
// localStorage deste navegador). Cada venda guarda os valores já calculados
// no momento do cadastro, para que o histórico não mude se as regras de
// taxa/custo forem alteradas depois.
const CHAVE_STORAGE_VENDAS = "fullarts_vendas";

const TAXA_FIXA_MARKETPLACE = 4;
const TAXA_PERCENTUAL_MARKETPLACE = 0.18;
const PRECO_POR_GRAMA = 100 / 1000; // R$ 100,00 a cada 1000g

function obterVendas() {
  const bruto = localStorage.getItem(CHAVE_STORAGE_VENDAS);
  if (!bruto) return [];

  try {
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function salvarVendas(lista) {
  localStorage.setItem(CHAVE_STORAGE_VENDAS, JSON.stringify(lista));
}

function gerarIdVenda() {
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function calcularVenda({ valorVenda, pesoGramas, outrosCustos }) {
  const custoProducao = pesoGramas * PRECO_POR_GRAMA;
  const taxaMarketplace = TAXA_FIXA_MARKETPLACE + valorVenda * TAXA_PERCENTUAL_MARKETPLACE;
  const custoTotal = custoProducao + taxaMarketplace + outrosCustos;
  const lucro = valorVenda - custoTotal;

  return { custoProducao, taxaMarketplace, custoTotal, lucro };
}
