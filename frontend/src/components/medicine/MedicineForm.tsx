import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, CalendarDays, CheckCircle2 } from 'lucide-react';
import { medicineSchema, type MedicineInput } from '@/lib/validations';
import { medicineService } from '@/services/medicine.service';
import type { ExternalMedicineSearchItem, ExternalMedicineDetails } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DateSelect } from '@/components/ui/date-select';
import { MedicineSearchInput } from './MedicineSearchInput';
import { MedicineDetailsCard } from './MedicineDetailsCard';

interface MedicineFormProps {
  defaultValues?: Partial<MedicineInput>;
  onSubmit: (data: MedicineInput) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function MedicineForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
}: MedicineFormProps) {
  const [selectedMedicine, setSelectedMedicine] = useState<ExternalMedicineSearchItem | null>(null);
  const [medicineDetails, setMedicineDetails] = useState<ExternalMedicineDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showExpiryDate, setShowExpiryDate] = useState(!!defaultValues?.expiryDate);
  const [existsInInventory, setExistsInInventory] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    register,
    formState: { errors },
  } = useForm<MedicineInput>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      expiryDate: '',
      description: undefined,
      longDescription: undefined,
      image: undefined,
      ...defaultValues,
    },
  });

  const expiryDateValue = watch('expiryDate');
  const parsedDate = expiryDateValue ? new Date(expiryDateValue) : undefined;

  useEffect(() => {
    if (defaultValues?.expiryDate) {
      setShowExpiryDate(true);
    }
  }, [defaultValues?.expiryDate]);

  const handleMedicineSelect = async (medicine: ExternalMedicineSearchItem) => {
    setSelectedMedicine(medicine);
    setMedicineDetails(null);
    setExistsInInventory(false);
    setDetailsLoading(true);
    setShowExpiryDate(true);
    clearErrors('name');

    try {
      const [details, exists] = await Promise.all([
        medicineService.getMedicineDetails(medicine.slug),
        medicineService.checkExists(medicine.name_en || medicine.name_ar),
      ]);

      setMedicineDetails(details);
      setExistsInInventory(exists);

      setValue('name', medicine.name_en || medicine.name_ar);
      setValue('description', details.description || '');
      setValue('longDescription', details.longDescription || '');
      setValue('image', details.image || undefined);

      if (exists) {
        setError('name', {
          type: 'manual',
          message: 'This medicine is already in your inventory',
        });
      }
    } catch (error) {
      console.error('Failed to get medicine details:', error);
      setValue('name', medicine.name_en || medicine.name_ar);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {!defaultValues?.name && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Medicine Name</Label>
            <p className="text-sm text-muted-foreground">
              Search and select the product you want to track.
            </p>
          </div>
          {!selectedMedicine ? (
            <MedicineSearchInput
              placeholder="Search for a medicine..."
              onSelect={handleMedicineSelect}
            />
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-border bg-primary-light p-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-textPrimary">{selectedMedicine.name_en || selectedMedicine.name_ar}</p>
                {selectedMedicine.name_ar && selectedMedicine.name_en && (
                  <p className="text-sm text-muted-foreground">{selectedMedicine.name_ar}</p>
                )}
              </div>
            </div>
          )}
          {errors.name && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name.message}
            </p>
          )}
        </div>
      )}

      {(medicineDetails || detailsLoading) && (
        <div className="space-y-4">
          <MedicineDetailsCard details={medicineDetails} isLoading={detailsLoading} />

          {selectedMedicine && existsInInventory && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span>This medicine is already in your inventory</span>
            </div>
          )}
        </div>
      )}

      {showExpiryDate && (
        <div className="rounded-md border border-border bg-surface p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-md bg-primary-light p-2 text-primary">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <Label>Expiry Date</Label>
              <p className="text-sm text-muted-foreground">
                Choose when this item expires so MedTrack AI can show the right status.
              </p>
            </div>
          </div>

          <DateSelect
            value={parsedDate}
            className="flex-wrap"
            onChange={(date) => {
              if (date) {
                setValue('expiryDate', date.toISOString(), { shouldValidate: true, shouldDirty: true })
              }
            }}
          />
          {errors.expiryDate && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.expiryDate.message}
            </p>
          )}
        </div>
      )}

      {/* Hidden inputs to ensure fields are registered with react-hook-form */}
      <input type="hidden" {...register('name')} />
      <input type="hidden" {...register('expiryDate')} />
      <input type="hidden" {...register('description')} />
      <input type="hidden" {...register('longDescription')} />
      <input type="hidden" {...register('image')} />

       <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-1 pt-4">
          <p className="text-sm text-muted-foreground">
            {!selectedMedicine && !defaultValues?.name
              ? 'Select a medicine to continue.'
              : 'Review the details and save it to your inventory.'}
          </p>
          <Button
            type="submit"
            disabled={isLoading || existsInInventory || detailsLoading || (!selectedMedicine && !defaultValues?.name)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
     </form>
  );
}
