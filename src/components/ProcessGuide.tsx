import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Barcode, 
  Camera, 
  ClipboardText, 
  CheckCircle,
  Lightbulb,
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
    description: 'Импортируйте Excel файл с учётными остатками из вашей системы (1С, МойСклад или вручную)',
    badge: 'Шаг 1'
  },
  {
    icon: <DeviceMobile size={32} weight="duotone" />,
    title: 'Откройте сессию на телефоне',
    description: 'Запустите приложение в Telegram и выберите активную сессию инвентаризации',
    badge: 'Шаг 2'
  },
  {
    icon: <Camera size={32} weight="duotone" />,
    title: 'Активируйте камеру',
    description: 'Включите камеру для сканирования. Фонарик автоматически включится при плохом освещении',
    badge: 'Шаг 3'
  },
  {
    icon: <Lightbulb size={32} weight="duotone" />,
    title: 'Настройте освещение',
    description: 'Выберите режим фонарика: Авто (по уровню света), Всегда включён или Выключен',
    badge: 'Шаг 4'
  },
  {
    icon: <Barcode size={32} weight="duotone" />,
    title: 'Сканируйте товары',
    description: 'Наведите камеру на штрихкод. Система автоматически распознает и запишет количество. Работает без интернета!',
    badge: 'Шаг 5'
  },
  {
    icon: <CheckCircle size={32} weight="duotone" />,
    title: 'Получите отчёт',
    description: 'Просмотрите расхождения (недостачи, излишки) и выгрузите итоговый Excel для бухгалтерии',
    badge: 'Шаг 6'
  }
]

export function ProcessGuide() {
  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Как это работает</h2>
        <p className="text-muted-foreground text-lg">
          Простой процесс от загрузки данных до получения отчёта
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROCESS_STEPS.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card className="p-6 h-full hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </div>
                {step.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {step.badge}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 p-6 bg-accent/5 border border-accent/20 rounded-lg">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb size={20} className="text-accent" weight="fill" />
          </div>
          <div>
            <h4 className="font-semibold mb-1">Автоматическое управление фонариком</h4>
            <p className="text-sm text-muted-foreground">
              Система измеряет уровень освещённости в реальном времени. При уровне ниже 50% фонарик автоматически включается для лучшего распознавания штрихкодов. Вы также можете вручную управлять фонариком через выпадающее меню.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
