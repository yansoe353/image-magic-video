
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isAdmin, addUserCredits } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { Check, X, ArrowLeft, ExternalLink } from "lucide-react";
import { PaymentRequest } from "@/types/supabase";

interface ExtendedPaymentRequest extends PaymentRequest {
  user_email?: string;
  user_name?: string;
}

const PaymentRequests = () => {
  const [paymentRequests, setPaymentRequests] = useState<ExtendedPaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAndLoadRequests = async () => {
      // Check if user is admin
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
      
      if (!adminStatus) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to view this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      // Load payment requests if user is admin
      loadPaymentRequests();
    };
    
    checkAdminAndLoadRequests();
  }, [toast, navigate]);

  const loadPaymentRequests = async () => {
    try {
      setIsLoading(true);
      
      // Get payment requests with user information
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          users:user_id (
            email,
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map the nested user data to a flatter structure
      const mappedData = data.map((request: any) => ({
        ...request,
        user_email: request.users?.email,
        user_name: request.users?.name
      }));
      
      setPaymentRequests(mappedData);
    } catch (error) {
      console.error('Error loading payment requests:', error);
      toast({
        title: "Error",
        description: "Failed to load payment requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: ExtendedPaymentRequest) => {
    setIsProcessing(true);
    try {
      // Add credits to user account
      const success = await addUserCredits(
        request.user_id,
        request.image_credits,
        request.video_credits
      );
      
      if (!success) {
        throw new Error("Failed to add credits to user account");
      }
      
      // Update request status in database
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);
        
      if (error) throw error;
      
      toast({
        title: "Payment Approved",
        description: `Credits added to user's account.`,
      });
      
      // Reload the payment requests
      loadPaymentRequests();
    } catch (error) {
      console.error("Error approving payment:", error);
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (request: ExtendedPaymentRequest) => {
    setIsProcessing(true);
    try {
      // Update request status in database
      const { error } = await supabase
        .from('payment_requests')
        .update({ status: 'rejected' })
        .eq('id', request.id);
        
      if (error) throw error;
      
      toast({
        title: "Payment Rejected",
        description: "Payment request has been rejected.",
      });
      
      // Reload the payment requests
      loadPaymentRequests();
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading payment requests...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/users")} 
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to User Management
        </Button>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Requests</h1>
        <Button onClick={loadPaymentRequests}>Refresh</Button>
      </div>
      
      <div className="grid gap-4">
        {paymentRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No payment requests found.</p>
          </div>
        ) : (
          paymentRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.user_name || request.email || "Unnamed User"}</CardTitle>
                  <Badge className={
                    request.status === 'approved' 
                      ? 'bg-green-500' 
                      : request.status === 'rejected'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-medium">Reference ID:</span> {request.reference_id}</p>
                    <p className="text-sm"><span className="font-medium">Package:</span> {request.package_name}</p>
                    <p className="text-sm"><span className="font-medium">Amount:</span> {request.amount}</p>
                    <p className="text-sm"><span className="font-medium">Credits:</span> {request.image_credits} Image, {request.video_credits} Video</p>
                    <p className="text-sm"><span className="font-medium">User:</span> {request.user_email || request.email}</p>
                    <p className="text-sm"><span className="font-medium">Date:</span> {new Date(request.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-full max-h-40 overflow-hidden rounded mb-2">
                      <img 
                        src={request.screenshot_url} 
                        alt="Payment Screenshot" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <a 
                      href={request.screenshot_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center"
                    >
                      View full image <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleApprove(request)}
                          disabled={isProcessing}
                        >
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleReject(request)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PaymentRequests;
