import { FileText, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type Channel = 'text' | 'voice';

interface StepChannelSelectionProps {
  onSelect: (channel: Channel) => void;
}

export function StepChannelSelection({ onSelect }: StepChannelSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Como deseja fazer sua manifestação?
        </h2>
        <p className="text-muted-foreground">
          Escolha a forma mais confortável para você
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <button
          onClick={() => onSelect('text')}
          className={cn(
            "group relative flex flex-col items-center p-8 rounded-xl border-2 border-border",
            "bg-card hover:bg-accent/50 hover:border-primary/50",
            "transition-all duration-200 cursor-pointer"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Formulário Escrito
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Preencha o formulário passo a passo com todas as informações
          </p>
        </button>

        <button
          onClick={() => onSelect('voice')}
          className={cn(
            "group relative flex flex-col items-center p-8 rounded-xl border-2 border-border",
            "bg-card hover:bg-accent/50 hover:border-primary/50",
            "transition-all duration-200 cursor-pointer"
          )}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Mic className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Atendimento por Voz
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            Converse com nossa IA por voz e relate sua manifestação
          </p>
          <span className="absolute top-3 right-3 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            Novo
          </span>
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Ambas as opções garantem sigilo e geram protocolo de acompanhamento
      </p>
    </div>
  );
}
