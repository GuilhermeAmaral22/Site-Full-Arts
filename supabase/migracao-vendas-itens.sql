-- Migração: permite vários produtos diferentes na mesma venda.
-- Cole este arquivo no SQL Editor do Supabase e clique em "Run".
alter table vendas add column itens jsonb not null default '[]';
