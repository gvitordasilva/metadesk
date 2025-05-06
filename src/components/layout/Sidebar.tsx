
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { MessageSquare, ClipboardList, Book, Megaphone, BarChart3, Settings, Home, Menu, X } from "lucide-react";

type SidebarItemProps = {
  to: string;
  icon: React.ElementType;
  text: string;
  active?: boolean;
  collapsed?: boolean;
};

const SidebarItem = ({
  to,
  icon: Icon,
  text,
  active,
  collapsed
}: SidebarItemProps) => {
  return <Link to={to} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-all", active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
      <Icon size={20} />
      {!collapsed && <span>{text}</span>}
    </Link>;
};

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  const menuItems = [{
    to: "/",
    icon: Home,
    text: "Dashboard",
    path: "/"
  }, {
    to: "/atendimento",
    icon: MessageSquare,
    text: "Atendimento",
    path: "/atendimento"
  }, {
    to: "/solicitacoes",
    icon: ClipboardList,
    text: "Solicitações",
    path: "/solicitacoes"
  }, {
    to: "/conteudo",
    icon: Book,
    text: "Conteúdo",
    path: "/conteudo"
  }, {
    to: "/campanhas",
    icon: Megaphone,
    text: "Campanhas",
    path: "/campanhas"
  }, {
    to: "/monitoramento",
    icon: BarChart3,
    text: "Monitoramento",
    path: "/monitoramento"
  }, {
    to: "/administracao",
    icon: Settings,
    text: "Administração",
    path: "/administracao"
  }];

  return <aside className={cn("bg-sidebar flex flex-col h-screen transition-all duration-300", collapsed ? "w-[70px]" : "w-[240px]")}>
      <div className="flex justify-center items-center border-b border-sidebar-border px-0 mx-0 py-[20px]">
        {collapsed ? (
          <img src="/lovable-uploads/metadesk-icon.svg" alt="Metadesk" className="h-10" />
        ) : (
          <img 
            src="/lovable-uploads/9dbe1620-8f79-4cd0-9b06-d66c24802e9e.png" 
            alt="Metadesk" 
            className="h-12 object-contain" 
          />
        )}
      </div>

      <div className="flex-grow overflow-y-auto py-4 px-2">
        <nav className="space-y-1">
          {menuItems.map(item => <SidebarItem key={item.to} to={item.to} icon={item.icon} text={item.text} active={location.pathname === item.path} collapsed={collapsed} />)}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <button onClick={toggleCollapse} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>
    </aside>;
}
