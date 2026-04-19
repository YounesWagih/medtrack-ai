import { Badge } from '@/components/ui/badge';
import { MedicineStatus } from '@/types/api';
import { cn } from '@/lib/utils';

interface MedicineStatusBadgeProps {
  status: MedicineStatus;
  className?: string;
}

const statusColors: Record<MedicineStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  EXPIRING_SOON: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  REMOVED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function MedicineStatusBadge({ status, className }: MedicineStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusColors[status], className)}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
