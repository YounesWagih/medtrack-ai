import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { medicineService } from '@/services/medicine.service';
import type { ExternalMedicineDetails } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { medicineSchema, type MedicineInput } from '@/lib/validations';
import { DateSelect } from '@/components/ui/date-select';

export function MedicineDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<ExternalMedicineDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existsInInventory, setExistsInInventory] = useState(false);
  const [selectedExpiryDate, setSelectedExpiryDate] = useState<Date | undefined>(undefined);

  const {
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<MedicineInput>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      name: '',
      expiryDate: '',
      description: '',
      longDescription: '',
      image: '',
    },
  });

  const parsedDate = selectedExpiryDate;

  useEffect(() => {
    async function loadDetails() {
      if (!slug) return;
      
      setLoading(true);
      try {
        const detailsData = await medicineService.getMedicineDetails(slug);
        setDetails(detailsData);
        
        setValue('name', detailsData.name_en || detailsData.name_ar);
        setValue('description', detailsData.description || '');
        setValue('longDescription', detailsData.longDescription || '');
        setValue('image', detailsData.image || '');

        const exists = await medicineService.checkExists(detailsData.name_en || detailsData.name_ar);
        setExistsInInventory(exists);

        if (exists) {
          setError('name', {
            type: 'manual',
            message: 'This medicine is already in your inventory',
          });
        }
      } catch (error) {
        console.error('Failed to load medicine details:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [slug, setValue, setError]);

  const handleAddToInventory = () => {
    if (!selectedExpiryDate) {
      setError('expiryDate', {
        type: 'manual',
        message: 'Please select an expiry date',
      });
      return;
    }
    
    const data: MedicineInput = {
      name: getValues('name'),
      expiryDate: selectedExpiryDate.toISOString(),
      description: getValues('description'),
      longDescription: getValues('longDescription'),
      image: getValues('image'),
    };
    
    setSubmitting(true);
    medicineService.create(data)
      .then(() => navigate('/medicines'))
      .catch((error) => console.error('Failed to add medicine:', error))
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Medicine not found</p>
        <Button variant="link" onClick={() => navigate('/medicines/add')}>
          Go back to add medicine
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        Back
      </Button>

      <Card>
        <CardContent className="p-6 space-y-6">
          {details.image && (
            <div className="flex justify-center">
              <img
                src={details.image}
                alt={details.name_en || details.name_ar}
                className="max-h-64 object-contain rounded-lg bg-white"
              />
            </div>
          )}

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">{details.name_en || details.name_ar}</h1>
            {details.name_ar && details.name_en && details.name_ar !== details.name_en && (
              <p className="text-lg text-muted-foreground">{details.name_ar}</p>
            )}
          </div>

           {existsInInventory ? (
             <div className="flex items-center gap-2 p-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
               <AlertCircle className="h-5 w-5" />
               <span>This medicine is already in your inventory</span>
             </div>
           ) : (
             <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>

                  <DateSelect
                    value={parsedDate}
                    onChange={(date) => {
                      setSelectedExpiryDate(date)
                      if (date) {
                        setValue('expiryDate', date.toISOString())
                      }
                      clearErrors('expiryDate')
                    }}
                  />
                  {errors.expiryDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.expiryDate.message}</p>
                  )}
                </div>
               <Button
                 onClick={handleAddToInventory}
                 size="lg"
                 disabled={submitting}
                 className="w-full"
               >
                 {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                 <Plus className="mr-2 h-5 w-5" />
                 Add to Inventory
               </Button>
             </div>
           )}

          {details.description && details.description.trim() !== '' && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <div
                className="prose prose-sm max-w-none text-right"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: details.description }}
              />
            </div>
          )}

          {details.longDescription && details.longDescription.trim() !== '' && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">More Information</h2>
              <div
                className="prose prose-sm max-w-none text-right"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: details.longDescription }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <input type="hidden" value={getValues('name')} />
      <input type="hidden" value={getValues('description')} />
      <input type="hidden" value={getValues('longDescription')} />
      <input type="hidden" value={getValues('image')} />
      <input type="hidden" value={getValues('expiryDate')} />
    </div>
  );
}