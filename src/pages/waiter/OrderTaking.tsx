import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Minus, ShoppingCart, X } from 'lucide-react';

export default function OrderTaking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(location.state?.table || null);
  const [tables, setTables] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchAvailableTables();
  }, []);

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*, menu_categories(name)')
      .eq('is_available', true)
      .order('name');

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setMenuItems(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('menu_categories')
      .select('*')
      .order('display_order');
    setCategories(data || []);
  };

  const fetchAvailableTables = async () => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'available')
      .order('table_number');
    setTables(data || []);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: any, quantity: number = 1, instructions: string = '') => {
    const existingItem = cart.find(cartItem => 
      cartItem.id === item.id && cartItem.special_instructions === instructions
    );

    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id && cartItem.special_instructions === instructions
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity, special_instructions: instructions }]);
    }
    
    setIsDetailOpen(false);
    toast({ title: 'Success', description: `${item.name} added to cart` });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast({ title: 'Error', description: 'Cart is empty', variant: 'destructive' });
      return;
    }

    if (!selectedTable) {
      toast({ title: 'Error', description: 'Please select a table', variant: 'destructive' });
      return;
    }

    try {
      const subtotal = getTotalAmount();
      const taxAmount = subtotal * 0.1; // 10% tax
      const serviceCharge = subtotal * 0.05; // 5% service charge
      const totalAmount = subtotal + taxAmount + serviceCharge;

      // Generate order number
      const { data: orderNumber, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) throw orderNumberError;

      // Create order with waiter_id
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          waiter_id: user?.id,
          table_id: selectedTable.id,
          order_type: 'dine_in',
          status: 'pending',
          payment_method: 'cash',
          payment_status: 'pending',
          subtotal,
          tax_amount: taxAmount,
          service_charge: serviceCharge,
          total_amount: totalAmount
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        item_total: item.price * item.quantity,
        special_instructions: item.special_instructions || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update table status
      await supabase
        .from('tables')
        .update({ status: 'occupied', current_order_id: orderData.id })
        .eq('id', selectedTable.id);

      toast({ title: 'Success!', description: `Order ${orderNumber} placed successfully!` });
      setCart([]);
      setSelectedTable(null);
      navigate('/waiter/orders');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Take Order</h1>
        {selectedTable && (
          <p className="text-sm text-muted-foreground">
            Table: {selectedTable.table_number}
          </p>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Menu Items */}
        <div className="flex-1 flex flex-col p-4 overflow-auto">
          <div className="mb-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                All Items
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="p-4 cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedItem(item);
                  setIsDetailOpen(true);
                }}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <h3 className="font-semibold mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                  <Button size="sm" onClick={(e) => {
                    e.stopPropagation();
                    addToCart(item);
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="w-96 border-l bg-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </h2>
          </div>

          <div className="flex-1 overflow-auto space-y-2 mb-4">
            {cart.map((item, index) => (
              <Card key={`${item.id}-${index}`} className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    {item.special_instructions && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: {item.special_instructions}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${getTotalAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (10%):</span>
              <span>${(getTotalAmount() * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Service (5%):</span>
              <span>${(getTotalAmount() * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${(getTotalAmount() * 1.15).toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={submitOrder}
              disabled={cart.length === 0}
            >
              Submit Order
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.image_url && (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-full h-48 object-cover rounded"
                />
              )}
              <p className="text-muted-foreground">{selectedItem.description}</p>
              <p className="text-2xl font-bold text-primary">
                ${selectedItem.price.toFixed(2)}
              </p>
              {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Allergens:</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedItem.allergens.map((allergen: string) => (
                      <Badge key={allergen} variant="outline">{allergen}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold">Special Instructions:</label>
                <Textarea
                  id="instructions"
                  placeholder="Any special requests..."
                  className="mt-2"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  const instructions = (document.getElementById('instructions') as HTMLTextAreaElement)?.value || '';
                  addToCart(selectedItem, 1, instructions);
                }}
              >
                Add to Cart
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
