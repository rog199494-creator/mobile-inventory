import { CheckCircle, Circle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  label: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isUpcoming = index > currentStep

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    {
                      "bg-success border-success text-success-foreground": isCompleted,
                      "bg-primary border-primary text-primary-foreground animate-pulse": isCurrent,
                      "bg-background border-border text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle size={20} weight="fill" />
                  ) : (
                    <Circle size={20} weight={isCurrent ? "fill" : "regular"} />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn("text-sm font-medium", {
                      "text-success": isCompleted,
                      "text-primary font-semibold": isCurrent,
                      "text-muted-foreground": isUpcoming,
                    })}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground mt-0.5 max-w-[100px] hidden md:block">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-8">
                  <div
                    className={cn("h-full transition-all", {
                      "bg-success": isCompleted,
                      "bg-border": !isCompleted,
                    })}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
