import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WaiterDashboard() {
  const [tables, setTables] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();
    fetchMyOrders();

    // Real-time subscription
    const channel = supabase
      .channel('waiter_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables'
        },
        () => {
          fetchTables();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchMyOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('table_number');

    if (!error && data) {
      setTables(data);
    }
  };

  const fetchMyOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        tables (
          table_number
        )
      `)
      .eq('waiter_id', user?.id)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMyOrders(data);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-success text-success-foreground',
      occupied: 'bg-info text-info-foreground',
      reserved: 'bg-warning text-warning-foreground',
      cleaning: 'bg-muted text-muted-foreground',
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  const getOrderStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { className: 'bg-warning/20 text-warning border-warning/30', label: 'Pending' },
      preparing: { className: 'bg-info/20 text-info border-info/30', label: 'Preparing' },
      ready: { className: 'bg-success/20 text-success border-success/30', label: 'Ready' },
    };

    const variant = variants[status] || variants.pending;

    return (
      <Badge className={`${variant.className} border`}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waiter Dashboard</h1>
          <p className="text-muted-foreground">Manage tables and take orders</p>
        </div>
        <Button size="lg" onClick={() => navigate('/waiter/new-order')}>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* My Active Orders */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-4">My Active Orders ({myOrders.length})</h2>
          <div className="space-y-3">
            {myOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No active orders</p>
            ) : (
              myOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {order.tables?.table_number || 'TO'}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xl font-bold">${Number(order.total_amount).toFixed(2)}</p>
                    </div>
                    {getOrderStatusBadge(order.status)}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tables Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Restaurant Tables</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => (
            <Card
              key={table.id}
              className="cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => navigate(`/waiter/table/${table.id}`)}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className={`w-16 h-16 mx-auto rounded-full ${getStatusColor(table.status)} flex items-center justify-center text-2xl font-bold`}>
                  {table.table_number}
                </div>
                <div>
                  <p className="font-semibold">{table.section || 'Main'}</p>
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mt-1">
                    <Users className="h-4 w-4" />
                    <span>{table.capacity}</span>
                  </div>
                </div>
                <Badge variant={table.status === 'available' ? 'default' : 'secondary'} className="w-full">
                  {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
