import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedicineStatusBadge } from './MedicineStatusBadge';
import { Pill, MoreVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { Medicine } from '@/types/api';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
          <div className="flex items-center gap-2">
            <MedicineStatusBadge status={medicine.status} />
            {!isRemoved && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(medicine)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(medicine.id)}>
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
    </Card>
  );
}

interface MedicineListProps {
  medicines: Medicine[];
  isLoading: boolean;
  onEdit?: (medicine: Medicine) => void;
  onDelete?: (id: string) => void;
}

export function MedicineList({ medicines, isLoading, onEdit, onDelete }: MedicineListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (medicines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Pill className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No medicines found</p>
        <p className="text-sm">Add your first medicine to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {medicines.map((medicine) => (
        <MedicineCard
          key={medicine.id}
          medicine={medicine}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
