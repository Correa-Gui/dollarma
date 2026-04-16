import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

type MethodBadgeProps = { method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" };
const MethodBadge = ({ method }: MethodBadgeProps) => {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    PATCH: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colors[method]}`}>{method}</span>;
};

const CodeBlock = ({ code, lang = "json" }: { code: string; lang?: string }) => (
  <div className="relative group">
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={() => { navigator.clipboard.writeText(code); toast.success("Copiado!"); }}
    >
      <Copy className="h-3.5 w-3.5" />
    </Button>
    <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

type EndpointProps = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  title: string;
  description: string;
  headers: { name: string; required: boolean; description: string }[];
  requestBody?: string;
  responses: { status: number; label: string; body: string }[];
  curlExample: string;
};

const EndpointCard = ({ method, path, title, description, headers, requestBody, responses, curlExample }: EndpointProps) => {
  const [open, setOpen] = useState(true);
  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center gap-3"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MethodBadge method={method} />
          <code className="text-sm font-semibold truncate">{path}</code>
          <span className="text-sm text-muted-foreground hidden sm:inline">— {title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
      </CardHeader>
      {open && (
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div>
            <h4 className="text-sm font-semibold mb-2">Headers</h4>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/50"><th className="text-left p-2 font-medium">Nome</th><th className="text-left p-2 font-medium">Obrigatório</th><th className="text-left p-2 font-medium">Descrição</th></tr></thead>
                <tbody>
                  {headers.map((h) => (
                    <tr key={h.name} className="border-t">
                      <td className="p-2 font-mono text-xs">{h.name}</td>
                      <td className="p-2">{h.required ? <Badge variant="destructive" className="text-[10px]">Sim</Badge> : <Badge variant="secondary" className="text-[10px]">Não</Badge>}</td>
                      <td className="p-2 text-muted-foreground">{h.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {requestBody && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Request Body</h4>
              <CodeBlock code={requestBody} />
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold mb-2">Respostas</h4>
            <Tabs defaultValue={String(responses[0].status)}>
              <TabsList>
                {responses.map((r) => (
                  <TabsTrigger key={r.status} value={String(r.status)} className="text-xs">
                    <span className={r.status < 300 ? "text-emerald-600" : "text-red-500"}>{r.status}</span>
                    <span className="ml-1.5">{r.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {responses.map((r) => (
                <TabsContent key={r.status} value={String(r.status)}>
                  <CodeBlock code={r.body} />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Exemplo cURL</h4>
            <CodeBlock code={curlExample} lang="bash" />
          </div>
        </CardContent>
      )}
    </Card>
  );
};

const endpoints: EndpointProps[] = [
  {
    method: "POST",
    path: "/pdv-auth",
    title: "Autenticação do Operador",
    description: "Autentica um operador pelo nome de usuário (display_name) e senha no terminal PDV. Requer token de terminal válido. Retorna dados do usuário, role e informações do terminal.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV cadastrado no sistema" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      username: "João Silva",
      password: "senha123",
    }, null, 2),
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({
          success: true,
          user: {
            id: "a1b2c3d4-...",
            email: "operador@loja.com",
            display_name: "João Silva",
            role: "cashier",
          },
          terminal: {
            id: "e5f6g7h8-...",
            name: "PDV 01 - Caixa Principal",
          },
        }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "username and password are required" }, null, 2),
      },
      {
        status: 401,
        label: "Credenciais inválidas",
        body: JSON.stringify({ success: false, error: "Invalid credentials" }, null, 2),
      },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-auth \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "username": "João Silva",
    "password": "senha123"
  }'`,
  },
  {
    method: "GET",
    path: "/pdv-catalog",
    title: "Catálogo de Produtos",
    description: "Retorna os produtos ativos com preços, promoções e estoque. Aceita o parâmetro opcional 'search' para busca por termos, com correspondência flexível entre as palavras. O terminal é atualizado como 'online' e a data de última sincronização é registrada.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV cadastrado no sistema" },
    ],
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({
          terminal: "PDV 01 - Caixa Principal",
          catalog: [
            {
              id: "a1b2c3d4-...",
              sku: "SKU001",
              barcode: "7891234567890",
              name: "Coca-Cola 350ml",
              price: 5.50,
              promoPrice: 4.99,
              promoStart: "2026-02-01",
              promoEnd: "2026-02-28",
              stock: 120,
              unit: "un",
              imageUrl: null,
              category: "Bebidas",
            },
          ],
        }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X GET \\
  ${BASE_URL}/pdv-catalog \\
  -H "x-pdv-token: tk_live_abc123def456"`,
  },
  {
    method: "GET",
    path: "/pdv-reference-data",
    title: "Dados de Referência",
    description: "Retorna as listas de categorias e fornecedores usadas pelos formulários do PDV. O endpoint é usado para preencher selects de cadastro e edição de produto.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
    ],
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({
          categories: [
            { id: "cat-1", name: "Bebidas", parent_id: null },
          ],
          suppliers: [
            {
              id: "sup-1",
              name: "Distribuidora XYZ",
              cnpj: "12.345.678/0001-99",
              contact: "Ana",
              phone: "(11) 99999-9999",
              email: "contato@xyz.com",
              avg_delivery_days: 3,
              notes: null,
            },
          ],
        }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X GET \\
  ${BASE_URL}/pdv-reference-data \\
  -H "x-pdv-token: tk_live_abc123def456"`,
  },
  {
    method: "POST",
    path: "/pdv-categories",
    title: "Criar Categoria",
    description: "Cria uma nova categoria para uso no cadastro de produtos. O nome é obrigatório. O parent_id é opcional.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      name: "Bebidas",
      parent_id: null,
    }, null, 2),
    responses: [
      {
        status: 201,
        label: "Criado",
        body: JSON.stringify({
          category: {
            id: "cat-1",
            name: "Bebidas",
            parent_id: null,
            created_at: "2026-04-14T10:00:00Z",
          },
        }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "name is required" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-categories \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Bebidas"}'`,
  },
  {
    method: "POST",
    path: "/pdv-suppliers",
    title: "Criar Fornecedor",
    description: "Cria um fornecedor para uso no cadastro de produtos. O nome é obrigatório; os demais campos são opcionais.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      name: "Distribuidora XYZ",
      cnpj: "12.345.678/0001-99",
      contact: "Ana",
      phone: "(11) 99999-9999",
      email: "contato@xyz.com",
      avg_delivery_days: 3,
      notes: "Entrega semanal",
    }, null, 2),
    responses: [
      {
        status: 201,
        label: "Criado",
        body: JSON.stringify({
          supplier: {
            id: "sup-1",
            name: "Distribuidora XYZ",
            cnpj: "12.345.678/0001-99",
            contact: "Ana",
            phone: "(11) 99999-9999",
            email: "contato@xyz.com",
            avg_delivery_days: 3,
            notes: "Entrega semanal",
            created_at: "2026-04-14T10:00:00Z",
          },
        }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "name is required" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-suppliers \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Distribuidora XYZ"}'`,
  },
  {
    method: "POST",
    path: "/pdv-products",
    title: "Cadastrar Produto",
    description: "Cadastra um novo produto direto pelo PDV ou pelo painel. O nome e o SKU são obrigatórios. O SKU pode ser gerado pelo cliente, e o cadastro suporta categoria, fornecedor, NCM e CFOP.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      name: "Coca-Cola 350ml",
      sku: "SKU001",
      barcode: "7891234567890",
      category_id: "cat-1",
      supplier_id: "sup-1",
      ncm: "22021000",
      cfop: "5102",
      sale_price: 5.5,
      cost_price: 3.2,
      stock_quantity: 120,
      min_stock: 12,
      unit: "un",
      is_active: true,
    }, null, 2),
    responses: [
      {
        status: 201,
        label: "Criado",
        body: JSON.stringify({
          product: {
            id: "a1b2c3d4-...",
            name: "Coca-Cola 350ml",
            sku: "SKU001",
            barcode: "7891234567890",
            category_id: "cat-1",
            supplier_id: "sup-1",
            ncm: "22021000",
            cfop: "5102",
            sale_price: 5.5,
            cost_price: 3.2,
            stock_quantity: 120,
            min_stock: 12,
            unit: "un",
            is_active: true,
          },
        }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "name e sku sao obrigatorios" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-products \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Coca-Cola 350ml",
    "sku": "SKU001",
    "barcode": "7891234567890",
    "category_id": "cat-1",
    "supplier_id": "sup-1",
    "ncm": "22021000",
    "cfop": "5102",
    "sale_price": 5.5,
    "cost_price": 3.2,
    "stock_quantity": 120
  }'`,
  },
  {
    method: "PATCH",
    path: "/pdv-products",
    title: "Atualizar Produto",
    description: "Atualiza um produto existente. Envie o id e apenas os campos que deseja alterar. A function aceita PUT ou PATCH no ambiente publicado.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      id: "a1b2c3d4-...",
      name: "Coca-Cola 350ml",
      sku: "SKU001",
      barcode: "7891234567890",
      category_id: "cat-1",
      supplier_id: "sup-1",
      ncm: "22021000",
      cfop: "5102",
      sale_price: 5.9,
      cost_price: 3.2,
      stock_quantity: 118,
      min_stock: 12,
      unit: "un",
      is_active: true,
    }, null, 2),
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({
          product: {
            id: "a1b2c3d4-...",
            name: "Coca-Cola 350ml",
            sku: "SKU001",
            barcode: "7891234567890",
            category_id: "cat-1",
            supplier_id: "sup-1",
            ncm: "22021000",
            cfop: "5102",
            sale_price: 5.9,
            cost_price: 3.2,
            stock_quantity: 118,
            min_stock: 12,
            unit: "un",
            is_active: true,
          },
        }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "id do produto e obrigatorio" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X PATCH \\
  ${BASE_URL}/pdv-products \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "a1b2c3d4-...",
    "name": "Coca-Cola 350ml",
    "sale_price": 5.9,
    "stock_quantity": 118,
    "category_id": "cat-1",
    "supplier_id": "sup-1",
    "ncm": "22021000",
    "cfop": "5102"
  }'`,
  },
  {
    method: "DELETE",
    path: "/pdv-products",
    title: "Excluir Produto",
    description: "Exclui um produto do cadastro base. O PDV usa esse endpoint para remover produtos quando o usuário confirma a exclusão na tela de edição.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({ id: "a1b2c3d4-..." }, null, 2),
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({ success: true }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "id do produto e obrigatorio" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X DELETE \\
  ${BASE_URL}/pdv-products \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"id":"a1b2c3d4-..."}'`,
  },
  {
    method: "POST",
    path: "/pdv-sales",
    title: "Registrar Venda",
    description: "Registra uma nova venda vinculada a uma sessão de caixa aberta. Automaticamente: cria os itens da venda, debita o estoque de cada produto e gera movimentações de saída. Suporta cliente opcional, desconto percentual e comprovante de venda.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      session_id: "uuid-da-sessao-aberta",
      payment_method: "pix",
      customer_id: "uuid-do-cliente (opcional)",
      discount_percent: 5,
      receipt_requested: true,
      receipt_tax_id: "12.345.678/0001-99",
      items: [
        { product_id: "a1b2c3d4-...", quantity: 2 },
        { product_id: "e5f6g7h8-...", quantity: 1, barcode: "7891234567890" },
      ],
    }, null, 2),
    responses: [
      {
        status: 201,
        label: "Criado",
        body: JSON.stringify({
          sale_id: "f9e8d7c6-...",
          sale_number: 1042,
          total: 15.99,
          items_count: 2,
        }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "session_id is required (open cash register session)" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-sales \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "uuid-da-sessao",
    "payment_method": "pix",
    "customer_id": "uuid-do-cliente",
    "discount_percent": 5,
    "receipt_requested": true,
    "receipt_tax_id": "12.345.678/0001-99",
    "items": [
      { "product_id": "a1b2c3d4-...", "quantity": 2 },
      { "barcode": "7891234567890", "quantity": 1 }
    ]
  }'`,
  },
  {
    method: "GET",
    path: "/pdv-customers",
    title: "Buscar Clientes",
    description: "Retorna a lista de clientes cadastrados. Use o parâmetro 'search' para filtrar por nome, CPF/CNPJ, telefone ou e-mail com correspondência flexível entre os termos. Limite máximo de 200 registros por requisição.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
    ],
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({
          customers: [
            {
              id: "a1b2c3d4-...",
              name: "Maria Silva",
              cpf: "123.456.789-00",
              phone: "(11) 99999-9999",
              email: "maria@email.com",
              address: "Rua das Flores, 10",
              notes: null,
              created_at: "2026-01-15T10:00:00Z",
            },
          ],
          total: 1,
        }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `# Listar todos
curl -X GET \\
  "${BASE_URL}/pdv-customers" \\
  -H "x-pdv-token: tk_live_abc123def456"

# Buscar por nome, CPF/CNPJ ou telefone
curl -X GET \\
  "${BASE_URL}/pdv-customers?search=Maria Silva&limit=20" \\
  -H "x-pdv-token: tk_live_abc123def456"`,
  },
  {
    method: "POST",
    path: "/pdv-customers",
    title: "Criar Cliente",
    description: "Cadastra um novo cliente diretamente pelo PDV. O nome é obrigatório. Se o CPF/CNPJ já estiver cadastrado, retorna 409 com o ID do cliente existente.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      name: "Maria Silva",
      cpf: "123.456.789-00",
      phone: "(11) 99999-9999",
      email: "maria@email.com",
      address: "Rua das Flores, 10",
      notes: "Cliente preferencial",
    }, null, 2),
    responses: [
      {
        status: 201,
        label: "Criado",
        body: JSON.stringify({
          customer: {
            id: "a1b2c3d4-...",
            name: "Maria Silva",
            cpf: "123.456.789-00",
            phone: "(11) 99999-9999",
            email: "maria@email.com",
            address: "Rua das Flores, 10",
            notes: "Cliente preferencial",
            created_at: "2026-03-27T10:00:00Z",
          },
        }, null, 2),
      },
      {
        status: 409,
        label: "CPF/CNPJ duplicado",
        body: JSON.stringify({ error: "CPF/CNPJ já cadastrado para: João Silva", existing_id: "uuid-existente" }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "name is required" }, null, 2),
      },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-customers \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Maria Silva",
    "cpf": "123.456.789-00",
    "phone": "(11) 99999-9999"
  }'`,
  },
  {
    method: "PUT",
    path: "/pdv-customers",
    title: "Atualizar Cliente",
    description: "Atualiza um cliente já cadastrado no PDV. O id é obrigatório e o nome continua obrigatório na atualização.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      id: "a1b2c3d4-...",
      name: "Maria Silva",
      cpf: "123.456.789-00",
      phone: "(11) 99999-9999",
      email: "maria@email.com",
      address: "Rua das Flores, 10",
      notes: "Cliente preferencial",
    }, null, 2),
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({
          customer: {
            id: "a1b2c3d4-...",
            name: "Maria Silva",
            cpf: "123.456.789-00",
            phone: "(11) 99999-9999",
            email: "maria@email.com",
            address: "Rua das Flores, 10",
            notes: "Cliente preferencial",
            created_at: "2026-03-27T10:00:00Z",
          },
        }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "id is required" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X PUT \\
  ${BASE_URL}/pdv-customers \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "a1b2c3d4-...",
    "name": "Maria Silva",
    "phone": "(11) 99999-9999"
  }'`,
  },
  {
    method: "DELETE",
    path: "/pdv-customers",
    title: "Excluir Cliente",
    description: "Remove um cliente do cadastro do PDV. O id é obrigatório.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({ id: "a1b2c3d4-..." }, null, 2),
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({ success: true }, null, 2),
      },
      {
        status: 400,
        label: "Dados inválidos",
        body: JSON.stringify({ error: "id is required" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X DELETE \\
  ${BASE_URL}/pdv-customers \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"id":"a1b2c3d4-..."}'`,
  },
  {
    method: "POST",
    path: "/pdv-cash-register",
    title: "Abrir Caixa",
    description: "Abre uma nova sessão de caixa. Envie action='open', operator_id, amount (saldo inicial) e opcionalmente datetime. Apenas uma sessão aberta por terminal.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({ action: "open", operator_id: "uuid-do-operador", amount: 200, datetime: "2026-03-04T08:00:00Z" }, null, 2),
    responses: [
      { status: 201, label: "Criado", body: JSON.stringify({ success: true, session: { id: "uuid-sessao", terminal_id: "uuid-terminal", opened_at: "2026-03-04T08:00:00Z", opening_balance: 200, status: "open" } }, null, 2) },
      { status: 409, label: "Já aberto", body: JSON.stringify({ error: "Terminal already has an open session", session_id: "uuid-sessao-existente" }, null, 2) },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-cash-register \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"open","operator_id":"uuid","amount":200}'`,
  },
  {
    method: "POST",
    path: "/pdv-cash-register",
    title: "Fechar Caixa",
    description: "Fecha a sessão de caixa. Envie action='close', session_id, operator_id, amount (saldo final) e opcionalmente datetime e notes. Calcula automaticamente o saldo esperado (baseado em vendas em dinheiro e sangrias) e a diferença.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({ action: "close", session_id: "uuid-sessao", operator_id: "uuid-do-operador", amount: 148, notes: "Faltou R$2" }, null, 2),
    responses: [
      { status: 200, label: "Sucesso", body: JSON.stringify({ success: true, session: { id: "uuid-sessao", closing_balance: 148, expected_balance: 150, difference: -2, status: "closed" }, total_sales: 500 }, null, 2) },
      { status: 404, label: "Sessão não encontrada", body: JSON.stringify({ error: "Open session not found" }, null, 2) },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-cash-register \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"close","session_id":"uuid","operator_id":"uuid","amount":148}'`,
  },
  {
    method: "POST",
    path: "/pdv-sangria",
    title: "Sangria",
    description: "Registra uma sangria (retirada de dinheiro) vinculada a uma sessão de caixa aberta. O valor é descontado do saldo esperado no fechamento.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({ session_id: "uuid-sessao", amount: 50, description: "Sangria para cofre", operator_id: "uuid" }, null, 2),
    responses: [
      { status: 201, label: "Criado", body: JSON.stringify({ success: true, movement: { id: "uuid-mov", type: "withdrawal", amount: 50, description: "Sangria para cofre" } }, null, 2) },
      { status: 400, label: "Dados inválidos", body: JSON.stringify({ error: "session_id and positive amount are required" }, null, 2) },
      { status: 404, label: "Sessão não encontrada", body: JSON.stringify({ error: "Open session not found for this terminal" }, null, 2) },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-sangria \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id":"uuid","amount":50,"description":"Sangria para cofre"}'`,
  },
  {
    method: "POST",
    path: "/pdv-refunds",
    title: "Registrar Devolução",
    description: "Registra a devolução parcial ou total de uma venda. Reestoca automaticamente os produtos e cria movimentações de entrada no estoque. A venda é marcada como 'refunded'. Suporta devoluções parciais: informe a quantidade menor que a vendida em cada item.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      sale_id: "uuid-da-venda-original",
      reason: "Produto com defeito",
      items: [
        { product_id: "uuid-produto-1", quantity: 10 },
        { product_id: "uuid-produto-2", quantity: 1 },
      ],
    }, null, 2),
    responses: [
      {
        status: 201,
        label: "Registrado",
        body: JSON.stringify({
          success: true,
          sale_id: "uuid-da-venda",
          sale_number: 1042,
          items_refunded: 2,
          restocked: [
            { product_id: "uuid-produto-1", quantity: 10 },
            { product_id: "uuid-produto-2", quantity: 1 },
          ],
        }, null, 2),
      },
      {
        status: 422,
        label: "Quantidade inválida",
        body: JSON.stringify({ error: "Refund quantity (25) exceeds sold quantity (20) for product uuid-produto-1" }, null, 2),
      },
      {
        status: 422,
        label: "Status inválido",
        body: JSON.stringify({ error: "Sale is not eligible for refund (status: refunded)" }, null, 2),
      },
      {
        status: 404,
        label: "Venda não encontrada",
        body: JSON.stringify({ error: "Sale uuid not found" }, null, 2),
      },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-refunds \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "sale_id": "uuid-da-venda",
    "reason": "Produto com defeito",
    "items": [
      { "product_id": "uuid-produto", "quantity": 10 }
    ]
  }'`,
  },
  {
    method: "GET",
    path: "/pdv-store-settings",
    title: "Configurações da Loja",
    description: "Retorna as configurações gerais da loja: nome, CNPJ, endereço, fuso horário, moeda e logo, com CNPJ formatado para exibição.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
    ],
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({
          terminal: "PDV 01 - Caixa Principal",
          settings: {
            store_name: "Minha Loja",
            cnpj: "12.345.678/0001-99",
            address: "Rua Exemplo, 123 - Centro",
            timezone: "America/Sao_Paulo",
            currency: "BRL",
            logo_url: "https://...storage.../store-assets/logo.png",
          },
        }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X GET \\
  ${BASE_URL}/pdv-store-settings \\
  -H "x-pdv-token: tk_live_abc123def456"`,
  },
];

const ApiDocs = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Documentação da API PDV</h1>
      <p className="text-muted-foreground text-sm">Referência completa dos endpoints para integração com terminais de ponto de venda</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="text-base">Autenticação</CardTitle>
        <CardDescription>Todos os endpoints usam autenticação por token de terminal</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Cada terminal PDV possui um token único (ex: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">tk_live_abc123def456</code>).
          Envie o token no header <code className="bg-muted px-1.5 py-0.5 rounded text-xs">x-pdv-token</code> em todas as requisições.
        </p>
        <p className="text-sm text-muted-foreground">
          Gerencie tokens em <strong>Configurações → PDV / Integração</strong>. Tokens podem ser regenerados a qualquer momento — o token anterior será invalidado imediatamente.
        </p>
        <div>
          <h4 className="text-sm font-semibold mb-1">Base URL</h4>
          <CodeBlock code={BASE_URL} />
        </div>
      </CardContent>
    </Card>

    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Endpoints</h2>
      {endpoints.map((ep, i) => (
        <EndpointCard key={`${ep.method}-${ep.path}-${i}`} {...ep} />
      ))}
    </div>
  </div>
);

export default ApiDocs;
