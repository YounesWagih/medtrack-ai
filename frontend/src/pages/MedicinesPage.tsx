import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { MedicineList } from '@/components/medicine/MedicineList';
import { MedicineFilter } from '@/components/medicine/MedicineFilter';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MedicineForm } from '@/components/medicine/MedicineForm';
import { useMedicines } from '@/hooks/useMedicines';
import type { Medicine, MedicineStatus } from '@/types/api';
import type { MedicineInput } from '@/lib/validations';
import { cleanMedicineInput } from '@/lib/utils';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

export function MedicinesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);

  const page = parseInt(searchParams.get('page') || '1');

  const params = {
    page,
    limit: ITEMS_PER_PAGE,
    status: searchParams.get('status') as MedicineStatus | 'ALL' | undefined,
    sortBy: searchParams.get('sortBy') as 'name' | 'expiryDate' | 'createdAt' | undefined,
    sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' | undefined,
    search: searchParams.get('search') || undefined,
  };

  const { medicines, totalPages, isLoading, create, update, remove, isCreating, isUpdating, isRemoving } = useMedicines(params);

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const handleAdd = async (data: MedicineInput) => {
    await create(cleanMedicineInput(data));
    setIsAddOpen(false);
  };

  const handleEdit = async (data: MedicineInput) => {
    if (!editingMedicine) {
      return;
    }
    await update({ id: editingMedicine.id, data: cleanMedicineInput(data) });
    setEditingMedicine(null);
  };

  const handleDelete = async () => {
    if (!deletingMedicine) return;

    await remove(deletingMedicine.id);
    setDeletingMedicine(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-h1">Medicines</h1>
          <Button onClick={() => setIsAddOpen(true)}>
            Add Medicine
          </Button>
        </div>

        <MedicineFilter />

        <MedicineList
          medicines={medicines}
          isLoading={isLoading}
          onEdit={setEditingMedicine}
          onDelete={(id) => {
            const medicine = medicines.find((item) => item.id === id);
            if (medicine) setDeletingMedicine(medicine);
          }}
        />

        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                  </PaginationItem>
                )}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={pageNum === page}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {page < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(page + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Medicine</DialogTitle>
          </DialogHeader>
          <MedicineForm
            onSubmit={handleAdd}
            isLoading={isCreating}
            submitLabel="Save to Inventory"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMedicine} onOpenChange={(open) => !open && setEditingMedicine(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
          </DialogHeader>
          {editingMedicine && (
            <MedicineForm
              defaultValues={{
                name: editingMedicine.name,
                expiryDate: new Date(editingMedicine.expiryDate).toISOString().split('T')[0],
                description: editingMedicine.description || '',
                longDescription: editingMedicine.longDescription || '',
                image: editingMedicine.image || '',
              }}
              onSubmit={handleEdit}
              isLoading={isUpdating}
              submitLabel="Update Medicine"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingMedicine} onOpenChange={(open) => !open && setDeletingMedicine(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Medicine</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deletingMedicine?.name} from your inventory?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingMedicine(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isRemoving}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
