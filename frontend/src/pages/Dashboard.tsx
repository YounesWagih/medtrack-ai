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
      <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
        {/* Hero Section */}
        <div className="rounded-[12px] border border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5 p-5 sm:p-8">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="mb-2 text-2xl font-bold leading-tight text-textPrimary sm:text-4xl">
                Welcome, {user?.name || 'User'}
              </h1>
              <p className="text-sm text-textSecondary sm:text-lg">
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          <StatsCard title="Active Medicines" value={activeCount} color="green" />
          <StatsCard title="Expiring Soon" value={expiringSoonCount} color="orange" />
          <StatsCard title="Expired" value={expiredCount} color="red" />
        </div>

        {/* Recent Medicines */}
        <Card className="shadow-soft border-border">
          <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-textPrimary sm:text-xl">
              <Calendar className="h-5 w-5 shrink-0 text-primary" />
              Recent Medicines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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
                    className="flex min-w-0 flex-col gap-3 rounded-[12px] border border-border bg-surface p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-4 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                      {medicine.image ? (
                        <img
                          src={medicine.image}
                          alt={medicine.name}
                          className="h-12 w-12 shrink-0 rounded-full border-2 border-primary/20 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Pill className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-base font-semibold leading-snug text-textPrimary sm:text-lg">{medicine.name}</p>
                        <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-textSecondary">
                          <Calendar className="h-4 w-4 shrink-0" />
                          Expires: {format(new Date(medicine.expiryDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(medicine.status)}
                      className="w-fit shrink-0 self-start px-3 py-1 text-xs font-medium sm:self-center sm:text-sm"
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
