import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MedicineStatusBadge } from './MedicineStatusBadge';
import { Pill, MoreVertical, Calendar, Clock } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';

interface MedicineCardProps {
  medicine: Medicine;
  onEdit?: (medicine: Medicine) => void;
  onDelete?: (id: string) => void;
}

export function MedicineCard({ medicine, onEdit, onDelete }: MedicineCardProps) {
  const navigate = useNavigate();
  const expiryDate = new Date(medicine.expiryDate);
  const isExpired = medicine.status === 'EXPIRED';
  const isRemoved = medicine.status === 'REMOVED';
  const isExpiringSoon = medicine.status === 'EXPIRING_SOON';
  const isActive = medicine.status === 'ACTIVE';

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/medicines/view/${medicine.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group',
        isActive && 'border-green-200',
        isExpired && 'opacity-75 border-red-200',
        isRemoved && 'opacity-50 grayscale',
        isExpiringSoon && 'border-yellow-200'
      )}
      onClick={handleCardClick}
    >
      {/* Medicine Image */}
      {medicine.image && (
        <div className="relative overflow-hidden rounded-t-lg bg-gray-50">
          <img
            src={medicine.image}
            alt={medicine.name}
            className="w-full h-40 object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2">
            <MedicineStatusBadge status={medicine.status} />
          </div>
        </div>
      )}

      <CardHeader className={cn('pb-2', !medicine.image && 'pt-4')}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-primary/10 rounded-full shrink-0">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                {medicine.name}
              </h3>
              {medicine.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {medicine.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Menu */}
          {!isRemoved && (onEdit || onDelete) && (
            <div onClick={handleActionClick}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
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
                    <DropdownMenuItem
                      className="text-red-600 hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white"
                      onClick={() => onDelete(medicine.id)}
                    >
                      Remove
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className={cn(
              'font-medium',
              isExpired && 'text-red-600',
              isExpiringSoon && 'text-yellow-600',
              isActive && 'text-green-600'
            )}>
              {isExpired
                ? `Expired ${formatDistanceToNow(expiryDate)} ago`
                : `Expires ${formatDistanceToNow(expiryDate, { addSuffix: true })}`
              }
            </span>
          </div>
          {medicine.createdAt && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{new Date(medicine.createdAt).toLocaleDateString()}</span>
            </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-72 w-full rounded-lg" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
