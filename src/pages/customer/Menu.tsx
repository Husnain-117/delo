import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, ShoppingCart, Star, Plus } from 'lucide-react';

export default function CustomerMenu() {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    if (user) {
      fetchCartCount();
    }
  }, [user]);

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

  const fetchCartCount = async () => {
    const { data, error } = await (supabase as any)
      .from('cart_items')
      .select(`
        quantity,
        menu_items:menu_item_id (price)
      `)
      .eq('user_id', user?.id);

    if (!error && data) {
      const count = data.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const total = data.reduce((sum: number, item: any) => {
        const price = item.menu_items?.price || 0;
        return sum + (price * item.quantity);
      }, 0);
      setCartCount(count);
      setCartTotal(total);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = async (item: any) => {
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in to add items to cart', variant: 'destructive' });
      return;
    }

    try {
      // Check if item already exists in cart
      const { data: existingItem } = await (supabase as any)
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('menu_item_id', item.id)
        .maybeSingle();

      if (existingItem) {
        // Update quantity
        const { error } = await (supabase as any)
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await (supabase as any)
          .from('cart_items')
          .insert({
            user_id: user.id,
            menu_item_id: item.id,
            quantity: 1
          });

        if (error) throw error;
      }

      toast({ title: 'Success', description: `${item.name} added to cart` });
      fetchCartCount();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };


  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Our Menu</h1>
      
      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
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
            size="sm"
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              size="sm"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                setSelectedItem(item);
                setIsDetailOpen(true);
              }}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span>4.5</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                {item.allergens && item.allergens.length > 0 && (
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {item.allergens.map((allergen: string) => (
                      <Badge key={allergen} variant="outline" className="text-xs">
                        {allergen}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.image_url && (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="w-full h-64 object-cover rounded"
                />
              )}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < 4 ? 'fill-warning text-warning' : 'text-muted'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(125 reviews)</span>
              </div>
              <p className="text-muted-foreground">{selectedItem.description}</p>
              <div className="flex items-center justify-between py-4 border-y">
                <span className="text-sm text-muted-foreground">Preparation Time</span>
                <span className="font-medium">{selectedItem.prep_time_minutes || 15} mins</span>
              </div>
              {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Allergen Information:</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedItem.allergens.map((allergen: string) => (
                      <Badge key={allergen} variant="destructive">{allergen}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-4">
                <span className="text-3xl font-bold text-primary">
                  ${selectedItem.price.toFixed(2)}
                </span>
                <Button
                  size="lg"
                  onClick={() => {
                    addToCart(selectedItem);
                    setIsDetailOpen(false);
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
