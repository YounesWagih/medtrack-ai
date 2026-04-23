import { Layout } from '@/components/layout/Layout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useMedicines } from '@/hooks/useMedicines';
import { useAuthStore } from '@/stores/auth.store';
import { MedicineStatus } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, Pill } from 'lucide-react';

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
      <div className="space-y-8 animate-fade-in-up">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-textPrimary mb-2">
                Welcome back, {user?.name || 'User'}
              </h1>
              <p className="text-lg text-textSecondary">
                Keep track of your medications with MedTrack AI
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Pill className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Active Medicines" value={activeCount} color="green" />
          <StatsCard title="Expiring Soon" value={expiringSoonCount} color="orange" />
          <StatsCard title="Expired" value={expiredCount} color="red" />
        </div>

        {/* Recent Medicines */}
        <Card className="shadow-soft border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Medicines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-textSecondary">
                <div className="animate-pulse">Loading your medicines...</div>
              </div>
            ) : recentMedicines.length === 0 ? (
              <div className="text-center py-12 text-textSecondary">
                <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">No medicines yet</p>
                <p>Add your first medicine to get started tracking</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMedicines.map((medicine, index) => (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border hover:shadow-md transition-all duration-200 hover:border-primary/20 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center space-x-4">
                      {medicine.image ? (
                        <img
                          src={medicine.image}
                          alt={medicine.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Pill className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-textPrimary text-lg">{medicine.name}</p>
                        <p className="text-sm text-textSecondary flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Expires: {format(new Date(medicine.expiryDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(medicine.status)}
                      className="px-3 py-1 text-sm font-medium"
                    >
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