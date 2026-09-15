"use client";

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogoIcons } from '../shared/logos';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/use-auth-store';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, _hasCheckedAuth } = useAuthStore() as any;

  // Redirect to projects if already logged in
  useEffect(() => {
    if (_hasCheckedAuth && isAuthenticated && !isLoading) {
      router.push('/projects');
    }
  }, [_hasCheckedAuth, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      {/* Header - matching home/projects style */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <LogoIcons.scenify className="h-8" />
            <span className="font-bold text-lg">VEditor</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary/5 flex-col justify-center items-center p-12">
          <div className="max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <LogoIcons.scenify />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Welcome to VEditor</h1>
              <p className="text-lg text-muted-foreground">
                Create amazing videos with our professional editing tools
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold">🎬</span>
                </div>
                <h3 className="font-semibold">Multi-track Editing</h3>
                <p className="text-sm text-muted-foreground">
                  Edit multiple video and audio tracks
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold">⚡</span>
                </div>
                <h3 className="font-semibold">Real-time Preview</h3>
                <p className="text-sm text-muted-foreground">
                  See changes instantly as you edit
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold">🎨</span>
                </div>
                <h3 className="font-semibold">Rich Effects</h3>
                <p className="text-sm text-muted-foreground">
                  Apply filters, transitions, and more
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-primary font-bold">📤</span>
                </div>
                <h3 className="font-semibold">Export Options</h3>
                <p className="text-sm text-muted-foreground">
                  Multiple formats and resolutions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <LogoIcons.scenify />
            </div>

            {/* Title and Subtitle */}
            {(title || subtitle) && (
              <div className="text-center space-y-2">
                {title && <h2 className="text-2xl font-bold">{title}</h2>}
                {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
              </div>
            )}

            {/* Auth Form */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
