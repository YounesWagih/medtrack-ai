import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  color: 'green' | 'orange' | 'red';
}

export function StatsCard({ title, value, color }: StatsCardProps) {
  const colorClasses = {
    green: {
      bg: 'bg-success/10',
      text: 'text-success',
      icon: 'bg-success/20',
    },
    orange: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      icon: 'bg-warning/20',
    },
    red: {
      bg: 'bg-danger/10',
      text: 'text-danger',
      icon: 'bg-danger/20',
    },
  };

  const colors = colorClasses[color];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-textSecondary">{title}</p>
          <p className={cn('text-3xl font-bold mt-1', colors.text)}>{value}</p>
        </div>
        <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', colors.icon)}>
          <span className={cn('text-xl font-bold', colors.text)}>{value}</span>
        </div>
      </div>
    </Card>
  );
}