import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';

export default function CustomerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchOrders();
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
        )
      `)
      .eq('customer_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setOrders(data || []);
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
          <h3 className="font-semibold text-lg">{order.order_number}</h3>
          <p className="text-sm text-muted-foreground">
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
          <div key={item.id} className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-medium">{item.menu_items?.name}</span>
              <span className="text-muted-foreground"> x{item.quantity}</span>
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
        <div className="flex justify-between text-sm">
          <span>Tax:</span>
          <span>${order.tax_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Service Charge:</span>
          <span>${order.service_charge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total:</span>
          <span>${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {order.status === 'preparing' && (
        <div className="mt-4 p-3 bg-info/10 rounded-lg">
          <p className="text-sm text-center">
            Your order is being prepared. Estimated time: 15-20 mins
          </p>
        </div>
      )}

      {order.status === 'ready' && (
        <div className="mt-4 p-3 bg-success/10 rounded-lg">
          <p className="text-sm text-center font-medium">
            Your order is ready for pickup!
          </p>
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
                  Your past orders will appear here
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
