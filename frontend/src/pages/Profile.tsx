import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { User, Calendar, Mail, Shield, Settings } from 'lucide-react';
import { format } from 'date-fns';

export function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg text-textSecondary">Profile not available</p>
          </div>
        </div>
      </Layout>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAccountAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in-up">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 border border-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-lg">
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold text-textPrimary mb-2">
                  {user.name}
                </h1>
                <p className="text-lg text-textSecondary flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {user.email}
                </p>
                <p className="text-sm text-textSecondary mt-1">
                  Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Information */}
          <Card className="shadow-soft border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-primary" />
                  <span className="font-medium text-textPrimary">Full Name</span>
                </div>
                <span className="text-textSecondary">{user.name}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-medium text-textPrimary">Email</span>
                </div>
                <span className="text-textSecondary">{user.email}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-medium text-textPrimary">Member Since</span>
                </div>
                <span className="text-textSecondary">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-medium text-textPrimary">Account Age</span>
                </div>
                <Badge variant="secondary" className="px-3 py-1">
                  {getAccountAge(user.createdAt)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="shadow-soft border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <User className="w-5 h-5" />
                Update Profile Information
              </Button>

              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Shield className="w-5 h-5" />
                Change Password
              </Button>

              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Settings className="w-5 h-5" />
                Privacy Settings
              </Button>

              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-textSecondary text-center">
                  More settings coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Summary */}
        <Card className="shadow-soft border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-textPrimary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Account Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-textPrimary mb-2">Activity tracking coming soon</p>
              <p className="text-textSecondary">
                We'll show your recent activity, login history, and usage statistics here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}