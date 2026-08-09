-- Migração: adiciona categorias de produtos.
-- Cole este arquivo no SQL Editor do Supabase e clique em "Run".
-- (Seu banco já tem as tabelas produtos/vendas do schema.sql original —
-- este script só acrescenta o que falta, não recria nada.)

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

alter table produtos
  add column categoria_id uuid references categorias(id) on delete set null;
