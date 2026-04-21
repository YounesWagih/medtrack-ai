import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

interface StatsCardProps {
  title: string;
  value: number;
  color: 'green' | 'orange' | 'red';
}

const colorConfig = {
  green: {
    bg: 'bg-success/10',
    text: 'text-success',
  },
  orange: {
    bg: 'bg-warning/10',
    text: 'text-warning',
  },
  red: {
    bg: 'bg-danger/10',
    text: 'text-danger',
  },
};

export function StatsCard({ title, value, color }: StatsCardProps) {
  const config = colorConfig[color];
  const animatedValue = useCountUp(value, 700);

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div
          className={cn(
            'h-24 w-24 rounded-full flex items-center justify-center',
            config.bg
          )}
        >
          <span className={cn('text-4xl font-bold', config.text)}>
            {animatedValue}
          </span>
        </div>
        <p className="text-sm font-medium text-textSecondary">{title}</p>
      </div>
    </Card>
  );
}