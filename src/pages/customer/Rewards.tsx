import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, Gift, Star, Trophy } from 'lucide-react';

export default function Rewards() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Rewards & Points</h1>

        {/* Coming Soon Card */}
        <Card className="p-12 text-center">
          <CardContent className="space-y-6 pt-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Construction className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
              <p className="text-muted-foreground text-lg mb-4">
                Rewards redemption feature is currently under development
              </p>
              <p className="text-sm text-muted-foreground">
                Soon you'll be able to redeem your loyalty points for:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
                <div className="p-4 border rounded-lg">
                  <Gift className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Free Items</h3>
                  <p className="text-xs text-muted-foreground">
                    Get complimentary meals and beverages
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Discounts</h3>
                  <p className="text-xs text-muted-foreground">
                    Redeem points for order discounts
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Exclusive Perks</h3>
                  <p className="text-xs text-muted-foreground">
                    Access to VIP benefits and offers
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/customer')}>
                Back to Home
              </Button>
              <Button variant="outline" onClick={() => navigate('/customer/menu')}>
                Order & Earn Points
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
