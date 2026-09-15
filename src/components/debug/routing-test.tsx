"use client";

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PUBLIC_ENV } from '../../lib/public-env';
export function RoutingTest() {
  const router = useRouter();
  const pathname = usePathname();

  if (PUBLIC_ENV.NODE_ENV !== 'development') {
    return null;
  }

  const testRoutes = [
    { path: '/', label: 'Home' },
    { path: '/home-simple', label: 'Simple Home' },
    { path: '/projects', label: 'Projects' },
    { path: '/edit/new', label: 'New Project' },
    { path: '/auth/login', label: 'Login' },
    { path: '/auth/register', label: 'Register' },
  ];

  return (
    <Card className="fixed top-4 right-4 w-64 z-50">
      <CardHeader>
        <CardTitle className="text-sm">Routing Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">
          Current: {pathname}
        </div>
        {testRoutes.map((route) => (
          <Button
            key={route.path}
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              console.log('🔍 Test navigation to:', route.path);
              router.push(route.path);
            }}
          >
            {route.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
