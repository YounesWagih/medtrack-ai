import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MedicineStatus } from '@/types/api';

interface MedicineFilterProps {
  className?: string;
}

export function MedicineFilter({ className }: MedicineFilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentSortBy = searchParams.get('sortBy') || 'expiryDate';
  const currentSortOrder = searchParams.get('sortOrder') || 'asc';
  const currentStatus = searchParams.get('status') || 'ALL';

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'ALL') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filtering
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-center', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search medicines..."
          value={currentSearch}
          onChange={(e) => updateParam('search', e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2">
        <Select value={currentStatus} onValueChange={(val) => updateParam('status', val)}>
          <SelectTrigger className="w-[140px]">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value={MedicineStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={MedicineStatus.EXPIRING_SOON}>Expiring Soon</SelectItem>
            <SelectItem value={MedicineStatus.EXPIRED}>Expired</SelectItem>
            <SelectItem value={MedicineStatus.REMOVED}>Removed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentSortBy} onValueChange={(val) => updateParam('sortBy', val)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expiryDate">Expiry Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="createdAt">Date Added</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentSortOrder} onValueChange={(val) => updateParam('sortOrder', val)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
