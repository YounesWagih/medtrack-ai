import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { medicineService } from '@/services/medicine.service';
import type { Medicine } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { MedicineStatusBadge } from '@/components/medicine/MedicineStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function MedicineViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);

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
    navigate(`/medicines/edit/${id}`);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Medicine not found</p>
        <Button variant="link" onClick={() => navigate('/medicines')}>
          Go back to medicines
        </Button>
      </div>
    );
  }

  const expiryDate = new Date(medicine.expiryDate);
  const isExpired = medicine.status === 'EXPIRED';
  const isRemoved = medicine.status === 'REMOVED';
  const isExpiringSoon = medicine.status === 'EXPIRING_SOON';
  const isActive = medicine.status === 'ACTIVE';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Medicine Details</h1>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          {medicine.image && (
            <div className="flex justify-center">
              <img
                src={medicine.image}
                alt={medicine.name}
                className="max-h-64 object-contain rounded-lg bg-white"
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{medicine.name}</h2>
                <MedicineStatusBadge status={medicine.status} />
              </div>

              {!isRemoved && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                <p className={cn(
                  'text-lg font-semibold',
                  isExpired && 'text-red-600',
                  isExpiringSoon && 'text-yellow-600',
                  isActive && 'text-green-600'
                )}>
                  {expiryDate.toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(expiryDate, { addSuffix: true })}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Added</p>
                <p className="text-lg font-semibold">
                  {new Date(medicine.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(medicine.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {medicine.description && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{medicine.description}</p>
              </div>
            )}

            {medicine.longDescription && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Additional Information</p>
                <div
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: medicine.longDescription }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}