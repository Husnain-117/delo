import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus, Eye, ShoppingCart } from 'lucide-react';
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

  // Calculate stats
  const stats = {
    activeOrders: myOrders.length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    availableTables: tables.filter(t => t.status === 'available').length,
    totalTables: tables.length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waiter Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Manage your service area efficiently</p>
        </div>
        <Button size="lg" onClick={() => navigate('/waiter/new-order')} className="shadow-lg">
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <p className="text-3xl font-bold mt-2">{stats.activeOrders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Tables</p>
                <p className="text-3xl font-bold mt-2">{stats.availableTables}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Occupied Tables</p>
                <p className="text-3xl font-bold mt-2">{stats.occupiedTables}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tables</p>
                <p className="text-3xl font-bold mt-2">{stats.totalTables}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Active Orders */}
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">My Active Orders</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {myOrders.length} {myOrders.length === 1 ? 'order' : 'orders'} requiring attention
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/waiter/orders')}>
              View All Orders
            </Button>
          </div>
          <div className="space-y-3">
            {myOrders.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">No active orders</p>
                <p className="text-sm text-muted-foreground mt-1">All caught up! Ready for new orders.</p>
              </div>
            ) : (
              myOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-5 rounded-xl border-2 hover:border-primary/50 hover:shadow-md transition-all bg-card"
                >
                  <div className="flex items-center space-x-5">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl shadow-md ${
                      order.status === 'ready' ? 'bg-success text-success-foreground' :
                      order.status === 'preparing' ? 'bg-info text-info-foreground' :
                      'bg-warning text-warning-foreground'
                    }`}>
                      {order.tables?.table_number || 'TO'}
                    </div>
                    <div>
                      <p className="font-bold text-xl">{order.order_number}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                        {order.tables?.table_number && (
                          <Badge variant="outline" className="text-xs">
                            Table {order.tables.table_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-5">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ${Number(order.total_amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total amount</p>
                    </div>
                    {getOrderStatusBadge(order.status)}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/waiter/orders')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Restaurant Tables</h2>
            <p className="text-sm text-muted-foreground mt-1">Quick access to table management</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/waiter/tables')}>
            Manage Tables
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.slice(0, 10).map((table) => (
            <Card
              key={table.id}
              className={`cursor-pointer hover:shadow-xl transition-all group border-2 ${
                table.status === 'available' ? 'hover:border-primary' : 
                table.status === 'occupied' ? 'border-info/50' :
                table.status === 'reserved' ? 'border-warning/50' :
                'border-muted'
              }`}
              onClick={() => navigate('/waiter/tables')}
            >
              <CardContent className="p-5 text-center space-y-3">
                <div className={`w-20 h-20 mx-auto rounded-xl ${getStatusColor(table.status)} flex items-center justify-center text-3xl font-bold shadow-lg`}>
                  {table.table_number}
                </div>
                <div>
                  <p className="font-semibold text-base">{table.section || 'Main'}</p>
                  <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mt-1">
                    <Users className="h-4 w-4" />
                    <span>{table.capacity} seats</span>
                  </div>
                </div>
                <Badge 
                  variant={table.status === 'available' ? 'default' : 'secondary'} 
                  className="w-full text-xs py-1"
                >
                  {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        {tables.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => navigate('/waiter/tables')}>
              View All {tables.length} Tables
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
