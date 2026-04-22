import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicineService } from '@/services/medicine.service';
import type { ListMedicineQuery } from '@/types/api';
import { toast } from 'sonner';

export function useMedicines(params?: ListMedicineQuery) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['medicines', params],
    queryFn: () => medicineService.list(params),
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof medicineService.create>[0]) => medicineService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'], exact: false });
      toast.success('Medicine added successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add medicine');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof medicineService.update>[1] }) =>
      medicineService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'], exact: false });
      toast.success('Medicine updated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update medicine');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => medicineService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'], exact: false });
      toast.success('Medicine removed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove medicine');
    },
  });

  return {
    medicines: data?.items || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
