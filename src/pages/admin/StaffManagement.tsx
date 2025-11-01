import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, UserCheck, UserX, Plus, Edit, Phone, Mail } from 'lucide-react';

export default function StaffManagement() {
  const [staff, setStaff] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'waiter',
    department: '',
    salary: 0,
    hire_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('staff')
      .select(`
        *,
        profiles:user_id (full_name, phone),
        user_roles!inner (role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setStaff(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStaff) {
      // Create new user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          }
        }
      });

      if (authError) {
        toast({ title: 'Error', description: authError.message, variant: 'destructive' });
        return;
      }

      if (authData.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: formData.full_name,
          phone: formData.phone
        });

        // Assign role
        await supabase.from('user_roles').insert([{
          user_id: authData.user.id,
          role: formData.role as any
        }]);

        // Create staff record
        const { error: staffError } = await supabase.from('staff').insert({
          user_id: authData.user.id,
          department: formData.department,
          salary: formData.salary,
          hire_date: formData.hire_date
        });

        if (staffError) {
          toast({ title: 'Error', description: staffError.message, variant: 'destructive' });
        } else {
          toast({ title: 'Success', description: 'Staff member added successfully' });
          setIsAddOpen(false);
          resetForm();
          fetchStaff();
        }
      }
    } else {
      // Update existing staff
      const { error: staffError } = await supabase
        .from('staff')
        .update({
          department: formData.department,
          salary: formData.salary,
          hire_date: formData.hire_date
        })
        .eq('id', editingStaff.id);

      await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', editingStaff.user_id);

      if (staffError) {
        toast({ title: 'Error', description: staffError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Staff member updated successfully' });
        setIsAddOpen(false);
        setEditingStaff(null);
        resetForm();
        fetchStaff();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      role: 'waiter',
      department: '',
      salary: 0,
      hire_date: new Date().toISOString().split('T')[0]
    });
  };

  const openEditDialog = (staffMember: any) => {
    setEditingStaff(staffMember);
    setFormData({
      email: '',
      password: '',
      full_name: staffMember.profiles?.full_name || '',
      phone: staffMember.profiles?.phone || '',
      role: staffMember.user_roles?.role || 'waiter',
      department: staffMember.department || '',
      salary: staffMember.salary || 0,
      hire_date: staffMember.hire_date || new Date().toISOString().split('T')[0]
    });
    setIsAddOpen(true);
  };

  const toggleStaffStatus = async (staffMember: any) => {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: !staffMember.is_active })
      .eq('id', staffMember.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Success',
        description: `Staff member ${staffMember.is_active ? 'deactivated' : 'activated'}`
      });
      fetchStaff();
    }
  };

  const activeStaff = staff.filter(s => s.is_active).length;
  const inactiveStaff = staff.filter(s => !s.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingStaff(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {!editingStaff && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {!editingStaff && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="waiter">Waiter</SelectItem>
                        <SelectItem value="chef">Chef</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary ($)</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Update' : 'Add'} Staff Member
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Users className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <UserCheck className="h-10 w-10 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeStaff}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <UserX className="h-10 w-10 text-muted" />
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold">{inactiveStaff}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Department</th>
                <th className="text-left py-3 px-4">Contact</th>
                <th className="text-left py-3 px-4">Hire Date</th>
                <th className="text-left py-3 px-4">Salary</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4 font-medium">{member.profiles?.full_name || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{member.user_roles?.role || 'N/A'}</Badge>
                  </td>
                  <td className="py-3 px-4">{member.department || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 text-sm">
                      {member.profiles?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.profiles.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {new Date(member.hire_date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">${member.salary?.toFixed(2) || '0.00'}</td>
                  <td className="py-3 px-4">
                    <Badge className={member.is_active ? 'bg-success' : 'bg-muted'}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStaffStatus(member)}
                      >
                        {member.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
