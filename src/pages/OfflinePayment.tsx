
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BadgeCheck, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  image_credits: number;
  video_credits: number;
  price: number;
}

interface PaymentRequest {
  id: string;
  package_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_details: any;
  reference_number: string | null;
  created_at: string;
}

const OfflinePayment = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("bank");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    image_credits: number;
    video_credits: number;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadPackages();
    loadUserProfile();
    loadPaymentRequests();
  }, []);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setPackages(data as CreditPackage[]);
        setSelectedPackage(data[0] as CreditPackage);
      }
    } catch (error) {
      console.error("Error loading credit packages:", error);
      toast({
        title: "Error",
        description: "Failed to load credit packages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, image_credits, video_credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data as { id: string; image_credits: number; video_credits: number });
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadPaymentRequests = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentRequests(data as PaymentRequest[] || []);
    } catch (error) {
      console.error("Error loading payment requests:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) {
      toast({
        title: "Error",
        description: "Please select a credit package",
        variant: "destructive",
      });
      return;
    }

    if (!referenceNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a reference number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const user = await getCurrentUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to purchase credits",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Submit payment request to Supabase
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount: selectedPackage.price,
          payment_method: paymentMethod,
          payment_details: {
            package_name: selectedPackage.name,
            image_credits: selectedPackage.image_credits,
            video_credits: selectedPackage.video_credits,
          },
          reference_number: referenceNumber,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Payment Request Submitted",
        description: "Your payment request has been submitted and is pending approval.",
      });

      // Reset form and reload payment requests
      setReferenceNumber("");
      setAttachmentFile(null);
      loadPaymentRequests();
    } catch (error) {
      console.error("Error submitting payment request:", error);
      toast({
        title: "Error",
        description: "Failed to submit payment request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return "text-green-500";
      case 'pending':
        return "text-amber-500";
      case 'rejected':
        return "text-red-500";
      default:
        return "text-slate-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <BadgeCheck className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Info className="h-4 w-4 text-amber-500" />;
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Buy Credits</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          {userProfile && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Your Current Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Image Credits:</span>
                    <span className="font-semibold">{userProfile.image_credits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Video Credits:</span>
                    <span className="font-semibold">{userProfile.video_credits}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>Select a package and payment method</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="package">Select Credit Package</Label>
                  <Select
                    value={selectedPackage?.id || ""}
                    onValueChange={(value) => {
                      const pkg = packages.find(p => p.id === value);
                      setSelectedPackage(pkg || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a package" />
                    </SelectTrigger>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - ${pkg.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPackage && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Package:</span>
                          <span className="font-semibold">{selectedPackage.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Image Credits:</span>
                          <span className="font-semibold">{selectedPackage.image_credits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Video Credits:</span>
                          <span className="font-semibold">{selectedPackage.video_credits}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Price:</span>
                          <span className="text-lg">${selectedPackage.price}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank">Bank Transfer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mobile" id="mobile" />
                      <Label htmlFor="mobile">Mobile Payment</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Alert>
                  <AlertTitle>Payment Instructions</AlertTitle>
                  <AlertDescription>
                    <p>Please make your payment to one of the following accounts:</p>
                    <div className="mt-2 space-y-1 text-xs">
                      {paymentMethod === "bank" ? (
                        <>
                          <p><strong>Bank Name:</strong> Myanmar Economic Bank</p>
                          <p><strong>Account Name:</strong> Infinity Tech Co., Ltd</p>
                          <p><strong>Account Number:</strong> 01234-56789-01234</p>
                        </>
                      ) : (
                        <>
                          <p><strong>KBZ Pay:</strong> 09123456789</p>
                          <p><strong>Wave Money:</strong> 09987654321</p>
                        </>
                      )}
                    </div>
                    <p className="mt-2 text-sm">After payment, please enter the reference number below.</p>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="reference">Reference Number / Transaction ID</Label>
                  <Input
                    id="reference"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Enter payment reference number"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedPackage || !referenceNumber.trim()}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Payment Request"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your recent payment requests</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentRequests.length === 0 ? (
                <p className="text-center text-slate-500 py-6">No payment history yet</p>
              ) : (
                <div className="space-y-4">
                  {paymentRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              Package: {request.payment_details?.package_name || request.package_id}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatDate(request.created_at)}
                            </p>
                            <p className="text-sm mt-1">
                              <span className="font-medium">Amount:</span> ${request.amount}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Reference:</span> {request.reference_number || "N/A"}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {getStatusIcon(request.status)}
                            <span className={`ml-1 font-semibold ${getStatusColor(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfflinePayment;
