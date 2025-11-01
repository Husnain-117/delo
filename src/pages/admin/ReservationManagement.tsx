import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Plus, Edit, Check, X } from 'lucide-react';

export default function ReservationManagement() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    guest_name: string;
    guest_phone: string;
    guest_email: string;
    party_size: number;
    reservation_date: string;
    reservation_time: string;
    table_id: string;
    special_requests: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'no_show';
  }>({
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    party_size: 2,
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '18:00',
    table_id: '',
    special_requests: '',
    status: 'pending'
  });

  useEffect(() => {
    fetchReservations();
    fetchTables();
  }, []);

  const fetchReservations = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        tables (table_number, capacity)
      `)
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setReservations(data || []);
    }
  };

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number');

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setTables(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingReservation) {
      const { error } = await supabase
        .from('reservations')
        .update(formData)
        .eq('id', editingReservation.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Reservation updated successfully' });
        setIsAddOpen(false);
        setEditingReservation(null);
        resetForm();
        fetchReservations();
      }
    } else {
      const { error } = await supabase
        .from('reservations')
        .insert([formData]);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Reservation created successfully' });
        setIsAddOpen(false);
        resetForm();
        fetchReservations();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      guest_name: '',
      guest_phone: '',
      guest_email: '',
      party_size: 2,
      reservation_date: new Date().toISOString().split('T')[0],
      reservation_time: '18:00',
      table_id: '',
      special_requests: '',
      status: 'pending'
    });
  };

  const openEditDialog = (reservation: any) => {
    setEditingReservation(reservation);
    setFormData({
      guest_name: reservation.guest_name,
      guest_phone: reservation.guest_phone,
      guest_email: reservation.guest_email || '',
      party_size: reservation.party_size,
      reservation_date: reservation.reservation_date,
      reservation_time: reservation.reservation_time,
      table_id: reservation.table_id || '',
      special_requests: reservation.special_requests || '',
      status: reservation.status
    });
    setIsAddOpen(true);
  };

  const updateReservationStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'no_show') => {
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Reservation ${status}` });
      fetchReservations();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success';
      case 'cancelled': return 'bg-destructive';
      case 'no_show': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Reservation Management</h1>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingReservation(null); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingReservation ? 'Edit Reservation' : 'New Reservation'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest_name">Guest Name</Label>
                  <Input
                    id="guest_name"
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest_phone">Phone</Label>
                  <Input
                    id="guest_phone"
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guest_email">Email</Label>
                  <Input
                    id="guest_email"
                    type="email"
                    value={formData.guest_email}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="party_size">Party Size</Label>
                  <Input
                    id="party_size"
                    type="number"
                    min="1"
                    value={formData.party_size}
                    onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reservation_date">Date</Label>
                  <Input
                    id="reservation_date"
                    type="date"
                    value={formData.reservation_date}
                    onChange={(e) => setFormData({ ...formData, reservation_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reservation_time">Time</Label>
                  <Input
                    id="reservation_time"
                    type="time"
                    value={formData.reservation_time}
                    onChange={(e) => setFormData({ ...formData, reservation_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table_id">Table</Label>
                  <Select value={formData.table_id} onValueChange={(value) => setFormData({ ...formData, table_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.table_number} (Capacity: {table.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="special_requests">Special Requests</Label>
                  <Textarea
                    id="special_requests"
                    value={formData.special_requests}
                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingReservation ? 'Update' : 'Create'} Reservation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <CalendarIcon className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Reservations</p>
              <p className="text-2xl font-bold">{reservations.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <CalendarIcon className="h-10 w-10 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingReservations}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <CalendarIcon className="h-10 w-10 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold">{confirmedReservations}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Date & Time</th>
                <th className="text-left py-3 px-4">Guest Name</th>
                <th className="text-left py-3 px-4">Contact</th>
                <th className="text-left py-3 px-4">Party Size</th>
                <th className="text-left py-3 px-4">Table</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{new Date(reservation.reservation_date).toLocaleDateString()}</span>
                      <span className="text-sm text-muted-foreground">{reservation.reservation_time}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{reservation.guest_name}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col text-sm">
                      <span>{reservation.guest_phone}</span>
                      {reservation.guest_email && <span className="text-muted-foreground">{reservation.guest_email}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">{reservation.party_size} guests</td>
                  <td className="py-3 px-4">{reservation.tables?.table_number || 'Not assigned'}</td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(reservation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {reservation.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                        >
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                      >
                        <X className="h-4 w-4 text-destructive" />
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
