import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { medicineService } from '@/services/medicine.service';
import type { Medicine } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Edit, Trash2, Pill, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { MedicineStatusBadge } from '@/components/medicine/MedicineStatusBadge';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MedicineForm } from '@/components/medicine/MedicineForm';
import { useMedicines } from '@/hooks/useMedicines';
import type { MedicineInput } from '@/lib/validations';
import { toast } from 'sonner';

export function MedicineViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { update, isUpdating } = useMedicines();

  useEffect(() => {
    async function loadMedicine() {
      if (!id) return;

      setLoading(true);
      try {
        const medicineData = await medicineService.get(id);
        setMedicine(medicineData);
      } catch (error) {
        console.error('Failed to load medicine:', error);
      } finally {
        setLoading(false);
      }
    }

    loadMedicine();
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleUpdate = async (data: MedicineInput) => {
    if (!medicine) return;

    try {
      const updatedMedicine = await update({ id: medicine.id, data });
      setMedicine(updatedMedicine);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update medicine:', error);
    }
  };

  const handleDelete = async () => {
    if (!medicine) return;

    if (confirm('Are you sure you want to remove this medicine?')) {
      try {
        await medicineService.remove(medicine.id);
        navigate('/medicines');
      } catch (error) {
        console.error('Failed to delete medicine:', error);
      }
    }
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

  if (!medicine) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-16 space-y-6">
          <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mx-auto">
            <Pill className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-textPrimary mb-2">Medicine not found</h2>
            <p className="text-muted-foreground">The medicine you're looking for doesn't exist or has been removed.</p>
          </div>
          <Button onClick={() => navigate('/medicines')} className="bg-primary hover:bg-primary/90">
            Back to Medicines
          </Button>
        </div>
      </div>
    );
  }

  const expiryDate = new Date(medicine.expiryDate);
  const isExpired = medicine.status === 'EXPIRED';
  const isRemoved = medicine.status === 'REMOVED';
  const isExpiringSoon = medicine.status === 'EXPIRING_SOON';
  const isActive = medicine.status === 'ACTIVE';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-primary/10">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-textPrimary">Medicine Details</h1>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/10 shadow-soft">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex-shrink-0">
            {medicine.image ? (
              <img
                src={medicine.image}
                alt={medicine.name}
                className="w-40 h-40 md:w-52 md:h-52 rounded-2xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 md:w-52 md:h-52 bg-primary/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Pill className="w-20 h-20 text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-textPrimary mb-2">{medicine.name}</h2>
                <MedicineStatusBadge status={medicine.status} className="text-base px-4 py-2" />
              </div>

              {!isRemoved && (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    className="hover:bg-primary/5 hover:border-primary/30 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="text-danger hover:text-danger hover:bg-danger/5 border-danger/30 hover:border-danger/50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {medicine.description && (
              <p className="text-lg text-textSecondary leading-relaxed">{medicine.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expiry Information */}
        <Card className="shadow-soft border-border hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Expiry Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-3 h-3 rounded-full',
                isExpired && 'bg-danger',
                isExpiringSoon && 'bg-warning',
                isActive && 'bg-success'
              )} />
              <div>
                <p className={cn(
                  'text-2xl font-bold',
                  isExpired && 'text-danger',
                  isExpiringSoon && 'text-warning',
                  isActive && 'text-success'
                )}>
                  {format(expiryDate, 'MMM dd, yyyy')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(expiryDate, { addSuffix: true })}
                </p>
              </div>
            </div>

            {isExpired && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 rounded-lg border border-danger/20">
                <AlertTriangle className="w-5 h-5 text-danger" />
                <p className="text-sm text-danger font-medium">This medicine has expired</p>
              </div>
            )}

            {isExpiringSoon && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <p className="text-sm text-warning font-medium">Expires soon - time to replace</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking Information */}
        <Card className="shadow-soft border-border hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Tracking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Added to inventory</p>
              <p className="text-xl font-semibold text-textPrimary">
                {format(new Date(medicine.createdAt), 'MMM dd, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(medicine.createdAt), { addSuffix: true })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      {medicine.longDescription && (
        <Card className="shadow-soft border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-textPrimary">
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-sm prose prose-sm max-w-none text-textSecondary leading-relaxed"
              dangerouslySetInnerHTML={{ __html: medicine.longDescription }}
            />
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold text-textPrimary flex items-center gap-2">
              <Edit className="w-6 h-6 text-primary" />
              Edit Medicine
            </DialogTitle>
          </DialogHeader>
          {medicine && (
            <MedicineForm
              defaultValues={{
                name: medicine.name,
                expiryDate: new Date(medicine.expiryDate).toISOString().split('T')[0],
                description: medicine.description || '',
                longDescription: medicine.longDescription || '',
                image: medicine.image || '',
              }}
              onSubmit={handleUpdate}
              isLoading={isUpdating}
              submitLabel="Update Medicine"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}