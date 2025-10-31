import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveOrders();

    // Real-time subscription
    const channel = supabase
      .channel('kitchen_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchActiveOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        () => {
          fetchActiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        tables (
          table_number
        ),
        order_items (
          *,
          menu_items (
            name,
            prep_time_minutes
          )
        )
      `)
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      setOrders(data);
    }
  };

  const handleStartOrder = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'preparing' })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Order Started",
        description: "Order is now being prepared",
      });
    }
  };

  const handleMarkReady = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'ready' })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Order Ready",
        description: "Order marked as ready for pickup",
      });
    }
  };

  const handleToggleItem = async (itemId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('order_items')
      .update({ is_ready: !currentStatus })
      .eq('id', itemId);

    if (!error) {
      fetchActiveOrders();
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return `${minutes} min`;
  };

  const getPriorityClass = (createdAt: string) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (minutes > 20) return 'border-destructive bg-destructive/10';
    if (minutes > 10) return 'border-warning bg-warning/10';
    return 'border-success bg-success/10';
  };

  return (
    <div className="min-h-screen bg-sidebar p-8 dark">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-sidebar-foreground">Kitchen Display System</h1>
            <p className="text-sidebar-foreground/60 text-lg mt-1">
              {orders.length} active orders in queue
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-sidebar-foreground">
              {new Date().toLocaleTimeString()}
            </p>
            <p className="text-sm text-sidebar-foreground/60">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Order Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.length === 0 ? (
            <Card className="col-span-full bg-card">
              <CardContent className="py-16 text-center">
                <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
                <p className="text-2xl font-semibold text-card-foreground">All caught up!</p>
                <p className="text-muted-foreground mt-2">No active orders at the moment</p>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const elapsedTime = getElapsedTime(order.created_at);
              const priorityClass = getPriorityClass(order.created_at);
              const allItemsReady = order.order_items?.every((item: any) => item.is_ready);

              return (
                <Card
                  key={order.id}
                  className={`border-2 ${priorityClass} transition-all`}
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-bold">#{order.order_number.split('-')[1]}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.tables?.table_number 
                            ? `Table ${order.tables.table_number}` 
                            : order.order_type === 'takeout' ? 'Takeout' : 'Delivery'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-2xl font-bold">
                          <Clock className="h-6 w-6" />
                          <span>{elapsedTime}</span>
                        </div>
                        <Badge
                          variant={order.status === 'pending' ? 'secondary' : 'default'}
                          className="mt-2"
                        >
                          {order.status === 'pending' ? 'New Order' : 'In Progress'}
                        </Badge>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {order.order_items?.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-background/50"
                        >
                          <input
                            type="checkbox"
                            checked={item.is_ready}
                            onChange={() => handleToggleItem(item.id, item.is_ready)}
                            className="w-5 h-5 rounded border-2 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className={`font-semibold text-lg ${item.is_ready ? 'line-through text-muted-foreground' : ''}`}>
                              {item.quantity}x {item.menu_items?.name}
                            </p>
                            {item.special_instructions && (
                              <p className="text-sm text-warning mt-1 font-medium">
                                ⚠️ {item.special_instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Special Instructions */}
                    {order.special_instructions && (
                      <div className="p-3 bg-warning/20 border border-warning/30 rounded-lg">
                        <p className="text-sm font-semibold text-warning flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Order Notes
                        </p>
                        <p className="text-sm mt-1">{order.special_instructions}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 space-y-2">
                      {order.status === 'pending' ? (
                        <Button
                          className="w-full h-12 text-lg font-semibold"
                          onClick={() => handleStartOrder(order.id)}
                        >
                          Start Preparing
                        </Button>
                      ) : (
                        <Button
                          className="w-full h-12 text-lg font-semibold"
                          variant={allItemsReady ? 'default' : 'secondary'}
                          onClick={() => handleMarkReady(order.id)}
                          disabled={!allItemsReady}
                        >
                          {allItemsReady ? '✓ Mark as Ready' : 'Complete All Items First'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
