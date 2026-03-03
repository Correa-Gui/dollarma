import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

type MethodBadgeProps = { method: "GET" | "POST" | "PUT" | "DELETE" };
const MethodBadge = ({ method }: MethodBadgeProps) => {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
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
  method: "GET" | "POST";
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
    description: "Autentica um operador (caixa, gerente, admin) no terminal PDV. Requer token de terminal válido. Retorna dados do usuário, role e informações do terminal.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV cadastrado no sistema" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      email: "operador@loja.com",
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
        body: JSON.stringify({ error: "email and password are required" }, null, 2),
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
    "email": "operador@loja.com",
    "password": "senha123"
  }'`,
  },
  {
    method: "GET",
    path: "/pdv-catalog",
    title: "Catálogo de Produtos",
    description: "Retorna todos os produtos ativos com preços, promoções e estoque. O terminal é atualizado como 'online' e a data de última sincronização é registrada.",
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
    method: "POST",
    path: "/pdv-sales",
    title: "Registrar Venda",
    description: "Registra uma nova venda no sistema. Automaticamente: cria os itens da venda, debita o estoque de cada produto e gera movimentações de saída.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({
      payment_method: "pix",
      items: [
        { product_id: "a1b2c3d4-...", quantity: 2 },
        { product_id: "e5f6g7h8-...", quantity: 1 },
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
        body: JSON.stringify({ error: "payment_method and items[] are required" }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
      {
        status: 404,
        label: "Produto não encontrado",
        body: JSON.stringify({ error: "Product a1b2c3d4-... not found" }, null, 2),
      },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-sales \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{
    "payment_method": "pix",
    "items": [
      { "product_id": "a1b2c3d4-...", "quantity": 2 }
    ]
  }'`,
  },
  {
    method: "GET",
    path: "/pdv-terminal-status",
    title: "Status do Terminal",
    description: "Retorna o status atual do terminal, incluindo contagem de vendas e faturamento do dia.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
    ],
    responses: [
      {
        status: 200,
        label: "Sucesso",
        body: JSON.stringify({
          terminal_id: "a1b2c3d4-...",
          name: "PDV 01 - Caixa Principal",
          status: "online",
          last_sync: "2026-02-27T14:30:00.000Z",
          sync_interval_min: 5,
          sales_today: 23,
          revenue_today: 1456.80,
        }, null, 2),
      },
      {
        status: 401,
        label: "Não autorizado",
        body: JSON.stringify({ error: "Invalid terminal token" }, null, 2),
      },
    ],
    curlExample: `curl -X GET \\
  ${BASE_URL}/pdv-terminal-status \\
  -H "x-pdv-token: tk_live_abc123def456"`,
  },
  {
    method: "POST",
    path: "/pdv-cash-register?action=open",
    title: "Abrir Caixa",
    description: "Abre uma nova sessão de caixa para o terminal. Apenas uma sessão aberta por terminal é permitida.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({ operator_id: "uuid-do-operador", opening_balance: 200 }, null, 2),
    responses: [
      { status: 200, label: "Sucesso", body: JSON.stringify({ success: true, session: { id: "uuid-sessao", terminal_id: "uuid-terminal", opened_at: "2026-03-03T08:00:00Z", opening_balance: 200, status: "open" } }, null, 2) },
      { status: 409, label: "Já aberto", body: JSON.stringify({ error: "Terminal already has an open session", session_id: "uuid-sessao-existente" }, null, 2) },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-cash-register?action=open \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"operator_id":"uuid","opening_balance":200}'`,
  },
  {
    method: "POST",
    path: "/pdv-cash-register?action=close",
    title: "Fechar Caixa",
    description: "Fecha a sessão de caixa. Calcula automaticamente o saldo esperado e a diferença em relação ao saldo informado.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({ session_id: "uuid-sessao", operator_id: "uuid-do-operador", closing_balance: 148, notes: "Faltou R$2" }, null, 2),
    responses: [
      { status: 200, label: "Sucesso", body: JSON.stringify({ success: true, session: { id: "uuid-sessao", closing_balance: 148, expected_balance: 150, difference: -2, status: "closed" } }, null, 2) },
      { status: 404, label: "Sessão não encontrada", body: JSON.stringify({ error: "Open session not found" }, null, 2) },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-cash-register?action=close \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id":"uuid","operator_id":"uuid","closing_balance":148}'`,
  },
  {
    method: "POST",
    path: "/pdv-cash-register?action=withdrawal",
    title: "Sangria",
    description: "Registra uma sangria (retirada de dinheiro) na sessão aberta do terminal.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
      { name: "Content-Type", required: true, description: "application/json" },
    ],
    requestBody: JSON.stringify({ session_id: "uuid-sessao", amount: 50, description: "Sangria para cofre", operator_id: "uuid" }, null, 2),
    responses: [
      { status: 200, label: "Sucesso", body: JSON.stringify({ success: true, movement: { id: "uuid-mov", type: "withdrawal", amount: 50, description: "Sangria para cofre" } }, null, 2) },
      { status: 400, label: "Dados inválidos", body: JSON.stringify({ error: "session_id and positive amount are required" }, null, 2) },
    ],
    curlExample: `curl -X POST \\
  ${BASE_URL}/pdv-cash-register?action=withdrawal \\
  -H "x-pdv-token: tk_live_abc123def456" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id":"uuid","amount":50,"description":"Sangria"}'`,
  },
  {
    method: "GET",
    path: "/pdv-cash-register?action=status",
    title: "Status do Caixa",
    description: "Retorna o status atual do caixa do terminal: se está aberto, saldo corrente, totais de vendas, sangrias e suprimentos.",
    headers: [
      { name: "x-pdv-token", required: true, description: "Token do terminal PDV" },
    ],
    responses: [
      { status: 200, label: "Caixa aberto", body: JSON.stringify({ open: true, session_id: "uuid", current_balance: 150, total_sales: 0, total_withdrawals: 50, total_deposits: 0, movements_count: 1 }, null, 2) },
      { status: 200, label: "Caixa fechado", body: JSON.stringify({ open: false, terminal_id: "uuid" }, null, 2) },
    ],
    curlExample: `curl -X GET \\
  ${BASE_URL}/pdv-cash-register?action=status \\
  -H "x-pdv-token: tk_live_abc123def456"`,
  },
  {
    method: "GET",
    path: "/pdv-store-settings",
    title: "Configurações da Loja",
    description: "Retorna as configurações gerais da loja: nome, CNPJ, endereço, fuso horário, moeda e logo. Útil para exibir dados fiscais e identidade visual em cupons e recibos no PDV.",
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
