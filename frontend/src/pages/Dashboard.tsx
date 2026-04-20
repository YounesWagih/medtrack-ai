import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useMedicines } from '@/hooks/useMedicines';
import { useAuthStore } from '@/stores/auth.store';
import { MedicineStatus } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { medicines, isLoading } = useMedicines({ limit: 100 });

  const activeCount = medicines.filter((m) => m.status === MedicineStatus.ACTIVE).length;
  const expiringSoonCount = medicines.filter((m) => m.status === MedicineStatus.EXPIRING_SOON).length;
  const expiredCount = medicines.filter((m) => m.status === MedicineStatus.EXPIRED).length;

  const recentMedicines = [...medicines]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusBadgeVariant = (status: MedicineStatus) => {
    switch (status) {
      case MedicineStatus.ACTIVE:
        return 'SUCCESS';
      case MedicineStatus.EXPIRING_SOON:
        return 'WARNING';
      case MedicineStatus.EXPIRED:
        return 'DANGER';
      case MedicineStatus.REMOVED:
        return 'MUTED';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-h1">Hello, {user?.name || 'User'}</h1>
          <p className="text-textSecondary mt-1">Welcome back to MedTrack AI</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard title="Active Medicines" value={activeCount} color="green" />
          <StatsCard title="Expiring Soon" value={expiringSoonCount} color="orange" />
          <StatsCard title="Expired" value={expiredCount} color="red" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-h3">Recent Medicines</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-textSecondary">Loading...</div>
            ) : recentMedicines.length === 0 ? (
              <div className="text-center py-8 text-textSecondary">
                No medicines yet. Add your first medicine to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {recentMedicines.map((medicine) => (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-3 rounded-[10px] bg-background border border-border"
                  >
                    <div>
                      <p className="font-medium text-textPrimary">{medicine.name}</p>
                      <p className="text-sm text-textSecondary">
                        Expires: {format(new Date(medicine.expiryDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(medicine.status)}>
                      {medicine.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}