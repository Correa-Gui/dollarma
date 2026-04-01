import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  CreditCard,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: ShoppingCart,
    eyebrow: "Venda com ritmo",
    title: "PDV, histórico e clientes sem retrabalho",
    copy: "Abra caixa, acompanhe devoluções e consulte o dia em um fluxo único.",
    bullets: ["Histórico centralizado", "Ticket por pagamento", "Busca rápida de clientes"],
    accent: "text-[#ffb693]",
    glow: "from-[#ffb693]/25 via-[#ff6b00]/10 to-transparent",
  },
  {
    icon: Boxes,
    eyebrow: "Reposição com clareza",
    title: "Estoque, XML e fornecedores conectados",
    copy: "Da entrada da nota ao inventário, cada movimentação fica rastreável.",
    bullets: ["Importação de XML", "Categorias e fornecedores", "Estoque crítico e giro"],
    accent: "text-[#46eaed]",
    glow: "from-[#46eaed]/20 via-[#00cdd0]/10 to-transparent",
  },
];

const testimonials = [
  ["Fechamento de caixa, devolução e histórico ficaram no mesmo lugar.", "Juliana Ferreira", "Gerente de Loja"],
  ["Com XML e alerta de estoque, a reposição ficou previsível.", "Rafael Lima", "Compras e Estoque"],
  ["Os relatórios finalmente conversam com o financeiro.", "André Martins", "Financeiro"],
];

