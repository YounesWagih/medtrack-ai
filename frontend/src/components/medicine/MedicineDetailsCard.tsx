import { Loader2 } from 'lucide-react';
import type { ExternalMedicineDetails } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MedicineDetailsCardProps {
  details: ExternalMedicineDetails | null;
  isLoading?: boolean;
}

export function MedicineDetailsCard({ details, isLoading = false }: MedicineDetailsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {details.image && (
          <div className="flex justify-center">
            <img
              src={details.image}
              alt={details.name_en || details.name_ar}
              className="max-h-48 object-contain rounded-lg bg-white"
            />
          </div>
        )}

        <div className="space-y-2 text-center">
          <h3 className="text-xl font-semibold">{details.name_en || details.name_ar}</h3>
          {details.name_ar && details.name_en && details.name_ar !== details.name_en && (
            <p className="text-lg text-muted-foreground">{details.name_ar}</p>
          )}
        </div>

         {details.description && details.description.trim() !== '' && (
           <div
             className="prose prose-sm max-w-none text-right"
             dir="rtl"
             dangerouslySetInnerHTML={{ __html: details.description }}
           />
         )}

         {details.longDescription && details.longDescription.trim() !== '' && (
           <div
             className="prose prose-sm max-w-none text-right"
             dir="rtl"
             dangerouslySetInnerHTML={{ __html: details.longDescription }}
           />
         )}

         <div className="mt-4 text-center">
           <Button
             onClick={() => window.location.reload()}
             variant="outline"
             size="sm"
           >
             Refresh
           </Button>
         </div>
      </CardContent>
    </Card>
  );
}