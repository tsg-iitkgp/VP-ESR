import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, LogIn, KeyRound } from 'lucide-react';

export default function DevLogin() {
  const { devLogin } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleLogin = async (role: 'admin' | 'viewer') => {
    setLoadingRole(role);
    try {
      const ok = await devLogin(role);
      if (ok) {
        navigate('/');
      } else {
        alert('Failed to sign in. Make sure backend is running.');
      }
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">VP-ESR Development Portal</CardTitle>
          <CardDescription>
            Bypass external authentication server (port 3000) and sign in directly for local development.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <p className="font-medium">Development Mode Active</p>
            <p className="text-xs mt-1">
              Generates a signed JWT matching backend verification (<Badge variant="outline" className="text-[10px] py-0">admin-backend</Badge> / <Badge variant="outline" className="text-[10px] py-0">vp-esr</Badge>).
            </p>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full justify-between"
              size="lg"
              onClick={() => handleLogin('admin')}
              disabled={loadingRole !== null}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Sign in as Admin
              </span>
              <span>{loadingRole === 'admin' ? 'Logging in...' : '→'}</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between"
              size="lg"
              onClick={() => handleLogin('viewer')}
              disabled={loadingRole !== null}
            >
              <span className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Sign in as Viewer
              </span>
              <span>{loadingRole === 'viewer' ? 'Logging in...' : '→'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
