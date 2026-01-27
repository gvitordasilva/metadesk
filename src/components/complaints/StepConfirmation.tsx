import { useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, FileText, User, Calendar, MapPin, Loader2 } from "lucide-react";
import { IdentificationData } from "./StepIdentification";
import { DetailsData } from "./StepDetails";

interface StepConfirmationProps {
  identificationData: IdentificationData;
  detailsData: DetailsData;
  files: File[];
  captchaToken: string | null;
  onCaptchaChange: (token: string | null) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Test key - replace in production

export function StepConfirmation({
  identificationData,
  detailsData,
  files,
  captchaToken,
  onCaptchaChange,
  onSubmit,
  onBack,
  isSubmitting,
}: StepConfirmationProps) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const typeLabels = {
    reclamacao: "Reclamação",
    denuncia: "Denúncia",
    sugestao: "Sugestão",
  };

  const categoryLabels: Record<string, string> = {
    atendimento: "Atendimento",
    produto: "Produto",
    servico: "Serviço",
    conduta: "Conduta",
    financeiro: "Financeiro",
    outro: "Outro",
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Não informada";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Confirme sua Solicitação
        </h2>
        <p className="text-muted-foreground">
          Revise os dados antes de enviar
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        {/* Identification */}
        <div className="flex items-start gap-3">
          <User className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Identificação</p>
            <p className="text-foreground">
              {identificationData.isAnonymous
                ? "Anônimo"
                : `${identificationData.name} (${identificationData.email})`}
            </p>
          </div>
        </div>

        {/* Type and Category */}
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tipo / Categoria</p>
            <p className="text-foreground">
              {detailsData.type ? typeLabels[detailsData.type] : ""} • {categoryLabels[detailsData.category] || detailsData.category}
            </p>
          </div>
        </div>

        {/* Date */}
        {detailsData.occurredAt && (
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data do ocorrido</p>
              <p className="text-foreground">{formatDate(detailsData.occurredAt)}</p>
            </div>
          </div>
        )}

        {/* Location */}
        {detailsData.location && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Local</p>
              <p className="text-foreground">{detailsData.location}</p>
            </div>
          </div>
        )}

        {/* Description preview */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
          <p className="text-foreground text-sm line-clamp-3">{detailsData.description}</p>
        </div>

        {/* Attachments */}
        {files.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Anexos ({files.length})
            </p>
            <p className="text-foreground text-sm">
              {files.map((f) => f.name).join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* reCAPTCHA */}
      <div className="flex flex-col items-center gap-4 py-4">
        <p className="text-sm text-muted-foreground">
          🔒 Verifique que você é humano
        </p>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={onCaptchaChange}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!captchaToken || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Enviar Solicitação
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
