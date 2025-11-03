import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Tables() {
  const [tables, setTables] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchTables();

    // Real-time subscription
    const channel = supabase
      .channel('tables_changes')
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-success text-success-foreground',
      occupied: 'bg-info text-info-foreground',
      reserved: 'bg-warning text-warning-foreground',
      cleaning: 'bg-muted text-muted-foreground',
    };
    return colors[status as keyof typeof colors] || colors.available;
  };

  const updateTableStatus = async (tableId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tables')
      .update({ status: newStatus })
      .eq('id', tableId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Table status updated' });
    }
  };

  const handleTableClick = (table: any) => {
    if (table.status === 'available') {
      navigate('/waiter/new-order', { state: { table } });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Tables</h1>
          <p className="text-muted-foreground mt-1">
            Manage table status and seating
          </p>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => (
          <Card
            key={table.id}
            className={`cursor-pointer hover:shadow-lg transition-all ${
              table.status === 'available' ? 'hover:border-primary' : ''
            }`}
            onClick={() => handleTableClick(table)}
          >
            <CardContent className="p-6 text-center space-y-3">
              <div 
                className={`w-16 h-16 mx-auto rounded-full ${getStatusColor(table.status)} flex items-center justify-center text-2xl font-bold`}
              >
                {table.table_number}
              </div>
              
              <div>
                <p className="font-semibold">{table.section}</p>
                <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground mt-1">
                  <Users className="h-4 w-4" />
                  <span>{table.capacity} seats</span>
                </div>
              </div>

              <Badge 
                variant={table.status === 'available' ? 'default' : 'secondary'} 
                className="w-full"
              >
                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
              </Badge>

              {table.status !== 'available' && (
                <div className="flex gap-2 pt-2">
                  {table.status === 'occupied' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTableStatus(table.id, 'cleaning');
                      }}
                    >
                      Mark Cleaning
                    </Button>
                  )}
                  {table.status === 'cleaning' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTableStatus(table.id, 'available');
                      }}
                    >
                      Mark Available
                    </Button>
                  )}
                  {table.status === 'reserved' && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTableStatus(table.id, 'occupied');
                      }}
                    >
                      Seat Guests
                    </Button>
                  )}
                </div>
              )}

              {table.status === 'available' && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/waiter/new-order', { state: { table } });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
