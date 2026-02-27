

## Sistema de Gestão de Loja — Fase 1: Estrutura + Dashboard + Estoque

### Visão Geral
Construir a fundação do sistema: layout completo com sidebar, dashboard com KPIs e gráficos, e o módulo de estoque (Produtos, Categorias, Fornecedores, Movimentações). Tudo em português brasileiro, com tema claro/escuro, design profissional inspirado em SaaS modernos.

---

### 1. Layout e Navegação
- **Sidebar colapsável** com todas as seções do menu (Dashboard, Vendas, Estoque, Relatórios, Configurações) com ícones e submenus expansíveis
- **Header** com breadcrumb, toggle de tema claro/escuro e busca global (Ctrl+K)
- **Roteamento** de todas as páginas (mesmo as que virão nas próximas fases aparecerão como "Em breve")
- Design responsivo para tablet (1024px+)

### 2. Dashboard Principal
- **4 KPI Cards** no topo: Faturamento Hoje, Faturamento do Mês, Nº de Vendas Hoje, Ticket Médio — com variação percentual e skeleton loading
- **Gráfico de Faturamento 30 dias** — LineChart com área preenchida e linha comparativa do mês anterior (tracejado)
- **Faturamento por Forma de Pagamento** — DonutChart (Dinheiro, Débito, Crédito, Pix, Outros)
- **Top 10 Produtos Mais Vendidos** — BarChart horizontal com seletor de período (hoje/semana/mês)
- **Evolução do Estoque** — AreaChart com valor total em estoque nos últimos 30 dias
- **Vendas por Hora** — BarChart vertical (00–23h)
- **Painel Estoque Crítico** — lista de produtos abaixo do mínimo com ação rápida
- **Painel PDV Online** — status dos terminais registrados

> Nesta fase, os dados serão mockados no frontend. Na Fase 2, conectaremos ao banco de dados real.

### 3. Banco de Dados (Lovable Cloud / Supabase)
- Criação das tabelas: **categories**, **suppliers**, **products**, **stock_movements**, **pdv_terminals**
- Índices para performance (barcode, updated_at, etc.)
- RLS policies básicas para segurança
- Bucket de storage para fotos de produtos

### 4. Módulo de Estoque — Produtos
- **Tabela de produtos** com busca, filtros (categoria, fornecedor, status, estoque crítico), paginação e ordenação
- Colunas: Foto, Código, Barcode, Nome, Categoria, Preço Custo, Preço Venda, Margem %, Estoque Atual, Estoque Mínimo, Status, Ações
- **Formulário de criar/editar produto** com todos os campos especificados: dados básicos, preços com margem calculada automaticamente, estoque, upload de foto, preço promocional com vigência, tags
- Skeleton loading e toasts de feedback

### 5. Módulo de Estoque — Categorias
- CRUD completo com suporte a hierarquia (categoria pai / subcategoria)
- Dropdown com criação inline no formulário de produto

### 6. Módulo de Estoque — Fornecedores
- CRUD completo: razão social, CNPJ, contato, telefone, e-mail, prazo médio de entrega, observações

### 7. Módulo de Estoque — Movimentações
- **Tabela de movimentações** com filtros por tipo e período
- Tipos: Entrada, Saída, Ajuste positivo, Ajuste negativo, Devolução, Transferência
- Colunas: Data, Tipo, Produto, Quantidade, Saldo anterior/posterior, Responsável, Origem, Observação
- **Formulário de ajuste manual** de estoque

---

### Fases Futuras (não incluídas agora)
- **Fase 2**: Módulo de Vendas (Histórico, Devoluções) + Inventário
- **Fase 3**: Relatórios completos com exportação PDF/CSV
- **Fase 4**: Configurações (Geral, Usuários/Permissões, PDV) + Autenticação
- **Fase 5**: API REST para integração com PDV desktop (Edge Functions)

