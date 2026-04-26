import { CheckCircle, Circle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  label: string
  description?: string
  mobileLabel?: string
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
              <div className="flex flex-col items-center min-w-0">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all shrink-0",
                    {
                      "bg-success border-success text-success-foreground": isCompleted,
                      "bg-primary border-primary text-primary-foreground animate-pulse": isCurrent,
                      "bg-background border-border text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle size={16} weight="fill" className="sm:w-5 sm:h-5" />
                  ) : (
                    <Circle size={16} weight={isCurrent ? "fill" : "regular"} className="sm:w-5 sm:h-5" />
                  )}
                </div>
                <div className="mt-1 sm:mt-2 text-center min-w-0 w-full">
                  <div
                    className={cn("text-[10px] sm:text-sm font-medium leading-tight truncate px-0.5", {
                      "text-success": isCompleted,
                      "text-primary font-semibold": isCurrent,
                      "text-muted-foreground": isUpcoming,
                    })}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.mobileLabel || step.label}</span>
                  </div>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 sm:mx-2 mb-6 sm:mb-8 min-w-[8px]">
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
