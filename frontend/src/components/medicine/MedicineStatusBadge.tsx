import { Badge } from '@/components/ui/badge';
import { MedicineStatus } from '@/types/api';

interface MedicineStatusBadgeProps {
  status: MedicineStatus;
  className?: string;
}

const statusVariant: Record<MedicineStatus, 'SUCCESS' | 'WARNING' | 'DANGER' | 'MUTED'> = {
  ACTIVE: 'SUCCESS',
  EXPIRING_SOON: 'WARNING',
  EXPIRED: 'DANGER',
  REMOVED: 'MUTED',
};

export function MedicineStatusBadge({ status, className }: MedicineStatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status]} className={className}>
      {status.replace('_', ' ')}
    </Badge>
  );
}