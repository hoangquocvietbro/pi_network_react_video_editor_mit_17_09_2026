"use client";

import { useState } from 'react';
import { useAuthStore } from '../../store/use-auth-store';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import Link from 'next/link';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo = '/' }: LoginFormProps) {
  const { login, error } = useAuthStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePiLogin = async () => {
    setIsSubmitting(true);
    try {
      await login();
      toast.success('Login successful!');
      onSuccess?.();

      // Small delay to ensure state is updated
      setTimeout(() => {
        router.push(redirectTo);
      }, 100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-border/70 bg-card/90 backdrop-blur-md shadow-xl">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome to VEditor</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-muted-foreground">
          Sign in with your Pi Network account to access the video studio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-center">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            onClick={handlePiLogin}
            className="w-full h-11 text-sm font-semibold gap-2 shadow-md shadow-primary/20"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating with Pi SDK...
              </>
            ) : (
              'Sign In with Pi Network'
            )}
          </Button>

          {/* Legal Compliance Notice */}
          <div className="pt-2 text-[11px] text-muted-foreground leading-normal space-y-1">
            <p>
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </Link>.
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Non-custodial &bull; We never ask for your 24-word wallet passphrase.
            </p>
          </div>

          {/* Bypass Button for Local Testing without Pi Browser (Only in Development Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="pt-2 border-t border-border/40">
              <Button
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await useAuthStore.getState().loginBypass();
                    toast.success('Bypass login successful (Developer Mode)!');
                    onSuccess?.();
                    setTimeout(() => {
                      router.push(redirectTo);
                    }, 100);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Bypass failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                variant="outline"
                className="w-full border-dashed border-border/80 hover:bg-muted text-xs text-muted-foreground h-8"
                size="sm"
                disabled={isSubmitting}
              >
                Bypass Login (Developer Test Mode)
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
