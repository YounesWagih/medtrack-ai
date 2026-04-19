import { formatDistanceToNow } from 'date-fns';
import { Pill, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedicineStatusBadge } from './MedicineStatusBadge';
import { cn } from '@/lib/utils';
import type { Medicine } from '@/types/api';

interface MedicineCardProps {
  medicine: Medicine;
  onEdit?: (medicine: Medicine) => void;
  onDelete?: (id: string) => void;
}

export function MedicineCard({ medicine, onEdit, onDelete }: MedicineCardProps) {
  const expiryDate = new Date(medicine.expiryDate);
  const isExpired = medicine.status === 'EXPIRED';
  const isRemoved = medicine.status === 'REMOVED';

  return (
    <Card className={cn('relative', isExpired && 'opacity-75', isRemoved && 'opacity-50 grayscale')}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg leading-none">{medicine.name}</h3>
          </div>
          <MedicineStatusBadge status={medicine.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">Expiry:</span>{' '}
            {expiryDate.toLocaleDateString()}
            {' ('}
            {formatDistanceToNow(expiryDate, { addSuffix: true })}
            {')'}
          </p>
          {medicine.createdAt && (
            <p>
              <span className="font-medium">Added:</span>{' '}
              {new Date(medicine.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end gap-2">
        {onEdit && !isRemoved && (
          <Button variant="outline" size="sm" onClick={() => onEdit(medicine)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        )}
        {onDelete && !isRemoved && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(medicine.id)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
