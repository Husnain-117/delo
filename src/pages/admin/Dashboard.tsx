import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, ShoppingCart, Users, UtensilsCrossed, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    occupiedTables: 0,
    totalTables: 0,
    staffOnDuty: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch today's orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate revenue
      const revenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Fetch tables
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('*');

      if (tablesError) throw tablesError;

      const occupied = tables?.filter(t => t.status === 'occupied').length || 0;

      // Fetch staff
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true);

      if (staffError) throw staffError;

      setStats({
        todayRevenue: revenue,
        todayOrders: orders?.length || 0,
        occupiedTables: occupied,
        totalTables: tables?.length || 0,
        staffOnDuty: staff?.length || 0,
      });

      setRecentOrders(orders?.slice(0, 10) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const statCards = [
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: '+12%',
      trendUp: true,
      className: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
    },
    {
      title: "Total Orders",
      value: stats.todayOrders,
      icon: ShoppingCart,
      trend: '+8%',
      trendUp: true,
      className: 'bg-gradient-to-br from-success to-success/80 text-success-foreground',
    },
    {
      title: "Table Occupancy",
      value: `${stats.occupiedTables}/${stats.totalTables}`,
      icon: UtensilsCrossed,
      trend: '75%',
      trendUp: true,
      className: 'bg-gradient-to-br from-warning to-warning/80 text-warning-foreground',
    },
    {
      title: "Staff On Duty",
      value: stats.staffOnDuty,
      icon: Users,
      trend: '100%',
      trendUp: true,
      className: 'bg-gradient-to-br from-info to-info/80 text-info-foreground',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-warning/20 text-warning border-warning/30',
      preparing: 'bg-info/20 text-info border-info/30',
      ready: 'bg-success/20 text-success border-success/30',
      completed: 'bg-muted text-muted-foreground border-border',
      cancelled: 'bg-destructive/20 text-destructive border-destructive/30',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time operational insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;

          return (
            <Card key={index} className={`${stat.className} border-none`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center mt-2 text-xs opacity-80">
                  <TrendIcon className="h-3 w-3 mr-1" />
                  <span>{stat.trend} from yesterday</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders today</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_type.replace('_', ' ')}
                        {order.table_id && ' • Table order'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-bold">${Number(order.total_amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
