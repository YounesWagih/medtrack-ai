import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { Pill, Clock, AlertTriangle } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  color: 'green' | 'orange' | 'red';
}

const colorConfig = {
  green: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
  orange: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
  },
};

const iconMap = {
  green: Pill,
  orange: Clock,
  red: AlertTriangle,
};

export function StatsCard({ title, value, color }: StatsCardProps) {
  const config = colorConfig[color];
  const animatedValue = useCountUp(value, 700);
  const IconComponent = iconMap[color];

  return (
    <Card className={cn(
      'p-6 border-2 transition-all duration-300 hover:shadow-lg hover:scale-105',
      config.bg,
      config.border
    )}>
      <div className="flex items-center space-x-4">
        <div className={cn(
          'p-3 rounded-xl',
          config.iconBg
        )}>
          <IconComponent className={cn('h-8 w-8', config.icon)} />
        </div>
        <div className="flex-1">
          <p className="text-3xl font-bold text-textPrimary mb-1">
            {animatedValue}
          </p>
          <p className={cn('text-sm font-medium', config.text)}>{title}</p>
        </div>
      </div>
    </Card>
  );
}