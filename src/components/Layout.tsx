import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  BarChart3,
  CreditCard,
  PiggyBank,
  Target,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Shield,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface LayoutProps {
  children: ReactNode;
}

const mainMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transações", href: "/transactions" },
  { icon: Tags, label: "Categorias", href: "/categories" },
  { icon: CreditCard, label: "Cartões", href: "/cartoes" },
];

const economiaMenu = {
  icon: PiggyBank,
  label: "Economia",
  href: "/economia",
  subItems: [
    { icon: PiggyBank, label: "Visão Geral", href: "/economia" },
    { icon: Target, label: "Metas", href: "/economia/metas" },
  ],
};

const bottomMenuItems = [
  { icon: BarChart3, label: "Relatórios", href: "/reports" },
  { icon: User, label: "Perfil", href: "/profile" },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [economiaOpen, setEconomiaOpen] = useState(
    location.pathname.startsWith("/economia")
  );

  const isActive = (href: string) => {
    if (href === "/economia") {
      return location.pathname === "/economia";
    }
    return location.pathname === href;
  };

  const isEconomiaActive = location.pathname.startsWith("/economia");

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b z-50 flex items-center justify-between px-4">
        <span className="text-base font-semibold text-foreground">Fina</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-60 bg-card border-r z-40 transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-5 border-b">
            <span className="text-base font-semibold text-foreground">Fina</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5">
            {mainMenuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 hover:translate-x-0.5",
                  isActive(item.href)
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}

            {/* Menu Economia com submenu */}
            <Collapsible open={economiaOpen} onOpenChange={setEconomiaOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isEconomiaActive
                      ? "bg-secondary/50 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <economiaMenu.icon className="h-4 w-4" />
                    {economiaMenu.label}
                  </div>
                  {economiaOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pl-4 mt-0.5 space-y-0.5">
                {economiaMenu.subItems.map((subItem) => (
                  <Link
                    key={subItem.href}
                    to={subItem.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActive(subItem.href)
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <subItem.icon className="h-3.5 w-3.5" />
                    {subItem.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Separador */}
            <div className="my-3 border-t" />

            {/* Link Admin - apenas para admins */}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive("/admin")
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}

            {/* Menu secundário */}
            {bottomMenuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">
        <div className="p-6 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
