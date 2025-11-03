import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ROLE_PATHS: Record<string, string> = {
  admin: '/admin',
  manager: '/admin',
  chef: '/kitchen',
  waiter: '/waiter',
  customer: '/customer',
};

/**
 * Component that redirects users based on their role status:
 * - No role → ProfileCompletion
 * - Has role → Their role's panel
 */
export function RoleRedirect() {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!userRole) {
      // User is authenticated but has no role → Profile completion
      navigate('/profile-completion', { replace: true });
      return;
    }

    // User has a role → Redirect to their panel
    const path = ROLE_PATHS[userRole] || '/';
    navigate(path, { replace: true });
  }, [user, userRole, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

