import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, ChefHat, UserCircle, ShoppingBag, LogOut } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const roles = [
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'Complete management & analytics dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      className: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70',
      available: ['admin', 'manager'].includes(userRole || ''),
    },
    {
      id: 'kitchen',
      title: 'Kitchen Display',
      description: 'Real-time order preparation system',
      icon: ChefHat,
      path: '/kitchen',
      className: 'bg-gradient-to-br from-warning to-warning/80 text-warning-foreground hover:from-warning/90 hover:to-warning/70',
      available: ['admin', 'manager', 'chef'].includes(userRole || ''),
    },
    {
      id: 'waiter',
      title: 'Waiter Panel',
      description: 'Table management & order taking',
      icon: UserCircle,
      path: '/waiter',
      className: 'bg-gradient-to-br from-info to-info/80 text-info-foreground hover:from-info/90 hover:to-info/70',
      available: ['admin', 'manager', 'waiter'].includes(userRole || ''),
    },
    {
      id: 'customer',
      title: 'Customer App',
      description: 'Browse menu & place orders',
      icon: ShoppingBag,
      path: '/customer',
      className: 'bg-gradient-to-br from-success to-success/80 text-success-foreground hover:from-success/90 hover:to-success/70',
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Restaurant POS System</h1>
            <p className="text-muted-foreground text-lg">
              Select your role to continue • Logged in as <span className="font-semibold">{user.email}</span>
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="lg">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isAvailable = role.available;

            return (
              <Card
                key={role.id}
                className={`group cursor-pointer transition-all hover:shadow-2xl ${
                  !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={() => isAvailable && navigate(role.path)}
              >
                <CardHeader className={`${role.className} rounded-t-lg transition-all`}>
                  <div className="flex items-center justify-between">
                    <Icon className="h-12 w-12 opacity-90" />
                    {!isAvailable && (
                      <span className="text-xs font-semibold bg-black/20 px-3 py-1 rounded-full">
                        Not Available
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-2xl mt-4">{role.title}</CardTitle>
                  <CardDescription className="text-current/80 text-base">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={!isAvailable}
                  >
                    {isAvailable ? 'Open Panel' : 'Access Restricted'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
