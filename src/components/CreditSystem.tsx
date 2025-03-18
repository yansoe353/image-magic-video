
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";

const CreditSystem = () => {
  const { user, addCredits } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const creditPackages = [
    { amount: 10, price: 5, popular: false },
    { amount: 50, price: 20, popular: true },
    { amount: 100, price: 35, popular: false },
  ];

  const handlePurchase = (amount: number) => {
    setIsLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      addCredits(amount);
      toast.success(`Successfully added ${amount} credits to your account!`);
      setIsLoading(false);
      setOpen(false);
    }, 1500);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm border border-slate-200">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">{user.credits} credits</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full ml-1">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add credits</DialogTitle>
              <DialogDescription>
                Purchase credits to generate more videos
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              {creditPackages.map((pkg) => (
                <Card key={pkg.amount} className={`${pkg.popular ? 'border-brand-purple' : ''} relative`}>
                  {pkg.popular && (
                    <div className="absolute -top-2 -right-2 bg-brand-purple text-white text-xs px-2 py-0.5 rounded-full">
                      Best value
                    </div>
                  )}
                  <CardHeader className="pb-3 pt-4">
                    <CardTitle className="text-xl">{pkg.amount} Credits</CardTitle>
                    <CardDescription>${pkg.price}.00</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      ${(pkg.price / pkg.amount).toFixed(2)} per credit
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handlePurchase(pkg.amount)} 
                      disabled={isLoading}
                      variant={pkg.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      {isLoading ? "Processing..." : "Purchase"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Secure payment processing
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default CreditSystem;
