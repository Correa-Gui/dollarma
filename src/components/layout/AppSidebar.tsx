import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  ChevronDown,
  History,
  RotateCcw,
  Box,
  FolderTree,
  Truck,
  ArrowLeftRight,
  ClipboardList,
  TrendingUp,
  Award,
  DollarSign,
  Wallet,
  AlertTriangle,
  Wrench,
  MonitorSmartphone,
  Users,
  FileText,
  Store,
  BookOpen,
  CalendarRange,
  PieChart,
  BarChart2,
  CreditCard,
  RefreshCw,
  UserRound,
  FileUp,
  ShieldCheck,
  Receipt,
  Landmark,
  FileStack,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Vendas",
    icon: ShoppingCart,
    children: [
      { title: "Histórico de Vendas", url: "/vendas/historico", icon: History },
      { title: "Clientes", url: "/clientes", icon: UserRound },
      { title: "Devoluções", url: "/vendas/devolucoes", icon: RotateCcw },
    ],
  },
  {
    title: "Estoque",
    icon: Package,
    children: [
      { title: "Produtos", url: "/estoque/produtos", icon: Box },
      { title: "Categorias", url: "/estoque/categorias", icon: FolderTree },
      { title: "Fornecedores", url: "/estoque/fornecedores", icon: Truck },
      { title: "Movimentações", url: "/estoque/movimentacoes", icon: ArrowLeftRight },
      { title: "Inventário", url: "/estoque/inventario", icon: ClipboardList },
      { title: "Importar XML", url: "/estoque/importar-xml", icon: FileUp },
    ],
  },
  {
    title: "Financeiro",
    icon: Landmark,
    children: [
      { title: "Contas a Pagar", url: "/financeiro/contas-a-pagar", icon: FileStack },
      { title: "Balancete", url: "/financeiro/balancete", icon: BarChart2 },
      { title: "Posição Financeira", url: "/financeiro/posicao-financeira", icon: TrendingUp },
    ],
  },
  {
    title: "Relatórios",
    icon: BarChart3,
    children: [
      { title: "Vendas por Período", url: "/relatorios/vendas", icon: TrendingUp },
      { title: "Mais Vendidos", url: "/relatorios/mais-vendidos", icon: Award },
      { title: "Lucratividade", url: "/relatorios/lucratividade", icon: DollarSign },
      { title: "Fluxo de Caixa", url: "/relatorios/fluxo-caixa", icon: Wallet },
      { title: "Estoque Crítico", url: "/relatorios/estoque-critico", icon: AlertTriangle },
      { title: "Sazonalidade", url: "/relatorios/sazonalidade", icon: CalendarRange },
      { title: "Categorias", url: "/relatorios/categorias", icon: PieChart },
      { title: "Curva ABC", url: "/relatorios/curva-abc", icon: BarChart2 },
      { title: "Ticket × Pagamento", url: "/relatorios/ticket-pagamento", icon: CreditCard },
      { title: "Giro de Estoque", url: "/relatorios/giro-estoque", icon: RefreshCw },
      { title: "Caixa Diário", url: "/relatorios/caixa", icon: Wallet },
      { title: "Notas Fiscais", url: "/relatorios/notas-fiscais", icon: Receipt },
      { title: "Histórico de Preços", url: "/relatorios/historico-precos", icon: History },
    ],
  },
  {
    title: "Configurações",
    icon: Settings,
    children: [
      { title: "Geral", url: "/config/geral", icon: Wrench },
      { title: "PDV / Integração", url: "/config/pdv", icon: MonitorSmartphone },
      { title: "Usuários", url: "/config/usuarios", icon: Users },
      { title: "Plano de Contas", url: "/config/plano-contas", icon: FileText },
      { title: "Auditoria", url: "/auditoria", icon: ShieldCheck },
      { title: "API Docs", url: "/config/api-docs", icon: BookOpen },
    ],
  },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";
  const closeOnMobile = () => { if (isMobile) setOpenMobile(false); };
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (children?: { url: string }[]) =>
    children?.some((c) => currentPath.startsWith(c.url)) ?? false;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight leading-none">
                GestãoLoja
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                Painel de Controle
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {!collapsed && (
        <div className="px-4 py-1">
          <Separator className="bg-sidebar-border" />
        </div>
      )}

      <SidebarContent className="px-2 pt-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {menuItems.map((item) =>
                item.children ? (
                  <Collapsible
                    key={item.title}
                    defaultOpen={isGroupActive(item.children)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={item.title}
                          className={`
                            rounded-md transition-all duration-200 ease-out
                            hover:bg-sidebar-accent/60 hover:translate-x-0.5
                            ${isGroupActive(item.children)
                              ? "text-sidebar-primary font-semibold bg-sidebar-accent/40"
                              : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                            }
                          `}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="text-[13px]">{item.title}</span>
                          <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50 transition-transform duration-300 ease-out group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
                        <SidebarMenuSub className="ml-3.5 border-l border-sidebar-border/60 pl-0">
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink
                                  to={child.url}
                                  end
                                  onClick={closeOnMobile}
                                  className="
                                    rounded-md pl-3 transition-all duration-200 ease-out text-[12.5px]
                                    text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 hover:translate-x-0.5
                                  "
                                  activeClassName="
                                    bg-sidebar-accent text-sidebar-accent-foreground font-medium
                                    shadow-[inset_2px_0_0_0_hsl(var(--sidebar-primary))]
                                  "
                                >
                                  <child.icon className="h-3.5 w-3.5 mr-2 shrink-0" />
                                  <span>{child.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url!}
                        end
                        onClick={closeOnMobile}
                        className="
                          rounded-md transition-all duration-200 ease-out text-[13px]
                          text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 hover:translate-x-0.5
                        "
                        activeClassName="
                          bg-sidebar-accent text-sidebar-accent-foreground font-semibold
                          shadow-[inset_3px_0_0_0_hsl(var(--sidebar-primary))]
                        "
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="px-1 pb-1">
            <Separator className="bg-sidebar-border" />
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={`
            transition-all duration-200 ease-out rounded-md
            text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10
            ${collapsed ? "mx-auto" : "w-full justify-start"}
          `}
          onClick={() => signOut()}
          title="Sair"
        >
          <LogOut className={`h-4 w-4 ${collapsed ? "" : "mr-2"}`} />
          {!collapsed && <span className="text-[13px]">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

