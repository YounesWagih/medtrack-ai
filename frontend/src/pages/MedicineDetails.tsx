import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { medicineService } from '@/services/medicine.service';
import type { ExternalMedicineDetails } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, AlertCircle, ArrowLeft, Pill, Info, CheckCircle, XCircle } from 'lucide-react';
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Pill className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-textPrimary">Loading medicine details...</p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16 space-y-6">
          <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <Pill className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-textPrimary mb-2">Medicine Not Found</h2>
            <p className="text-muted-foreground">The medicine details you're looking for are not available.</p>
          </div>
          <Button onClick={() => navigate('/medicines/add')} className="bg-primary hover:bg-primary/90">
            Back to Add Medicine
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/10">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-textPrimary">Add Medicine to Inventory</h1>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/10 shadow-soft">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex-shrink-0">
            {details.image ? (
              <img
                src={details.image}
                alt={details.name_en || details.name_ar}
                className="w-40 h-40 md:w-52 md:h-52 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 md:w-52 md:h-52 bg-primary/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Pill className="w-20 h-20 text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-textPrimary mb-2">{details.name_en || details.name_ar}</h2>
              {details.name_ar && details.name_en && details.name_ar !== details.name_en && (
                <p className="text-xl text-textSecondary">{details.name_ar}</p>
              )}
            </div>

            {existsInInventory ? (
              <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-xl border border-warning/20">
                <XCircle className="w-6 h-6 text-warning flex-shrink-0" />
                <div>
                  <p className="font-semibold text-warning">Already in Inventory</p>
                  <p className="text-sm text-warning/80">This medicine is already tracked in your inventory</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-success/10 rounded-xl border border-success/20">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />
                <div>
                  <p className="font-semibold text-success">Ready to Add</p>
                  <p className="text-sm text-success/80">Add this medicine to your inventory with an expiry date</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add to Inventory Form */}
      {!existsInInventory && (
        <Card className="shadow-soft border-border">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add to Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Expiry Date *</Label>
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
                <div className="flex items-center gap-2 p-3 bg-danger/10 rounded-lg border border-danger/20">
                  <AlertCircle className="w-4 h-4 text-danger" />
                  <p className="text-sm text-danger">{errors.expiryDate.message}</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleAddToInventory}
              size="lg"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-5 w-5" />
              )}
              {submitting ? 'Adding to Inventory...' : 'Add to Inventory'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Medicine Information */}
      <div className="space-y-6">
        {details.description && details.description.trim() !== '' && (
          <Card className="shadow-soft border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-sm prose prose-sm max-w-none text-textSecondary leading-relaxed text-right"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: details.description }}
              />
            </CardContent>
          </Card>
        )}

        {details.longDescription && details.longDescription.trim() !== '' && (
          <Card className="shadow-soft border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="text-sm prose prose-sm max-w-none text-textSecondary leading-relaxed text-right"
                dir="rtl"
                dangerouslySetInnerHTML={{ __html: details.longDescription }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <input type="hidden" value={getValues('name')} />
      <input type="hidden" value={getValues('description')} />
      <input type="hidden" value={getValues('longDescription')} />
      <input type="hidden" value={getValues('image')} />
      <input type="hidden" value={getValues('expiryDate')} />
    </div>
  );
}