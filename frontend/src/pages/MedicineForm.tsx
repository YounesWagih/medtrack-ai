import { useParams } from 'react-router-dom';
import { MedicineForm } from '@/components/medicine/MedicineForm';
import { medicineService } from '@/services/medicine.service';
import { toast } from 'sonner';

export function MedicineFormPage() {
  const { id } = useParams<{ id: string }>();

  const onSubmit = async (data: { name: string; expiryDate: string; description?: string; longDescription?: string; image?: string }) => {
    try {
      if (id) {
        await medicineService.update(id, data);
        toast.success('Medicine updated successfully');
      } else {
        await medicineService.create(data);
        toast.success('Medicine added successfully');
      }
    } catch (error) {
      console.error('Failed to save medicine:', error);
      toast.error('Failed to save medicine');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Add Medicine</h1>
      <div className="max-w-2xl">
        <MedicineForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}