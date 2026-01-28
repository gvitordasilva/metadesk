import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ComplaintStatusBadge, ComplaintTypeBadge } from "./ComplaintStatusBadge";
import { useComplaint, useUpdateComplaint, useAttendants } from "@/hooks/useComplaints";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ComplaintDetailModalProps {
  complaintId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComplaintDetailModal({
  complaintId,
  open,
  onOpenChange,
}: ComplaintDetailModalProps) {
  const { data: complaint, isLoading } = useComplaint(complaintId);
  const { data: attendants } = useAttendants();
  const updateComplaint = useUpdateComplaint();
  const { toast } = useToast();

  const [internalNotes, setInternalNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");

  // Sync state when complaint loads
  useState(() => {
    if (complaint) {
      setInternalNotes(complaint.internal_notes || "");
      setSelectedStatus(complaint.status);
      setSelectedAssignee(complaint.assigned_to || "");
    }
  });

  const handleSaveChanges = async () => {
    if (!complaint) return;

    try {
      await updateComplaint.mutateAsync({
        id: complaint.id,
        updates: {
          status: selectedStatus || complaint.status,
          assigned_to: selectedAssignee || null,
          internal_notes: internalNotes || null,
        },
      });

      toast({
        title: "Solicitação atualizada",
        description: "As alterações foram salvas com sucesso.",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!complaint) return null;

  const attachments = complaint.attachments as string[] | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-primary">
              {complaint.protocol_number}
            </span>
            <ComplaintTypeBadge type={complaint.type} />
            <ComplaintStatusBadge status={complaint.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Solicitante */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Solicitante
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  {complaint.is_anonymous
                    ? "Anônimo"
                    : complaint.reporter_name || "Não informado"}
                </span>
              </div>
              {!complaint.is_anonymous && complaint.reporter_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{complaint.reporter_email}</span>
                </div>
              )}
              {!complaint.is_anonymous && complaint.reporter_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{complaint.reporter_phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(complaint.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Detalhes da Solicitação */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Detalhes
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <p className="mt-1">
                  <Badge variant="outline">{complaint.category}</Badge>
                </p>
              </div>

              {complaint.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{complaint.location}</span>
                </div>
              )}

              {complaint.occurred_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Ocorreu em:{" "}
                    {format(new Date(complaint.occurred_at), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Descrição</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                  {complaint.description}
                </p>
              </div>

              {complaint.involved_parties && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Pessoas/Setores Envolvidos
                  </Label>
                  <p className="mt-1 text-sm">{complaint.involved_parties}</p>
                </div>
              )}
            </div>
          </div>

          {/* Anexos */}
          {attachments && attachments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Anexos ({attachments.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Anexo {index + 1}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Ações */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Gerenciamento
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus || complaint.status}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select
                  value={selectedAssignee || "unassigned"}
                  onValueChange={(v) =>
                    setSelectedAssignee(v === "unassigned" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Não atribuído" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Não atribuído</SelectItem>
                    {attendants?.map((attendant) => (
                      <SelectItem key={attendant.user_id} value={attendant.user_id}>
                        {attendant.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas Internas</Label>
              <Textarea
                placeholder="Adicione notas internas sobre esta solicitação..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={updateComplaint.isPending}
            >
              {updateComplaint.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
