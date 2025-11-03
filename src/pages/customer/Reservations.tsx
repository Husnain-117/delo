import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Construction } from 'lucide-react';

export default function Reservations() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Table Reservations</h1>

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
                Table reservation feature is currently under development
              </p>
              <p className="text-sm text-muted-foreground">
                Soon you'll be able to:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 mt-4 max-w-md mx-auto text-left">
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Book tables in advance
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Choose your preferred date and time
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Select seating preferences
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  View and manage your reservations
                </li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/customer')}>
                Back to Home
              </Button>
              <Button variant="outline" onClick={() => navigate('/customer/menu')}>
                Browse Menu
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
