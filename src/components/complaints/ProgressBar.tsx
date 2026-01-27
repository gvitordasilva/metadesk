import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { label: "Identificação", description: "Como deseja se identificar" },
  { label: "Detalhes", description: "Informações da ocorrência" },
  { label: "Anexos", description: "Documentos e fotos" },
  { label: "Confirmação", description: "Revisar e enviar" },
];

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const percentage = ((currentStep) / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      {/* Progress bar visual */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="absolute h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Steps indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={step.label}
              className={`flex flex-col items-center flex-1 ${
                index < steps.length - 1 ? "relative" : ""
              }`}
            >
              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>

              {/* Step label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
