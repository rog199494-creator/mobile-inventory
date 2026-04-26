import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Barcode, 
  Camera, 
  ClipboardText, 
  CheckCircle,
  DeviceMobile
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ProcessStep {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    icon: <ClipboardText size={32} weight="duotone" />,
    title: 'Загрузите список товаров',
    description: 'Импортируйте Excel файл с учётными остатками из вашей системы',
    badge: 'Шаг 1'
  },
  {
    icon: <DeviceMobile size={32} weight="duotone" />,
    title: 'Откройте сессию',
    description: 'Запустите приложение и выберите активную сессию инвентаризации',
    badge: 'Шаг 2'
  },
  {
    icon: <Camera size={32} weight="duotone" />,
    title: 'Активируйте камеру',
    description: 'Нажмите кнопку "Сканировать штрихкод" для включения камеры',
    badge: 'Шаг 3'
  },
  {
    icon: <Barcode size={32} weight="duotone" />,
    title: 'Сканируйте товары',
    description: 'Наведите камеру на штрихкод. Система автоматически распознает и запишет количество',
    badge: 'Шаг 4'
  },
  {
    icon: <CheckCircle size={32} weight="duotone" />,
    title: 'Получите отчёт',
    description: 'Просмотрите расхождения и выгрузите итоговый отчёт',
    badge: 'Шаг 5'
  }
]

export function ProcessGuide() {
  return (
    <div className="w-full">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Как это работает</h2>
        <p className="text-muted-foreground text-base sm:text-lg">
          Простой процесс от загрузки данных до получения отчёта
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {PROCESS_STEPS.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card className="p-4 sm:p-6 h-full hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </div>
                {step.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {step.badge}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