const Index = () => {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard" : "/auth";
  const primaryLabel = user ? "Abrir painel" : "Entrar no sistema";

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] selection:bg-[#ffb693] selection:text-[#351000]">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#131313]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link to="/" className="font-display text-sm font-extrabold uppercase tracking-[0.28em] text-white">
            Dollar Gestão
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {["#produto", "#modulos", "#resultados"].map((href, index) => (
              <a
                key={href}
                href={href}
                className="font-display text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-white"
              >
                {["Produto", "Módulos", "Resultados"][index]}
              </a>
            ))}
          </div>
          <Link
            to={primaryHref}
            className="inline-flex items-center gap-2 rounded-full bg-[#46eaed] px-4 py-2 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-[#003738]"
          >
            {primaryLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      <main>
        <section id="produto" className="relative overflow-hidden px-6 pb-24 pt-32 md:px-10 md:pb-32 md:pt-40">
          <div className="urban-grid absolute inset-x-0 top-0 h-[32rem] opacity-50" />
          <div className="absolute left-[-8rem] top-12 h-72 w-72 rounded-full bg-[#ff6b00]/15 blur-[140px]" />
          <div className="absolute right-[-6rem] top-8 h-[24rem] w-[24rem] rounded-full bg-[#46eaed]/10 blur-[150px]" />

          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="landing-reveal">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
                <Sparkles className="h-3.5 w-3.5 text-[#46eaed]" />
                Dollar Gestão 1.11
              </div>
              <h1 className="orange-glow font-display text-5xl font-black uppercase leading-[0.95] tracking-[-0.07em] text-white md:text-7xl xl:text-[5.6rem]">
                Dollar Gestão:
                <br />
                <span className="text-[#ffb693]">onde a operação</span>
                <br />
                encontra o controle
              </h1>
              <p className="mt-8 max-w-2xl border-l-2 border-[#46eaed]/70 pl-5 font-body text-lg leading-relaxed text-zinc-300 md:text-xl">
                Vendas, estoque, financeiro e relatórios no mesmo painel, com ritmo de PDV e leitura de gestão.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  to={primaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#ffb693] to-[#ff6b00] px-7 py-4 font-display text-xs font-black uppercase tracking-[0.22em] text-[#351000]"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#modulos"
                  className="glass-panel inline-flex items-center justify-center rounded-full px-7 py-4 font-display text-xs font-bold uppercase tracking-[0.22em] text-white"
                >
                  Ver módulos
                </a>
              </div>
              <div className="mt-10 grid gap-4 md:grid-cols-3">
                {[
                  ["PDV + Backoffice", "Operação em um único fluxo"],
                  ["XML + Inventário", "Estoque com leitura em tempo real"],
                  ["Financeiro vivo", "Caixa e margem no mesmo painel"],
                ].map(([title, copy]) => (
                  <div key={title} className="glass-panel rounded-[1.4rem] p-5">
                    <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-[#46eaed]">{title}</p>
                    <p className="mt-2 font-body text-sm text-zinc-400">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-reveal-delay angled-frame glass-panel overflow-hidden rounded-[2rem] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-400">Visão da operação</p>
                  <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em] text-white">Painel ativo</h2>
                </div>
                <div className="rounded-full bg-[#46eaed]/14 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[#8ff7f8]">Online</div>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  ["Faturamento hoje", "R$ 18,4 mil", "+12,8% vs. ontem"],
                  ["Estoque crítico", "07 itens", "Reposição priorizada"],
                ].map(([label, value, note]) => (
                  <div key={label} className="rounded-[1.4rem] bg-[#201f1f] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
                    <p className="mt-3 font-display text-3xl font-black tracking-[-0.06em] text-white">{value}</p>
                    <p className="mt-2 text-sm text-zinc-400">{note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-[1.6rem] bg-[#181717] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-zinc-400">Ritmo das vendas</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#ffb693]">Atualizado agora</p>
                </div>
                <div className="flex h-36 items-end gap-3">
                  {[30, 54, 48, 74, 66, 92, 84, 108].map((height, index) => (
                    <div
                      key={height}
                      className={`w-full rounded-t-full ${index > 5 ? "bg-[#46eaed]/80" : "bg-[#ffb693]/75"}`}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modulos" className="bg-[#151515] px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end">
              <h2 className="font-display text-4xl font-black uppercase tracking-[-0.06em] text-white md:text-6xl">Módulos centrais</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {features.map((item) => (
                <article key={item.title} className="relative overflow-hidden rounded-[2rem] bg-[#1c1b1b] p-8 md:p-10">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.glow}`} />
                  <div className="relative z-10">
                    <div className={`inline-flex items-center gap-2 rounded-full bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.2em] ${item.accent}`}>
                      <item.icon className="h-3.5 w-3.5" />
                      {item.eyebrow}
                    </div>
                    <h3 className="mt-8 font-display text-3xl font-black uppercase leading-tight tracking-[-0.05em] text-white md:text-5xl">
                      {item.title}
                    </h3>
                    <p className="mt-5 max-w-lg font-body text-lg leading-relaxed text-zinc-300">{item.copy}</p>
                    <div className="mt-8 grid gap-3">
                      {item.bullets.map((bullet) => (
                        <div key={bullet} className="glass-panel flex items-center gap-3 rounded-[1.2rem] px-4 py-3">
                          <Check className={`h-4 w-4 ${item.accent}`} />
                          <p className="font-body text-sm text-zinc-200">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#1c1b1b] px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-[#46eaed]">Produto com pulso operacional</p>
              <h2 className="mt-5 font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-white md:text-7xl">
                A rotina do varejo
                <br />
                <span className="text-[#46eaed]">encontra visão</span>
                <br />
                de gestão
              </h2>
              <p className="mt-8 max-w-2xl font-body text-lg leading-relaxed text-zinc-300">
                Dollar Gestão nasceu para tirar a loja do improviso. Em vez de planilhas paralelas e conferências demoradas, o time acompanha vendas, estoque, clientes e financeiro em um fluxo coerente.
              </p>
              <p className="mt-6 max-w-2xl border-l-2 border-[#ffb693] pl-5 font-body text-lg italic leading-relaxed text-zinc-300">
                Controle bom é o que acelera quem vende e clareia quem decide.
              </p>
            </div>

            <div className="relative">
              <div className="angled-frame rounded-[2rem] bg-[#201f1f] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
                <div className="rounded-[1.6rem] bg-[#171616] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Resumo diário</p>
                      <p className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.05em] text-white">Loja em movimento</p>
                    </div>
                    <div className="rounded-full bg-[#46eaed]/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#8ff7f8]">3 terminais online</div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      ["Vendas", "284"],
                      ["Itens", "1.942"],
                      ["Clientes", "117"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[1.15rem] bg-white/[0.03] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                        <p className="mt-3 font-display text-2xl font-black tracking-[-0.05em] text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="glass-panel teal-glow absolute -bottom-6 left-4 rounded-[1.2rem] px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-400">Status agora</p>
                <p className="mt-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-white">Operação sincronizada</p>
              </div>
            </div>
          </div>
        </section>

        <section id="resultados" className="bg-[#151515] px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-7xl">
            <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-[#ffb693]">Painéis que mostram o que importa</p>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase tracking-[-0.06em] text-white md:text-6xl">
              Clareza em cada camada da operação
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-4 md:grid-rows-2">
              <div className="relative overflow-hidden rounded-[1.75rem] bg-[#1c1b1b] p-6 md:col-span-2 md:row-span-2">
                <div className="absolute inset-0 bg-gradient-to-br from-[#ffb693]/20 via-transparent to-transparent" />
                <div className="relative z-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffb693]">Financeiro</p>
                  <h3 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] text-white">Fluxo de caixa e lucratividade</h3>
                  <p className="mt-4 max-w-md font-body text-zinc-300">Acompanhe faturamento, caixa diário e margem sem planilhas paralelas.</p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] bg-[#171616] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Margem do dia</p>
                      <p className="mt-3 font-display text-4xl font-black tracking-[-0.06em] text-white">18,7%</p>
                    </div>
                    <div className="rounded-[1.25rem] bg-[#171616] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Entradas x saídas</p>
                      <div className="mt-5 flex h-24 items-end gap-3">
                        {[40, 62, 54, 78, 64, 86].map((height, index) => (
                          <div
                            key={height}
                            className={`w-full rounded-t-full ${index % 2 === 0 ? "bg-[#ffb693]/75" : "bg-[#46eaed]/80"}`}
                            style={{ height: `${height}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-[#1c1b1b] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#46eaed]">Pagamento</p>
                    <h3 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.05em] text-white">Ticket por método</h3>
                  </div>
                  <CreditCard className="h-5 w-5 text-[#46eaed]" />
                </div>
                <div className="mt-6 space-y-3 font-body text-sm text-zinc-300">
                  <div className="flex items-center justify-between"><span>Crédito</span><span className="font-display text-base font-bold text-white">46%</span></div>
                  <div className="flex items-center justify-between"><span>PIX</span><span className="font-display text-base font-bold text-white">31%</span></div>
                  <div className="flex items-center justify-between"><span>Dinheiro</span><span className="font-display text-base font-bold text-white">23%</span></div>
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-[#1c1b1b] p-6 md:row-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffb693]">Relatórios</p>
                    <h3 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.05em] text-white">Indicadores prontos</h3>
                  </div>
                  <BarChart3 className="h-5 w-5 text-[#ffb693]" />
                </div>
                <div className="mt-6 space-y-3">
                  {["Vendas por período", "Curva ABC e categorias", "Sazonalidade", "Caixa diário"].map((item) => (
                    <div key={item} className="glass-panel flex items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm text-zinc-200">
                      <Check className="h-4 w-4 text-[#ffb693]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] bg-[#1c1b1b] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#46eaed]">Governança</p>
                    <h3 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.05em] text-white">Auditoria e API</h3>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-[#46eaed]" />
                </div>
                <div className="mt-6 space-y-3 text-sm text-zinc-300">
                  {["Trilha por usuário", "Integração com PDV", "Perfis e permissões"].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#46eaed]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0f0f0f] px-6 py-24 md:px-10 md:py-32">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center font-display text-3xl font-black uppercase tracking-[-0.05em] text-white md:text-5xl">
              Quem opera sente a diferença
            </h2>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {testimonials.map(([quote, name, role], index) => (
                <article key={name} className="rounded-[1.5rem] bg-[#1c1b1b] p-7">
                  <div className={`mb-6 h-1.5 w-16 rounded-full ${index === 1 ? "bg-[#ffb693]" : "bg-[#46eaed]"}`} />
                  <p className="font-body text-lg leading-relaxed text-zinc-300">"{quote}"</p>
                  <div className="mt-8">
                    <p className="font-display text-sm font-bold uppercase tracking-[0.12em] text-white">{name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 border-b border-white/5 px-6 py-16 md:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-[#ffb693]">Pronto para operar com mais clareza?</p>
            <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.06em] text-white md:text-6xl">
              Menos improviso.
              <br />
              Mais leitura de gestão.
            </h2>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              to={primaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#ffb693] to-[#ff6b00] px-7 py-4 font-display text-xs font-black uppercase tracking-[0.2em] text-[#351000]"
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#produto" className="glass-panel inline-flex items-center justify-center rounded-full px-7 py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-white">
              Voltar ao topo
            </a>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:grid-cols-[1.3fr_1fr_1fr] md:px-10">
          <div>
            <p className="font-display text-lg font-black uppercase tracking-[0.18em] text-[#ffb693]">Dollar Gestão</p>
            <p className="mt-4 max-w-sm font-body text-sm leading-relaxed text-zinc-500">
              Plataforma para vendas, estoque, financeiro, relatórios e operação de loja em um painel único.
            </p>
          </div>
          <div className="space-y-3 text-sm text-zinc-500">
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">Navegação</p>
            <a href="#produto" className="block hover:text-[#46eaed]">Plataforma</a>
            <a href="#modulos" className="block hover:text-[#46eaed]">Funcionalidades</a>
            <a href="#resultados" className="block hover:text-[#46eaed]">Painéis</a>
          </div>
          <div className="space-y-3 text-sm text-zinc-500">
            <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">Acesso</p>
            <Link to="/auth" className="block hover:text-[#46eaed]">Entrar</Link>
            <Link to="/dashboard" className="block hover:text-[#46eaed]">Dashboard</Link>
          </div>
        </div>
        <div className="border-t border-white/5 px-6 py-6 text-center md:px-10">
          <p className="font-body text-xs uppercase tracking-[0.18em] text-zinc-700">
            © 2026 Dollar Gestão. Operação, estoque e financeiro no mesmo ritmo.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
