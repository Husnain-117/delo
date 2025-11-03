import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, ChefHat, UserCircle, ShoppingBag, Briefcase } from 'lucide-react';

interface RoleSelectionDialogProps {
  open: boolean;
  userId: string;
  onRoleSelected: (role: string) => void;
}

export default function RoleSelectionDialog({ open, userId, onRoleSelected }: RoleSelectionDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const roles = [
    { value: 'admin', label: 'Admin', icon: LayoutDashboard, description: 'Full system access' },
    { value: 'manager', label: 'Manager', icon: Briefcase, description: 'Manage operations' },
    { value: 'chef', label: 'Chef', icon: ChefHat, description: 'Kitchen operations' },
    { value: 'waiter', label: 'Waiter', icon: UserCircle, description: 'Table service' },
    { value: 'customer', label: 'Customer', icon: ShoppingBag, description: 'Browse & order' },
  ];

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast({ title: "Error", description: "Please select a role", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // Get the current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    console.log('Assigning role:', selectedRole, 'to user:', user.id);

    const { error } = await supabase.from('user_roles').insert({
      user_id: user.id,
      role: selectedRole as any,
    });

    if (error) {
      console.error('Role assignment error:', error);
      toast({
        title: "Error",
        description: `Failed to assign role: ${error.message}`,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Create customer record if customer role
    if (selectedRole === 'customer') {
      await supabase.from('customers').insert({
        user_id: user.id,
        email: user.email,
      });
    }

    console.log('✅ Role assigned successfully');
    
    toast({
      title: "Success",
      description: `Role assigned: ${selectedRole}`,
    });

    setIsLoading(false);
    
    // Call the callback and reload
    onRoleSelected(selectedRole);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Your Role</DialogTitle>
          <DialogDescription>
            Choose your role to access the system. This cannot be changed later.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 py-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRole === role.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`p-3 rounded-full ${
                  selectedRole === role.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <Label className="text-base font-semibold cursor-pointer">{role.label}</Label>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === role.value ? 'border-primary' : 'border-muted'
                }`}>
                  {selectedRole === role.value && (
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSubmit}
            disabled={!selectedRole || isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? 'Assigning Role...' : 'Confirm Role'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
