-- Migração: quantidade e canal nas vendas, peso do produto.
-- Cole este arquivo no SQL Editor do Supabase e clique em "Run".

alter table vendas add column quantidade integer not null default 1;
alter table vendas add column canal text not null default 'shopee';
alter table produtos add column peso_gramas numeric not null default 0;
