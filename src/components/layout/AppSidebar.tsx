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
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (children?: { url: string }[]) =>
    children?.some((c) => currentPath.startsWith(c.url)) ?? false;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-sidebar-primary" />
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight">
              GestãoLoja
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
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
                          className={
                            isGroupActive(item.children)
                              ? "text-sidebar-primary font-medium"
                              : ""
                          }
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink
                                  to={child.url}
                                  end
                                  className="hover:bg-sidebar-accent"
                                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                                >
                                  <child.icon className="h-3.5 w-3.5 mr-2" />
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
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
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

      <SidebarFooter className="p-3 space-y-2">
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        )}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto text-sidebar-foreground/70"
            onClick={() => signOut()}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
