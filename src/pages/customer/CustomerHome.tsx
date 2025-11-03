import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Calendar, Award, History, ArrowRight } from 'lucide-react';

export default function CustomerHome() {
  const [customerData, setCustomerData] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCustomerData();
      fetchRecentOrders();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (!error && data) {
      setCustomerData(data);
    }
  };

  const fetchRecentOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setRecentOrders(data);
    }
  };

  const getTierBadge = (tier: string) => {
    const tiers = {
      bronze: { className: 'bg-amber-600 text-white', icon: '🥉' },
      silver: { className: 'bg-gray-400 text-white', icon: '🥈' },
      gold: { className: 'bg-yellow-500 text-white', icon: '🥇' },
      platinum: { className: 'bg-purple-600 text-white', icon: '💎' },
    };

    const tierData = tiers[tier as keyof typeof tiers] || tiers.bronze;

    return (
      <Badge className={`${tierData.className} text-sm px-3 py-1`}>
        {tierData.icon} {tier.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-secondary p-8 text-primary-foreground">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            Welcome Back{user ? `, ${user.email?.split('@')[0]}` : ''}!
          </h1>
          <p className="text-lg opacity-90 mb-6">
            Discover delicious meals and earn rewards with every order
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="font-semibold"
            onClick={() => navigate('/customer/menu')}
          >
            Order Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        <div className="absolute top-0 right-0 opacity-10 text-9xl">
          🍽️
        </div>
      </div>

      {/* Loyalty Progress */}
      {customerData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Loyalty Rewards</CardTitle>
                <CardDescription>Your membership tier and points</CardDescription>
              </div>
              {getTierBadge(customerData.membership_tier)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-primary/5">
                <div className="text-3xl font-bold text-primary">{customerData.loyalty_points}</div>
                <p className="text-sm text-muted-foreground mt-1">Points</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/5">
                <div className="text-3xl font-bold text-success">{customerData.total_orders}</div>
                <p className="text-sm text-muted-foreground mt-1">Orders</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning/5">
                <div className="text-3xl font-bold text-warning">${Number(customerData.total_spent).toFixed(0)}</div>
                <p className="text-sm text-muted-foreground mt-1">Total Spent</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Next tier: Silver</span>
                <span className="font-semibold">{customerData.loyalty_points}/500 pts</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${Math.min((customerData.loyalty_points / 500) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate('/customer/menu')}>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Order Now</h3>
              <p className="text-sm text-muted-foreground">Browse our menu</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate('/customer/orders')}>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-info/10 flex items-center justify-center group-hover:bg-info group-hover:text-info-foreground transition-all">
              <History className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">My Orders</h3>
              <p className="text-sm text-muted-foreground">Track orders</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate('/customer/reservations')}>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 flex items-center justify-center group-hover:bg-warning group-hover:text-warning-foreground transition-all">
              <Calendar className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Reservations</h3>
              <p className="text-sm text-muted-foreground">Book a table</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => navigate('/customer/rewards')}>
          <CardContent className="pt-6 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success group-hover:text-success-foreground transition-all">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Rewards</h3>
              <p className="text-sm text-muted-foreground">Redeem points</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Recent Orders</CardTitle>
          <CardDescription>Your order history</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders yet</p>
              <Button className="mt-4" onClick={() => navigate('/customer/menu')}>
                Place Your First Order
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
                >
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${Number(order.total_amount).toFixed(2)}</p>
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
