import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, FileText, User, Calendar, MapPin, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { IdentificationData } from "./StepIdentification";
import { DetailsData } from "./StepDetails";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

const RECAPTCHA_SITE_KEY = "6LfT8VgsAAAAAOloUkq771fK5j5Ef3NhjasD6NDL";

// Declare global grecaptcha Enterprise type
declare global {
  interface Window {
    grecaptcha: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

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
  const [isRecaptchaReady, setIsRecaptchaReady] = useState(false);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current) return;

    const loadRecaptchaEnterprise = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="recaptcha/enterprise.js"]');
      if (existingScript) {
        if (window.grecaptcha?.enterprise) {
          window.grecaptcha.enterprise.ready(() => {
            setIsRecaptchaReady(true);
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      
      script.onload = () => {
        if (window.grecaptcha?.enterprise) {
          window.grecaptcha.enterprise.ready(() => {
            setIsRecaptchaReady(true);
          });
        }
      };
      
      script.onerror = () => {
        console.error("Failed to load reCAPTCHA Enterprise script");
      };
      
      document.head.appendChild(script);
      scriptLoadedRef.current = true;
    };

    loadRecaptchaEnterprise();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isRecaptchaReady || isGeneratingToken) return;

    setRecaptchaError(null);

    try {
      setIsGeneratingToken(true);
      
      // Execute reCAPTCHA Enterprise and get token
      const token = await window.grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, {
        action: 'submit_complaint'
      });
      
      if (!token) {
        throw new Error("Token não gerado");
      }
      
      onCaptchaChange(token);
      
      // Small delay to ensure state is updated, then submit
      setTimeout(() => {
        onSubmit();
      }, 100);
    } catch (error) {
      console.error("Erro ao executar reCAPTCHA:", error);
      setRecaptchaError("Não foi possível verificar a segurança. Por favor, recarregue a página e tente novamente.");
      onCaptchaChange(null);
    } finally {
      setIsGeneratingToken(false);
    }
  }, [isRecaptchaReady, isGeneratingToken, onCaptchaChange, onSubmit]);

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

      {/* reCAPTCHA error message */}
      {recaptchaError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{recaptchaError}</AlertDescription>
        </Alert>
      )}

      {/* reCAPTCHA Enterprise info */}
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
        <ShieldCheck className="w-4 h-4" />
        <span>Protegido pelo reCAPTCHA Enterprise</span>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2" disabled={isSubmitting || isGeneratingToken}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!isRecaptchaReady || isSubmitting || isGeneratingToken}
          className="gap-2"
        >
          {isSubmitting || isGeneratingToken ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> 
              {isGeneratingToken ? "Verificando..." : "Enviando..."}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Enviar Solicitação
            </>
          )}
        </Button>
      </div>

      {/* reCAPTCHA branding notice */}
      <p className="text-xs text-center text-muted-foreground">
        Este site é protegido pelo reCAPTCHA e as{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
          Políticas de Privacidade
        </a>{" "}
        e{" "}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
          Termos de Serviço
        </a>{" "}
        do Google se aplicam.
      </p>
    </div>
  );
}
