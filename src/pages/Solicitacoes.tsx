import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ArrowUpDown, Loader2, Inbox } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useComplaints, type ComplaintFilters } from "@/hooks/useComplaints";
import { ComplaintFiltersComponent } from "@/components/complaints/ComplaintFilters";
import {
  ComplaintStatusBadge,
  ComplaintTypeBadge,
} from "@/components/complaints/ComplaintStatusBadge";
import { ComplaintDetailModal } from "@/components/complaints/ComplaintDetailModal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Solicitacoes() {
  const [filters, setFilters] = useState<ComplaintFilters>({});
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: complaints, isLoading, error } = useComplaints(filters);

  const handleViewDetails = (id: string) => {
    setSelectedComplaintId(id);
    setIsModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Solicitações</h1>
            <p className="text-muted-foreground">
              Gerenciamento de reclamações, denúncias e sugestões
            </p>
          </div>
        </div>

        <ComplaintFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />

        <div className="rounded-lg border bg-background overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 flex-1" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-destructive">Erro ao carregar solicitações</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error.message}
              </p>
            </div>
          ) : complaints?.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma solicitação encontrada
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Quando houver solicitações, elas aparecerão aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[120px]">
                    <div className="flex items-center">
                      Data
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints?.map((complaint) => (
                  <TableRow
                    key={complaint.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetails(complaint.id)}
                  >
                    <TableCell className="font-mono text-sm font-medium text-primary">
                      {complaint.protocol_number}
                    </TableCell>
                    <TableCell>
                      <ComplaintTypeBadge type={complaint.type} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{complaint.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {complaint.is_anonymous
                        ? "Anônimo"
                        : complaint.reporter_name || "Não informado"}
                    </TableCell>
                    <TableCell>
                      <ComplaintStatusBadge status={complaint.status} />
                    </TableCell>
                    <TableCell>
                      {format(new Date(complaint.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(complaint.id);
                            }}
                          >
                            Visualizar detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <ComplaintDetailModal
        complaintId={selectedComplaintId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </MainLayout>
  );
}
