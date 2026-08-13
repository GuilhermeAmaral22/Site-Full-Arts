-- Full Arts — schema do Supabase
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase e clique em "Run".
-- (Se seu banco já existe, use supabase/migracao-categorias.sql em vez deste.)

-- ==== Categorias ====

create table categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  criado_em timestamptz not null default now()
);

alter table categorias enable row level security;

create policy "Qualquer pessoa pode ver categorias"
  on categorias for select
  using (true);

create policy "Só admin logado pode inserir categorias"
  on categorias for insert
  to authenticated
  with check (true);

create policy "Só admin logado pode excluir categorias"
  on categorias for delete
  to authenticated
  using (true);

-- ==== Produtos ====

create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  preco text not null,
  imagens text[] not null default '{}',
  ativo boolean not null default true,
  categoria_id uuid references categorias(id) on delete set null,
  peso_gramas numeric not null default 0,
  criado_em timestamptz not null default now()
);

alter table produtos enable row level security;

create policy "Qualquer pessoa pode ver produtos"
  on produtos for select
  using (true);

create policy "Só admin logado pode inserir produtos"
  on produtos for insert
  to authenticated
  with check (true);

create policy "Só admin logado pode editar produtos"
  on produtos for update
  to authenticated
  using (true);

create policy "Só admin logado pode excluir produtos"
  on produtos for delete
  to authenticated
  using (true);

-- ==== Vendas (dado privado, só o admin logado acessa) ====

create table vendas (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid references produtos(id) on delete set null,
  produto_nome text not null,
  data date not null,
  quantidade integer not null default 1, -- total de unidades do pedido
  canal text not null default 'shopee', -- 'shopee' ou 'direta'
  itens jsonb not null default '[]', -- [{produto_id, nome, peso_gramas, quantidade}] copiados no momento da venda
  valor_venda numeric not null default 0, -- valor líquido recebido (já sem a taxa do marketplace)
  peso_gramas numeric not null default 0, -- peso total do pedido em gramas
  outros_custos numeric not null default 0,
  custo_producao numeric not null default 0,
  lucro numeric not null default 0,
  criado_em timestamptz not null default now()
);

alter table vendas enable row level security;

create policy "Só admin logado acessa vendas"
  on vendas for all
  to authenticated
  using (true)
  with check (true);

-- ==== Fotos dos produtos (bucket de armazenamento) ====

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true);

create policy "Qualquer pessoa pode ver as fotos"
  on storage.objects for select
  using (bucket_id = 'produtos');

create policy "Só admin logado pode enviar fotos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'produtos');

create policy "Só admin logado pode excluir fotos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'produtos');
