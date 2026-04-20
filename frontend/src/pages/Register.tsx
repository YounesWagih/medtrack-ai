import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setRegisterError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      setRegisterError(message);
      toast.error(message);
    }
  };

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-[400px]">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xl font-bold">M</span>
            </div>
          </div>
          <CardTitle className="text-h2">Create an account</CardTitle>
          <CardDescription className="text-textSecondary">
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-4">
            {registerError && (
              <div className="p-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-[10px]">
                {registerError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-textPrimary font-medium">Full name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
              />
              {errors.name && (
                <p className="text-sm text-danger">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-textPrimary font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-danger">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-textPrimary font-medium">Password</Label>
              <div className="relative">
                 <Input
                   id="password"
                   type={showPassword ? 'text' : 'password'}
                   placeholder="Enter your password"
                   {...register('password')}
                   aria-invalid={errors.password ? 'true' : 'false'}
                 />
                 <Button
                   type="button"
                   variant="ghost"
                   size="icon"
                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                   onClick={() => setShowPassword(!showPassword)}
                   tabIndex={-1}
                 >
                   {showPassword ? (
                     <EyeOff className="h-4 w-4 text-muted-foreground" />
                   ) : (
                     <Eye className="h-4 w-4 text-muted-foreground" />
                   )}
                 </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-danger">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-textPrimary font-medium">Confirm Password</Label>
              <div className="relative">
                 <Input
                   id="confirmPassword"
                   type={showConfirmPassword ? 'text' : 'password'}
                   placeholder="Confirm your password"
                   {...register('confirmPassword')}
                   aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                 />
                 <Button
                   type="button"
                   variant="ghost"
                   size="icon"
                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                   tabIndex={-1}
                 >
                   {showConfirmPassword ? (
                     <EyeOff className="h-4 w-4 text-muted-foreground" />
                   ) : (
                     <Eye className="h-4 w-4 text-muted-foreground" />
                   )}
                 </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-danger">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
            <p className="text-sm text-center text-textSecondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}