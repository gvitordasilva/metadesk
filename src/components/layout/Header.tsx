
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex-1 flex gap-4 items-center">
          {/* Usamos o logo escuro no header que tem fundo claro */}
          <img src="/metadesk-logo-dark.svg" alt="Metadesk" className="h-8 hidden md:block" />
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full pl-8 bg-muted/30"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <DropdownMenuItem className="py-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Novo atendimento</span>
                    <span className="text-sm text-muted-foreground">
                      Cliente aguardando no WhatsApp
                    </span>
                    <span className="text-xs text-muted-foreground">
                      2 minutos atrás
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Solicitação atualizada</span>
                    <span className="text-sm text-muted-foreground">
                      Protocolo #12345 alterado para "Em andamento"
                    </span>
                    <span className="text-xs text-muted-foreground">
                      15 minutos atrás
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Nova base de conhecimento</span>
                    <span className="text-sm text-muted-foreground">
                      Artigos sobre o novo produto disponíveis
                    </span>
                    <span className="text-xs text-muted-foreground">
                      1 hora atrás
                    </span>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary">
                Ver todas as notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative rounded-full h-8 w-8 border">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Preferências</DropdownMenuItem>
              <DropdownMenuItem>Ajuda</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
