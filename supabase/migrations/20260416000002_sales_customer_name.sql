alter table public.sales
  add column if not exists customer_name text;

update public.sales s
set customer_name = c.name
from public.customers c
where s.customer_id = c.id
  and s.customer_name is null;

create index if not exists idx_sales_customer_name on public.sales (customer_name);
