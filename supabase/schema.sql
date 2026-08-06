-- Full Arts — schema do Supabase
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase e clique em "Run".

-- ==== Produtos ====

create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  preco text not null,
  imagens text[] not null default '{}',
  ativo boolean not null default true,
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
  valor_venda numeric not null default 0,
  peso_gramas numeric not null default 0,
  outros_custos numeric not null default 0,
  custo_producao numeric not null default 0,
  taxa_marketplace numeric not null default 0,
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
