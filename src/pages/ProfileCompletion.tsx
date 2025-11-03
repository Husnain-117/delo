import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  ChefHat, 
  UserCircle, 
  ShoppingBag, 
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Note: 'customer' is not in app_role enum in current DB schema
// Using the valid roles from the database enum
type AppRole = 'admin' | 'manager' | 'chef' | 'waiter' | 'cashier' | 'delivery';

const ROLE_PATHS: Record<AppRole | 'customer', string> = {
  admin: '/admin',
  manager: '/admin',
  chef: '/kitchen',
  waiter: '/waiter',
  cashier: '/admin',
  delivery: '/waiter',
  customer: '/customer',
};

export default function ProfileCompletion() {
  const navigate = useNavigate();
  const { user, userRole, loading, refreshRole } = useAuth();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole | 'customer' | ''>('');
  const [profileData, setProfileData] = useState({
    phone: '',
    avatar_url: '',
  });
  
  // Check if user already has a role
  useEffect(() => {
    if (!loading && userRole) {
      // User already has a role, redirect to their panel
      const path = ROLE_PATHS[userRole as AppRole] || '/';
      navigate(path, { replace: true });
    }
  }, [userRole, loading, navigate]);

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user already has role, don't show this page
  if (userRole) {
    return null;
  }

  // Include 'customer' as a special case (not in app_role enum but handled via customers table)
  const roles: Array<{ value: AppRole | 'customer'; label: string; icon: typeof LayoutDashboard; description: string }> = [
    { value: 'admin', label: 'Administrator', icon: LayoutDashboard, description: 'Full system access and management' },
    { value: 'manager', label: 'Manager', icon: Briefcase, description: 'Operations and staff management' },
    { value: 'chef', label: 'Chef', icon: ChefHat, description: 'Kitchen operations and order preparation' },
    { value: 'waiter', label: 'Waiter', icon: UserCircle, description: 'Table service and order taking' },
    { value: 'cashier', label: 'Cashier', icon: Briefcase, description: 'Payment processing and checkout' },
    { value: 'delivery', label: 'Delivery', icon: UserCircle, description: 'Delivery service' },
    { value: 'customer', label: 'Customer', icon: ShoppingBag, description: 'Browse menu and place orders' },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a role',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify user is still authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('Not authenticated');
      }

      // Insert role assignment
      // Note: 'customer' role is handled separately via customers table
      if (selectedRole !== 'customer') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: currentUser.id,
            role: selectedRole as 'admin' | 'manager' | 'chef' | 'waiter' | 'cashier' | 'delivery',
          });

        if (roleError) {
          throw roleError;
        }
      }

      // Update profile with additional details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: profileData.phone || null,
          avatar_url: profileData.avatar_url || null,
        })
        .eq('id', currentUser.id);

      if (profileError) {
        console.warn('Profile update error (non-critical):', profileError);
      }

      // Create customer record if customer role
      if (selectedRole === 'customer') {
        const { error: customerError } = await supabase.from('customers').insert({
          user_id: currentUser.id,
          email: currentUser.email,
          phone: profileData.phone || null,
        });
        
        if (customerError) {
          console.warn('Customer record creation error (non-critical):', customerError);
        }
      }

      // Create staff record if staff role
      if (['admin', 'manager', 'chef', 'waiter', 'cashier', 'delivery'].includes(selectedRole)) {
        const { error: staffError } = await supabase.from('staff').insert({
          user_id: currentUser.id,
          department: selectedRole === 'chef' ? 'Kitchen' : selectedRole === 'waiter' || selectedRole === 'delivery' ? 'Service' : 'Management',
          hire_date: new Date().toISOString().split('T')[0],
          is_active: true,
        });
        
        if (staffError) {
          console.warn('Staff record creation error (non-critical):', staffError);
        }
      }

      toast({
        title: 'Success!',
        description: `Profile completed! Redirecting to ${roles.find(r => r.value === selectedRole)?.label} panel...`,
      });

      // Refresh role in context (will check customers table for customer role)
      await refreshRole();
      
      // Redirect to role's panel
      const redirectPath = ROLE_PATHS[selectedRole as AppRole | 'customer'];
      navigate(redirectPath, { replace: true });

    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete profile. Please try again.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="shadow-2xl border-2">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">Complete Your Profile</CardTitle>
                <CardDescription className="text-base mt-1">
                  Welcome, {user.email}! Let's set up your profile and assign your role.
                </CardDescription>
              </div>
            </div>
            
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Your role cannot be changed once selected. Please choose carefully.
              </AlertDescription>
            </Alert>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Role Selection Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Select Your Role <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose the role that best describes your function in the restaurant system.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRole === role.value;

                    return (
                      <div
                        key={role.value}
                        onClick={() => setSelectedRole(role.value)}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-full ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <Label className="text-base font-semibold cursor-pointer block mb-1">
                              {role.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {role.description}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted'
                          }`}>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Profile Details Section */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label className="text-base font-semibold mb-2 block">
                    Additional Profile Information
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add optional details to complete your profile.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar_url">Profile Picture URL</Label>
                    <Input
                      id="avatar_url"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={profileData.avatar_url}
                      onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Allow sign out if they want to cancel
                    if (confirm('Are you sure you want to sign out? You can complete your profile later.')) {
                      supabase.auth.signOut();
                      navigate('/auth');
                    }
                  }}
                >
                  Sign Out
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={!selectedRole || isSubmitting}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

