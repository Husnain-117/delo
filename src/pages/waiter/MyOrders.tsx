import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, Package, Eye } from 'lucide-react';

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchOrders();

      // Real-time subscription
      const channel = supabase
        .channel('waiter_orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `waiter_id=eq.${user.id}`
          },
          () => {
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu_items(name, price)
        ),
        tables(table_number, section)
      `)
      .eq('waiter_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setOrders(data || []);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Order status updated to ${newStatus}` });
      fetchOrders();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'preparing':
        return <Package className="h-5 w-5 text-info" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning';
      case 'preparing':
        return 'bg-info';
      case 'ready':
        return 'bg-success';
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status));
  const completedOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  const OrderCard = ({ order }: { order: any }) => (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">{order.order_number}</h3>
            {order.tables && (
              <Badge variant="outline">
                Table {order.tables.table_number} - {order.tables.section}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(order.status)}
          <Badge className={getStatusColor(order.status)}>
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <div className="flex-1">
              <span className="font-medium">{item.menu_items?.name}</span>
              <span className="text-muted-foreground"> x{item.quantity}</span>
              {item.special_instructions && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: {item.special_instructions}
                </p>
              )}
            </div>
            <span className="font-medium">${item.item_total.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total:</span>
          <span>${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {order.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => updateOrderStatus(order.id, 'cancelled')}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => updateOrderStatus(order.id, 'preparing')}
          >
            Start Preparing
          </Button>
        </div>
      )}

      {order.status === 'ready' && (
        <div className="mt-4">
          <Button
            className="w-full"
            onClick={() => updateOrderStatus(order.id, 'completed')}
          >
            Mark as Completed
          </Button>
        </div>
      )}
    </Card>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">
            Active Orders ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Order History ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Active Orders</h3>
              <p className="text-muted-foreground">
                You don't have any active orders at the moment
              </p>
            </Card>
          ) : (
            activeOrders.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {completedOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Order History</h3>
              <p className="text-muted-foreground">
                Your completed orders will appear here
              </p>
            </Card>
          ) : (
            completedOrders.map(order => <OrderCard key={order.id} order={order} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
